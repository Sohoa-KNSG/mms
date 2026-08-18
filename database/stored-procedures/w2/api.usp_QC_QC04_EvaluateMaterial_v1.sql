CREATE OR ALTER PROCEDURE api.usp_QC_QC04_EvaluateMaterial_v1
    @UserId nvarchar(50),
    @InspectionId int,
    @ReceivingLineId int,
    @InspectionType nvarchar(50),
    @InspectedQuantity decimal(19,4),
    @FailedQuantity decimal(19,4),
    @OverallResultCode nvarchar(50),
    @Results api.QcEvaluationItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_qc_danhgia_vattu', N'scr_qc_info_danhgia')
    )
        THROW 51001, N'Không có quyền đánh giá vật tư.', 1;

    SET @InspectionType = NULLIF(LTRIM(RTRIM(@InspectionType)), N'');
    SET @OverallResultCode = NULLIF(LTRIM(RTRIM(@OverallResultCode)), N'');
    IF @InspectionType NOT IN (N'AQL', N'100%')
        THROW 51022, N'Loại kiểm chỉ nhận AQL hoặc 100%.', 1;
    IF @OverallResultCode NOT IN (N'1', N'2', N'3')
        THROW 51022, N'Kết luận chỉ nhận 1 (Đạt), 2 (Không Đạt), 3 (Nhân Nhượng).', 1;
    IF @InspectedQuantity <= 0 OR @FailedQuantity < 0 OR @FailedQuantity > @InspectedQuantity
        THROW 51022, N'Số lượng kiểm/không đạt không hợp lệ.', 1;

    -- Normalize result items to standard codes
    DECLARE @NormalizedResults TABLE (
        CriterionId int NOT NULL,
        ResultCode nvarchar(50) NOT NULL,
        DefectNote nvarchar(max) NULL
    );

    INSERT INTO @NormalizedResults (CriterionId, ResultCode, DefectNote)
    SELECT
        CriterionId,
        CASE
            WHEN LTRIM(RTRIM(ResultCode)) IN (N'Đạt', N'Dat', N'PASS', N'pass', N'1', N'True', N'true') THEN N'Đạt'
            WHEN LTRIM(RTRIM(ResultCode)) IN (N'Không Đạt', N'Khong Dat', N'FAIL', N'fail', N'2', N'False', N'false') THEN N'Không Đạt'
            ELSE N'Không Kiểm'
        END,
        NULLIF(LTRIM(RTRIM(DefectNote)), N'')
    FROM @Results;

    IF @OverallResultCode = N'1'
       AND (@FailedQuantity > 0 OR EXISTS (SELECT 1 FROM @NormalizedResults WHERE ResultCode = N'Không Đạt'))
        THROW 51022, N'Kết luận Đạt mâu thuẫn với số lượng/kết quả không đạt.', 1;
    IF @OverallResultCode = N'2'
       AND @FailedQuantity = 0
       AND NOT EXISTS (SELECT 1 FROM @NormalizedResults WHERE ResultCode = N'Không Đạt')
        THROW 51022, N'Kết luận Không Đạt cần ít nhất một lỗi hoặc số lượng không đạt.', 1;

    DECLARE @ReceiptId int;
    DECLARE @CheckId int;
    DECLARE @Unit nvarchar(20);
    DECLARE @ReceivedQuantity decimal(19,4);
    DECLARE @Now datetime = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT
            @ReceiptId = inspection.id_phieu_nhanhang,
            @CheckId = material.ma_kiem,
            @Unit = COALESCE(line.unit, material.unit),
            @ReceivedQuantity = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0))
        FROM dbo.tbl_qc_phieu_kiem AS inspection WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.tbl_chitiet_nhanhang AS line WITH (UPDLOCK, HOLDLOCK)
            ON line.ma_phieu = inspection.id_phieu_nhanhang
           AND line.id_nhanhang = @ReceivingLineId
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
        WHERE inspection.id_phieukiem = @InspectionId
          AND ISNULL(inspection.status_duyet, 0) = 0
          AND line.ket_qua_qc IS NULL;

        IF @ReceiptId IS NULL
            THROW 51009, N'Phiếu kiểm/vật tư không còn ở trạng thái có thể đánh giá.', 1;
        IF @CheckId IS NULL
            THROW 51022, N'Vật tư chưa có mã kiểm.', 1;
        IF @InspectedQuantity > @ReceivedQuantity
            THROW 51022, N'Số lượng kiểm vượt quá số lượng thực nhận.', 1;

        IF EXISTS
        (
            SELECT criterion.id_tc_kiem
            FROM dbo.tbl_tieuchi_kiem AS criterion
            WHERE criterion.ma_kiem = @CheckId
            EXCEPT
            SELECT result.CriterionId FROM @Results AS result
        )
        OR EXISTS
        (
            SELECT result.CriterionId FROM @Results AS result
            EXCEPT
            SELECT criterion.id_tc_kiem
            FROM dbo.tbl_tieuchi_kiem AS criterion
            WHERE criterion.ma_kiem = @CheckId
        )
            THROW 51022, N'Phải cung cấp đúng và đủ tiêu chí của mã kiểm.', 1;

        IF EXISTS
        (
            SELECT 1 FROM dbo.tbl_qc_kiem
            WHERE id_phieukiem = @InspectionId AND id_nhanhang = @ReceivingLineId
        )
            THROW 51009, N'Vật tư đã được đánh giá trong phiếu kiểm này.', 1;

        INSERT dbo.tbl_qc_kiem
        (
            id_nhanhang, id_tieuchi_kiem, id_phieukiem, loai_kiem,
            soluong_kiemtra, soluong_khongdat, ghi_nhan_loi,
            ket_qua_qc, time_cre, user_cre, unit
        )
        SELECT
            @ReceivingLineId, result.CriterionId, @InspectionId, @InspectionType,
            CONVERT(float, @InspectedQuantity), CONVERT(float, @FailedQuantity),
            result.DefectNote, result.ResultCode,
            @Now, @UserId, @Unit
        FROM @NormalizedResults AS result;

        UPDATE dbo.tbl_chitiet_nhanhang
        SET status_nhanhang = N'4', ket_qua_qc = @OverallResultCode
        WHERE id_nhanhang = @ReceivingLineId AND ket_qua_qc IS NULL;
        IF @@ROWCOUNT = 0
            THROW 51009, N'Vật tư đã được cập nhật bởi giao dịch khác.', 1;

        UPDATE dbo.tbl_phieu_nhan_hang SET status_nhap = N'4' WHERE ma_phieu = @ReceiptId;

        INSERT dbo.tbl_his_phieunhap
            (ma_phieu, kho, khach_hang, user_cre, time_cre, ma_po,
             id_bv, status_nhap, action_type, audit_time)
        SELECT CONVERT(nvarchar(50), p.ma_phieu), p.kho, p.khach_hang,
            @UserId, @Now, p.ma_po, p.id_bv, N'4', N'QC_RESULT', @Now
        FROM dbo.tbl_phieu_nhan_hang AS p WHERE p.ma_phieu = @ReceiptId;

        COMMIT TRANSACTION;

        SELECT InspectionId = @InspectionId, ReceivingLineId = @ReceivingLineId,
            OverallResultCode = @OverallResultCode,
            ResultCount = (SELECT COUNT(1) FROM @Results),
            EvaluatedAt = CONVERT(datetime2(7), @Now);
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

