CREATE OR ALTER PROCEDURE api.usp_QC_QC05_UpdateInspectionResult_v1
    @UserId nvarchar(50),
    @QcResultId int,
    @InspectionType nvarchar(50),
    @InspectedQuantity decimal(19,4),
    @FailedQuantity decimal(19,4),
    @ResultCode nvarchar(50),
    @OverallResultCode nvarchar(50),
    @DefectNote nvarchar(max) = NULL,
    @ExpectedChangedAt datetime2(7)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_qc_log_info_edit'
    )
        THROW 51001, N'Không có quyền hiệu chỉnh lịch sử QC.', 1;

    SET @InspectionType = NULLIF(LTRIM(RTRIM(@InspectionType)), N'');
    SET @ResultCode = NULLIF(LTRIM(RTRIM(@ResultCode)), N'');
    SET @OverallResultCode = NULLIF(LTRIM(RTRIM(@OverallResultCode)), N'');
    SET @DefectNote = NULLIF(LTRIM(RTRIM(@DefectNote)), N'');
    IF @InspectionType NOT IN (N'AQL', N'100%')
        THROW 51022, N'Loại kiểm chỉ nhận AQL hoặc 100%.', 1;
    IF @ResultCode NOT IN (N'Đạt', N'Không Đạt', N'Không Kiểm')
        THROW 51022, N'Kết quả tiêu chí không hợp lệ.', 1;
    IF @OverallResultCode NOT IN (N'1', N'2', N'3')
        THROW 51022, N'Kết luận vật tư không hợp lệ.', 1;
    IF @InspectedQuantity <= 0 OR @FailedQuantity < 0 OR @FailedQuantity > @InspectedQuantity
        THROW 51022, N'Số lượng kiểm/không đạt không hợp lệ.', 1;
    IF @ExpectedChangedAt IS NULL
        THROW 51022, N'ExpectedChangedAt là bắt buộc khi hiệu chỉnh.', 1;

    DECLARE @InspectionId int;
    DECLARE @ReceivingLineId int;
    DECLARE @ReceiptId int;
    DECLARE @CurrentChangedAt datetime2(7);
    DECLARE @Now datetime = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT
            @InspectionId = result.id_phieukiem,
            @ReceivingLineId = result.id_nhanhang,
            @ReceiptId = inspection.id_phieu_nhanhang,
            @CurrentChangedAt = CONVERT(datetime2(7), result.time_cre)
        FROM dbo.tbl_qc_kiem AS result WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.tbl_qc_phieu_kiem AS inspection WITH (UPDLOCK, HOLDLOCK)
            ON inspection.id_phieukiem = result.id_phieukiem
        INNER JOIN dbo.tbl_chitiet_nhanhang AS line WITH (UPDLOCK, HOLDLOCK)
            ON line.id_nhanhang = result.id_nhanhang
        WHERE result.id_qc = @QcResultId
          AND ISNULL(inspection.status_duyet, 0) = 0
          AND ISNULL(line.status_nhanhang, N'') <> N'5';

        IF @InspectionId IS NULL
            THROW 51009, N'Kết quả không tồn tại hoặc phiếu đã khóa.', 1;
        IF @CurrentChangedAt <> @ExpectedChangedAt
            THROW 51009, N'Kết quả QC đã được cập nhật. Hãy tải lại dữ liệu.', 1;

        UPDATE dbo.tbl_qc_kiem
        SET loai_kiem = @InspectionType,
            soluong_kiemtra = CONVERT(float, @InspectedQuantity),
            soluong_khongdat = CONVERT(float, @FailedQuantity),
            user_cre = @UserId
        WHERE id_phieukiem = @InspectionId AND id_nhanhang = @ReceivingLineId;

        UPDATE dbo.tbl_qc_kiem
        SET ket_qua_qc = @ResultCode, ghi_nhan_loi = @DefectNote
        WHERE id_qc = @QcResultId;

        IF @OverallResultCode = N'1'
           AND (@FailedQuantity > 0 OR EXISTS
           (
               SELECT 1 FROM dbo.tbl_qc_kiem
               WHERE id_phieukiem = @InspectionId AND id_nhanhang = @ReceivingLineId
                 AND ket_qua_qc = N'Không Đạt'
           ))
            THROW 51022, N'Kết luận Đạt mâu thuẫn với kết quả chi tiết.', 1;
        IF @OverallResultCode = N'2'
           AND @FailedQuantity = 0
           AND NOT EXISTS
           (
               SELECT 1 FROM dbo.tbl_qc_kiem
               WHERE id_phieukiem = @InspectionId AND id_nhanhang = @ReceivingLineId
                 AND ket_qua_qc = N'Không Đạt'
           )
            THROW 51022, N'Kết luận Không Đạt cần ít nhất một lỗi hoặc số lượng không đạt.', 1;

        UPDATE dbo.tbl_chitiet_nhanhang
        SET ket_qua_qc = @OverallResultCode
        WHERE id_nhanhang = @ReceivingLineId;

        INSERT dbo.tbl_his_phieunhap
            (ma_phieu, kho, khach_hang, user_cre, time_cre, ma_po,
             id_bv, status_nhap, action_type, audit_time)
        SELECT CONVERT(nvarchar(50), p.ma_phieu), p.kho, p.khach_hang,
            @UserId, @Now, p.ma_po, p.id_bv, p.status_nhap, N'QC_EDIT', @Now
        FROM dbo.tbl_phieu_nhan_hang AS p WHERE p.ma_phieu = @ReceiptId;

        COMMIT TRANSACTION;

        SELECT QcResultId = @QcResultId, InspectionId = @InspectionId,
            ReceivingLineId = @ReceivingLineId, ChangedAt = CONVERT(datetime2(7), @Now);
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
