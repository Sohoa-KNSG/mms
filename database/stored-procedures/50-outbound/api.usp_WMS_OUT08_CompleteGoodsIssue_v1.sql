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
            (N'scr_soanhang_chitiet', N'scr_xuatkho_thutuc', N'scr_xuatkho_tructiep')
    ) THROW 51001, N'Khong co quyen xac nhan xuat kho.', 1;
    DECLARE @IssueDocumentId int, @Now datetime = GETDATE();
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS
        (
            SELECT 1 FROM dbo.tbl_phieu_yeucau WITH (UPDLOCK, HOLDLOCK)
            WHERE id_phieu_yeucau = @RequestId AND trang_thai_phieu = N'4' AND status_soanhang = N'1'
        ) THROW 51009, N'Phieu khong o trang thai dang soan.', 1;
        SELECT TOP (1) @IssueDocumentId = id_phieu_trans
        FROM dbo.tbl_phieu_transaction WITH (UPDLOCK, HOLDLOCK)
        WHERE ma_yeucau = @RequestId AND nghiep_vu = N'OUT_CON' AND trang_thai_phieu = N'1'
        ORDER BY id_phieu_trans DESC;
        IF @IssueDocumentId IS NULL THROW 51009, N'Khong tim thay phieu xuat dang hoat dong.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_phieu_yeucau_chitiet WHERE id_phieu_yeucau = @RequestId)
            THROW 51022, N'Phieu yeu cau khong co dong vat tu.', 1;
        IF EXISTS
        (
            SELECT 1
            FROM dbo.tbl_phieu_yeucau_chitiet AS line WITH (UPDLOCK, HOLDLOCK)
            OUTER APPLY
            (
                SELECT Issued = SUM(ISNULL(transactionLine.so_luong, 0))
                FROM dbo.tbl_map_xuatkho AS map
                INNER JOIN dbo.tbl_transaction AS transactionLine ON transactionLine.id_trans = map.id_trans
                WHERE map.id_chitiet_phieu = line.id_chitiet_phieu
                  AND transactionLine.id_phieu_trans = @IssueDocumentId
                  AND transactionLine.nghiep_vu = N'OUT_CON'
            ) AS issued
            WHERE line.id_phieu_yeucau = @RequestId
              AND ABS(CONVERT(decimal(18,4), ISNULL(line.so_luong, 0) - ISNULL(issued.Issued, 0))) > CONVERT(decimal(18,4), 0.0001)
        ) THROW 51022, N'Chua soan du so luong cua tat ca dong vat tu.', 1;
        UPDATE dbo.tbl_phieu_transaction SET trang_thai_phieu = N'2'
        WHERE id_phieu_trans = @IssueDocumentId AND trang_thai_phieu = N'1';
        UPDATE dbo.tbl_phieu_yeucau SET status_soanhang = N'2', time_lap_phieu = @Now
        WHERE id_phieu_yeucau = @RequestId;
        COMMIT TRANSACTION;
        SELECT RequestId = @RequestId, IssueDocumentId = @IssueDocumentId,
            PickingStatusCode = N'2', IssueDocumentStatusCode = N'2', CompletedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
