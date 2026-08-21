CREATE OR ALTER PROCEDURE api.usp_WMS_INB08_GetBatchLabels_v1
    @UserId nvarchar(50),
    @ReceiptId int = NULL,
    @TransactionDocumentId int = NULL,
    @BatchId int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_nhapkho_thutuc', N'scr_nhapkho_ql', N'scr_nhapkho_batch', N'scr_nhapkho_tachbatch_intem', N'scr_tonkho_intem')
    )
        THROW 51001, N'Không có quyền in tem batch.', 1;

    SET @ReceiptId = CASE WHEN @ReceiptId > 0 THEN @ReceiptId END;
    SET @TransactionDocumentId = CASE WHEN @TransactionDocumentId > 0 THEN @TransactionDocumentId END;
    SET @BatchId = CASE WHEN @BatchId > 0 THEN @BatchId END;
    IF @ReceiptId IS NULL AND @TransactionDocumentId IS NULL AND @BatchId IS NULL
        THROW 51002, N'Phải nhập mã phiếu nhận, phiếu giao dịch hoặc batch.', 1;

    SELECT ReceiptId = receipt.ma_phieu, PurchaseOrder = receipt.ma_po,
        CustomerName = receipt.khach_hang, WarehouseCode = receipt.kho,
        ReceiptStatusCode = receipt.status_nhap,
        TransactionDocumentId = document.id_phieu_trans,
        TransactionStatusCode = document.trang_thai_phieu,
        PrintedAt = GETDATE()
    FROM dbo.tbl_batch_inv AS batch
    INNER JOIN dbo.tbl_chitiet_nhanhang AS line ON line.id_nhanhang = batch.id_nhanhang
    INNER JOIN dbo.tbl_phieu_nhan_hang AS receipt ON receipt.ma_phieu = line.ma_phieu
    INNER JOIN dbo.tbl_transaction AS movement ON movement.id_batch = batch.id_batch
    INNER JOIN dbo.tbl_phieu_transaction AS document ON document.id_phieu_trans = movement.id_phieu_trans
    WHERE (@ReceiptId IS NULL OR receipt.ma_phieu = @ReceiptId)
      AND (@TransactionDocumentId IS NULL OR document.id_phieu_trans = @TransactionDocumentId)
      AND (@BatchId IS NULL OR batch.id_batch = @BatchId)
    GROUP BY receipt.ma_phieu, receipt.ma_po, receipt.khach_hang, receipt.kho,
        receipt.status_nhap, document.id_phieu_trans, document.trang_thai_phieu;

    SELECT BatchId = batch.id_batch, BarcodeValue = CONVERT(nvarchar(50), batch.id_batch),
        ReceiptId = receipt.ma_phieu, TransactionDocumentId = movement.id_phieu_trans,
        MaterialId = batch.id_vattu, BravoId = batch.id_bravo,
        MaterialName = batch.ten_vattu,
        Quantity = CONVERT(decimal(19,4), batch.so_luong), Unit = batch.unit,
        WarehouseCode = batch.ma_kho, LocationCode = batch.location,
        InventoryStatusCode = batch.trang_thai_ton,
        CreatedBy = batch.user_up, CreatedAt = batch.time_cre
    FROM dbo.tbl_batch_inv AS batch
    INNER JOIN dbo.tbl_chitiet_nhanhang AS line ON line.id_nhanhang = batch.id_nhanhang
    INNER JOIN dbo.tbl_phieu_nhan_hang AS receipt ON receipt.ma_phieu = line.ma_phieu
    INNER JOIN dbo.tbl_transaction AS movement ON movement.id_batch = batch.id_batch
    WHERE (@ReceiptId IS NULL OR receipt.ma_phieu = @ReceiptId)
      AND (@TransactionDocumentId IS NULL OR movement.id_phieu_trans = @TransactionDocumentId)
      AND (@BatchId IS NULL OR batch.id_batch = @BatchId)
    ORDER BY batch.id_batch;
END;
