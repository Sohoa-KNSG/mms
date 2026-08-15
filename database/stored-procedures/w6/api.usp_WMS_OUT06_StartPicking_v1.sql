CREATE OR ALTER PROCEDURE api.usp_WMS_OUT06_StartPicking_v1
    @UserId nvarchar(50), @RequestId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN (N'scr_soanhang', N'scr_soanhang_chitiet')
    ) THROW 51001, N'Khong co quyen bat dau soan hang.', 1;
    DECLARE @EmployeeCode nvarchar(50), @IssueDocumentId int, @Now datetime = GETDATE(),
        @Destination nvarchar(20), @Requester nvarchar(50), @PickingStatus nvarchar(20);
    SELECT @EmployeeCode = CONVERT(nvarchar(50), msnv) FROM dbo.tbl_dm_user
    WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @EmployeeCode IS NULL THROW 51001, N'Tai khoan khong co ma nhan vien.', 1;
    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @Destination = LEFT(ma_bravo_bophan, 20), @Requester = nguoi_lap_phieu,
            @PickingStatus = status_soanhang
        FROM dbo.tbl_phieu_yeucau WITH (UPDLOCK, HOLDLOCK)
        WHERE id_phieu_yeucau = @RequestId AND trang_thai_phieu = N'4'
          AND status_soanhang IN (N'0', N'1');
        IF @PickingStatus IS NULL THROW 51004, N'Phieu khong o trang thai cho hoac dang soan.', 1;
        SELECT TOP (1) @IssueDocumentId = id_phieu_trans
        FROM dbo.tbl_phieu_transaction WITH (UPDLOCK, HOLDLOCK)
        WHERE ma_yeucau = @RequestId AND nghiep_vu = N'OUT_CON'
          AND ISNULL(trang_thai_phieu, N'0') <> N'0' ORDER BY id_phieu_trans DESC;
        IF @IssueDocumentId IS NULL
        BEGIN
            INSERT dbo.tbl_phieu_transaction
                (nghiep_vu, ma_kho_from, ma_kho_to, nguoi_nhan, user_cre, time_cre, trang_thai_phieu, ma_yeucau)
            VALUES (N'OUT_CON', N'20020100', @Destination, @Requester, @EmployeeCode, @Now, N'1', @RequestId);
            SET @IssueDocumentId = CONVERT(int, SCOPE_IDENTITY());
        END;
        IF @PickingStatus = N'0'
            UPDATE dbo.tbl_phieu_yeucau SET status_soanhang = N'1', time_cre = @Now
            WHERE id_phieu_yeucau = @RequestId;
        COMMIT TRANSACTION;
        SELECT RequestId = @RequestId, IssueDocumentId = @IssueDocumentId,
            PickingStatusCode = N'1', StartedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
