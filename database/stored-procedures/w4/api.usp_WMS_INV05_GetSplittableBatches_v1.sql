CREATE OR ALTER PROCEDURE api.usp_WMS_INV05_GetSplittableBatches_v1
    @UserId nvarchar(50),
    @Search nvarchar(200) = NULL,
    @BatchId int = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_nhapkho_tachbatch_intem')
        THROW 51001, N'Không có quyền tách batch.', 1;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @BatchId = CASE WHEN @BatchId > 0 THEN @BatchId END;
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    SELECT BatchId = batch.id_batch, ReceivingLineId = batch.id_nhanhang,
        WarehouseCode = batch.ma_kho, MaterialId = batch.id_vattu, BravoId = batch.id_bravo,
        MaterialName = batch.ten_vattu, Quantity = CONVERT(decimal(19,4), batch.so_luong),
        Unit = batch.unit, LocationCode = batch.location, InventoryStatusCode = batch.trang_thai_ton,
        TransactionBalance = CONVERT(decimal(19,4), ISNULL(balance.Quantity, 0)),
        IsBalanced = CONVERT(bit, CASE WHEN ABS(ISNULL(balance.Quantity, 0) - ISNULL(batch.so_luong, 0)) <= 0.0001 THEN 1 ELSE 0 END),
        ChangedAt = COALESCE(batch.time_up, batch.time_cre)
    FROM dbo.tbl_batch_inv AS batch
    OUTER APPLY
    (
        SELECT Quantity = SUM(CASE TRY_CONVERT(int, operation.logic)
            WHEN 1 THEN ISNULL(movement.so_luong, 0) WHEN -1 THEN -ISNULL(movement.so_luong, 0) ELSE 0 END)
        FROM dbo.tbl_transaction AS movement
        INNER JOIN dbo.tbl_dm_nghiepvu_kho AS operation ON operation.ma_nghiepvu = movement.nghiep_vu
        WHERE movement.id_batch = batch.id_batch
    ) AS balance
    WHERE batch.so_luong > 0 AND batch.trang_thai_ton = N'1'
      AND (@BatchId IS NULL OR batch.id_batch = @BatchId)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), batch.id_batch) LIKE N'%' + @Search + N'%'
        OR batch.id_vattu LIKE N'%' + @Search + N'%' OR batch.ten_vattu LIKE N'%' + @Search + N'%')
    ORDER BY batch.time_cre DESC, batch.id_batch DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1) FROM dbo.tbl_batch_inv AS batch
    WHERE batch.so_luong > 0 AND batch.trang_thai_ton = N'1'
      AND (@BatchId IS NULL OR batch.id_batch = @BatchId)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), batch.id_batch) LIKE N'%' + @Search + N'%'
        OR batch.id_vattu LIKE N'%' + @Search + N'%' OR batch.ten_vattu LIKE N'%' + @Search + N'%');
END;

