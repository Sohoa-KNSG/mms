CREATE OR ALTER PROCEDURE api.usp_WMS_LOC03_GetRelocationWorklist_v1
    @UserId nvarchar(50), @Search nvarchar(200) = NULL, @LocationCode nvarchar(50) = NULL, @Page int = 1, @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_luukho_doi_ke')
        THROW 51001, N'Không có quyền đổi vị trí kệ.', 1;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N''); SET @LocationCode = NULLIF(LTRIM(RTRIM(@LocationCode)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END; SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;
    SELECT BatchId = batch.id_batch, MaterialId = batch.id_vattu, MaterialName = batch.ten_vattu,
        Quantity = CONVERT(decimal(19,4), batch.so_luong), Unit = batch.unit,
        WarehouseCode = batch.ma_kho, LocationCode = batch.location, ChangedAt = COALESCE(batch.time_up, batch.time_cre)
    FROM dbo.tbl_batch_inv AS batch WHERE batch.so_luong > 0 AND batch.trang_thai_ton = N'1' AND batch.location IS NOT NULL
      AND (@LocationCode IS NULL OR batch.location = @LocationCode)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), batch.id_batch) LIKE N'%' + @Search + N'%'
        OR batch.id_vattu LIKE N'%' + @Search + N'%' OR batch.ten_vattu LIKE N'%' + @Search + N'%')
    ORDER BY batch.location, batch.id_batch OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
    SELECT LocationCode = location.ma_location, AreaCode = location.ma_khu_vuc, ShelfCode = location.ma_ke,
        ColumnNumber = location.ma_cot, FloorNumber = location.ma_tang, PositionNumber = location.vi_tri, Description = location.mo_ta
    FROM dbo.tbl_dm_location AS location ORDER BY location.ma_location;
    SELECT TotalCount = COUNT_BIG(1) FROM dbo.tbl_batch_inv AS batch WHERE batch.so_luong > 0 AND batch.trang_thai_ton = N'1'
      AND batch.location IS NOT NULL AND (@LocationCode IS NULL OR batch.location = @LocationCode)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), batch.id_batch) LIKE N'%' + @Search + N'%'
        OR batch.id_vattu LIKE N'%' + @Search + N'%' OR batch.ten_vattu LIKE N'%' + @Search + N'%');
END;

