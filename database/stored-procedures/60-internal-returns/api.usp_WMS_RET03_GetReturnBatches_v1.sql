CREATE OR ALTER PROCEDURE api.usp_WMS_RET03_GetReturnBatches_v1
    @UserId nvarchar(50), @TransactionDocumentId int
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_nhaptra_tachbatch_intem')
        THROW 51001, N'Khong co quyen tach batch nhap tra.', 1;
    SELECT TransactionId = transactionLine.id_trans, BatchId = batch.id_batch,
        MaterialId = batch.id_vattu, BravoId = batch.id_bravo, MaterialName = batch.ten_vattu,
        Quantity = CONVERT(decimal(18,4), batch.so_luong), Unit = batch.unit,
        InventoryStatusCode = batch.trang_thai_ton, LocationCode = batch.location,
        CreatedAt = batch.time_cre, ChangedAt = batch.time_up
    FROM dbo.tbl_transaction AS transactionLine
    INNER JOIN dbo.tbl_batch_inv AS batch ON batch.id_batch = transactionLine.id_batch
    WHERE transactionLine.id_phieu_trans = @TransactionDocumentId
      AND transactionLine.nghiep_vu = N'IN_PROD' AND batch.so_luong > 0
    ORDER BY transactionLine.id_trans, batch.id_batch;
END;
