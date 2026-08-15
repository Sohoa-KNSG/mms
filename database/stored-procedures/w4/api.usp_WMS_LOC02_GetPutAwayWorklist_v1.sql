CREATE OR ALTER PROCEDURE api.usp_WMS_LOC02_GetPutAwayWorklist_v1
    @UserId nvarchar(50), @Search nvarchar(200) = NULL, @Page int = 1, @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode IN (N'scr_luukho_len_ke', N'scr_luukho_ql'))
        THROW 51001, N'Không có quyền đưa batch lên kệ.', 1;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N''); SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;
    SELECT BatchId = batch.id_batch, MaterialId = batch.id_vattu, MaterialName = batch.ten_vattu,
        Quantity = CONVERT(decimal(19,4), batch.so_luong), Unit = batch.unit,
        WarehouseCode = batch.ma_kho, LocationCode = batch.location, CreatedAt = batch.time_cre
    FROM dbo.tbl_batch_inv AS batch WHERE batch.so_luong > 0 AND batch.trang_thai_ton = N'1' AND batch.location IS NULL
      AND (@Search IS NULL OR CONVERT(nvarchar(20), batch.id_batch) LIKE N'%' + @Search + N'%'
        OR batch.id_vattu LIKE N'%' + @Search + N'%' OR batch.ten_vattu LIKE N'%' + @Search + N'%')
    ORDER BY batch.time_cre, batch.id_batch OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
    SELECT LocationCode = location.ma_location, AreaCode = location.ma_khu_vuc, ShelfCode = location.ma_ke,
        ColumnNumber = location.ma_cot, FloorNumber = location.ma_tang, PositionNumber = location.vi_tri, Description = location.mo_ta
    FROM dbo.tbl_dm_location AS location ORDER BY location.ma_location;
    SELECT TotalCount = COUNT_BIG(1) FROM dbo.tbl_batch_inv AS batch WHERE batch.so_luong > 0
      AND batch.trang_thai_ton = N'1' AND batch.location IS NULL
      AND (@Search IS NULL OR CONVERT(nvarchar(20), batch.id_batch) LIKE N'%' + @Search + N'%'
        OR batch.id_vattu LIKE N'%' + @Search + N'%' OR batch.ten_vattu LIKE N'%' + @Search + N'%');
END;

