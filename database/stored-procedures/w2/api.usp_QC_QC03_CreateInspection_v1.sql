CREATE OR ALTER PROCEDURE api.usp_QC_QC03_CreateInspection_v1
    @UserId nvarchar(50),
    @ReceiptId int,
    @Note nvarchar(max) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_qc_phieukiem', N'scr_qc_info_danhgia')
    )
        THROW 51001, N'Không có quyền lập phiếu kiểm.', 1;

    SET @Note = NULLIF(LTRIM(RTRIM(@Note)), N'');
    DECLARE @Now datetime = GETDATE();
    DECLARE @InspectionId int;
    DECLARE @WasExisting bit = 0;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS
        (
            SELECT 1 FROM dbo.tbl_phieu_nhan_hang WITH (UPDLOCK, HOLDLOCK)
            WHERE ma_phieu = @ReceiptId
        )
            THROW 51004, N'Không tìm thấy phiếu nhận.', 1;

        IF NOT EXISTS
        (
            SELECT 1
            FROM dbo.tbl_chitiet_nhanhang AS line
            INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
            WHERE line.ma_phieu = @ReceiptId
              AND material.ma_kiem IS NOT NULL
              AND line.ket_qua_qc IS NULL
        )
            THROW 51022, N'Phiếu nhận không còn vật tư chờ kiểm.', 1;

        SELECT TOP (1) @InspectionId = id_phieukiem
        FROM dbo.tbl_qc_phieu_kiem WITH (UPDLOCK, HOLDLOCK)
        WHERE id_phieu_nhanhang = @ReceiptId
          AND ISNULL(status_duyet, 0) = 0
        ORDER BY id_phieukiem DESC;

        IF @InspectionId IS NOT NULL SET @WasExisting = 1;

        IF @InspectionId IS NULL
        BEGIN
            INSERT dbo.tbl_qc_phieu_kiem
                (id_phieu_nhanhang, status_duyet, ghi_chu, user_cre, time_cre)
            VALUES (@ReceiptId, 0, @Note, @UserId, @Now);
            SET @InspectionId = CONVERT(int, SCOPE_IDENTITY());

            INSERT dbo.tbl_his_phieunhap
                (ma_phieu, kho, khach_hang, user_cre, time_cre, ma_po,
                 id_bv, status_nhap, action_type, audit_time)
            SELECT CONVERT(nvarchar(50), p.ma_phieu), p.kho, p.khach_hang,
                @UserId, @Now, p.ma_po, p.id_bv, N'4', N'QC_CREATE', @Now
            FROM dbo.tbl_phieu_nhan_hang AS p
            WHERE p.ma_phieu = @ReceiptId;
        END;

        COMMIT TRANSACTION;

        SELECT InspectionId = @InspectionId, ReceiptId = @ReceiptId,
            CreatedAt = (SELECT time_cre FROM dbo.tbl_qc_phieu_kiem WHERE id_phieukiem = @InspectionId),
            IsExisting = @WasExisting;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
