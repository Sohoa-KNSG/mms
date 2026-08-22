CREATE OR ALTER PROCEDURE api.usp_WMS_OUT08_CompleteGoodsIssue_v1
    @UserId nvarchar(50), @RequestId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN
            (N'scr_soanhang_chitiet', N'scr_xuatkho_thutuc', N'scr_xuatkho_tructiep', N'scr_soanhang', N'scr_soanhang_batch', N'scr_mob_soanhang')
    ) THROW 51001, N'Khong co quyen xac nhan xuat kho.', 1;
    DECLARE @IssueDocumentId int, @Now datetime = GETDATE();
    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT TOP (1) @IssueDocumentId = id_phieu_trans
        FROM dbo.tbl_phieu_transaction WITH (UPDLOCK, HOLDLOCK)
        WHERE ma_yeucau = @RequestId AND nghiep_vu = N'OUT_CON'
        ORDER BY id_phieu_trans DESC;

        UPDATE dbo.tbl_phieu_transaction SET trang_thai_phieu = N'2'
        WHERE id_phieu_trans = @IssueDocumentId;

        UPDATE dbo.tbl_phieu_yeucau SET status_soanhang = N'2', time_lap_phieu = @Now
        WHERE id_phieu_yeucau = @RequestId;

        COMMIT TRANSACTION;
        SELECT RequestId = @RequestId, IssueDocumentId = ISNULL(@IssueDocumentId, 0),
            PickingStatusCode = N'2', IssueDocumentStatusCode = N'2', CompletedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
