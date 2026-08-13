CREATE OR ALTER PROCEDURE api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1
    @UserId nvarchar(50),
    @Search nvarchar(200) = NULL,
    @ReceiptId int = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_nhapkho_thutuc', N'scr_nhapkho_ql')
    )
        THROW 51001, N'Không có quyền thực hiện nhập kho.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @ReceiptId = CASE WHEN @ReceiptId > 0 THEN @ReceiptId END;
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    DECLARE @Selected TABLE (ReceiptId int NOT NULL PRIMARY KEY);
    INSERT @Selected (ReceiptId)
    SELECT receipt.ma_phieu
    FROM dbo.tbl_phieu_nhan_hang AS receipt
    WHERE receipt.status_nhap = N'4'
      AND (@ReceiptId IS NULL OR receipt.ma_phieu = @ReceiptId)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), receipt.ma_phieu) LIKE N'%' + @Search + N'%'
        OR receipt.ma_po LIKE N'%' + @Search + N'%'
        OR receipt.khach_hang LIKE N'%' + @Search + N'%'
        OR receipt.kho LIKE N'%' + @Search + N'%')
      AND EXISTS
      (
          SELECT 1 FROM dbo.tbl_chitiet_nhanhang AS line
          OUTER APPLY (SELECT Batched = SUM(ISNULL(batch.so_luong, 0)) FROM dbo.tbl_batch_inv AS batch
              WHERE batch.id_nhanhang = line.id_nhanhang) AS inventory
          WHERE line.ma_phieu = receipt.ma_phieu AND ISNULL(line.status, N'1') <> N'0'
            AND ISNULL(line.soluong_thucnhan, 0) > ISNULL(inventory.Batched, 0)
      )
    ORDER BY receipt.time_cre, receipt.ma_phieu
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT ReceiptId = receipt.ma_phieu, WarehouseCode = receipt.kho,
        CustomerName = receipt.khach_hang, PurchaseOrder = receipt.ma_po,
        StatusCode = receipt.status_nhap, ReceivedAt = receipt.time_cre,
        PendingLineCount = (SELECT COUNT(*) FROM dbo.tbl_chitiet_nhanhang AS line
            OUTER APPLY (SELECT Batched = SUM(ISNULL(batch.so_luong, 0)) FROM dbo.tbl_batch_inv AS batch
                WHERE batch.id_nhanhang = line.id_nhanhang) AS inventory
            WHERE line.ma_phieu = receipt.ma_phieu AND ISNULL(line.status, N'1') <> N'0'
              AND ISNULL(line.soluong_thucnhan, 0) > ISNULL(inventory.Batched, 0))
    FROM dbo.tbl_phieu_nhan_hang AS receipt
    INNER JOIN @Selected AS selected ON selected.ReceiptId = receipt.ma_phieu
    ORDER BY receipt.time_cre, receipt.ma_phieu;

    SELECT ReceivingLineId = line.id_nhanhang, ReceiptId = line.ma_phieu,
        MaterialId = line.ma_hang, BravoId = material.id_bravo,
        MaterialName = material.ten_vattu,
        ReceivedQuantity = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0)),
        BatchedQuantity = CONVERT(decimal(19,4), ISNULL(inventory.Batched, 0)),
        RemainingQuantity = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0) - ISNULL(inventory.Batched, 0)),
        Unit = COALESCE(line.unit, material.unit), LineStatusCode = line.status_nhanhang,
        QcResultCode = line.ket_qua_qc
    FROM dbo.tbl_chitiet_nhanhang AS line
    INNER JOIN @Selected AS selected ON selected.ReceiptId = line.ma_phieu
    LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    OUTER APPLY (SELECT Batched = SUM(ISNULL(batch.so_luong, 0)) FROM dbo.tbl_batch_inv AS batch
        WHERE batch.id_nhanhang = line.id_nhanhang) AS inventory
    WHERE ISNULL(line.status, N'1') <> N'0'
      AND ISNULL(line.soluong_thucnhan, 0) > ISNULL(inventory.Batched, 0)
    ORDER BY line.ma_phieu, line.id_nhanhang;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_phieu_nhan_hang AS receipt
    WHERE receipt.status_nhap = N'4'
      AND (@ReceiptId IS NULL OR receipt.ma_phieu = @ReceiptId)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), receipt.ma_phieu) LIKE N'%' + @Search + N'%'
        OR receipt.ma_po LIKE N'%' + @Search + N'%'
        OR receipt.khach_hang LIKE N'%' + @Search + N'%'
        OR receipt.kho LIKE N'%' + @Search + N'%')
      AND EXISTS
      (
          SELECT 1 FROM dbo.tbl_chitiet_nhanhang AS line
          OUTER APPLY (SELECT Batched = SUM(ISNULL(batch.so_luong, 0)) FROM dbo.tbl_batch_inv AS batch
              WHERE batch.id_nhanhang = line.id_nhanhang) AS inventory
          WHERE line.ma_phieu = receipt.ma_phieu AND ISNULL(line.status, N'1') <> N'0'
            AND ISNULL(line.soluong_thucnhan, 0) > ISNULL(inventory.Batched, 0)
      );
END;

