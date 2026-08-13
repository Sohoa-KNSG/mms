CREATE OR ALTER PROCEDURE api.usp_WMS_INV06_GetBatchCount_v1
    @UserId nvarchar(50),
    @BatchId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_kiemke_batch')
        THROW 51001, N'Không có quyền kiểm kê batch.', 1;
    SELECT BatchId = batch.id_batch, MaterialId = batch.id_vattu, BravoId = batch.id_bravo,
        MaterialName = batch.ten_vattu, SystemQuantity = CONVERT(decimal(19,4), batch.so_luong),
        Unit = batch.unit, WarehouseCode = batch.ma_kho, LocationCode = batch.location,
        InventoryStatusCode = batch.trang_thai_ton, ChangedAt = COALESCE(batch.time_up, batch.time_cre)
    FROM dbo.tbl_batch_inv AS batch WHERE batch.id_batch = @BatchId;

    SELECT TransactionId = movement.id_trans, TransactionDocumentId = movement.id_phieu_trans,
        OperationCode = movement.nghiep_vu, Quantity = CONVERT(decimal(19,4), movement.so_luong),
        Unit = movement.unit, CreatedAt = movement.time_cre
    FROM dbo.tbl_transaction AS movement WHERE movement.id_batch = @BatchId
    ORDER BY movement.time_cre DESC, movement.id_trans DESC;
END;

