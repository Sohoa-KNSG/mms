CREATE OR ALTER PROCEDURE api.usp_WMS_INV04_GetDeclarationCatalog_v1
    @UserId nvarchar(50),
    @Search nvarchar(200) = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_tonkho_khaibao')
        THROW 51001, N'Không có quyền khai báo tồn kho.', 1;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    SELECT MaterialId = material.id_vattu, BravoId = material.id_bravo,
        MaterialName = material.ten_vattu, Unit = material.unit,
        CurrentQuantity = CONVERT(decimal(19,4), ISNULL(inventory.Quantity, 0))
    FROM dbo.tbl_dm_vattu AS material
    OUTER APPLY (SELECT Quantity = SUM(ISNULL(batch.so_luong, 0)) FROM dbo.tbl_batch_inv AS batch
        WHERE batch.id_vattu = material.id_vattu AND batch.trang_thai_ton = N'1') AS inventory
    WHERE ISNULL(material.status_active, N'1') NOT IN (N'0', N'false', N'inactive')
      AND (@Search IS NULL OR material.id_vattu LIKE N'%' + @Search + N'%'
        OR material.id_bravo LIKE N'%' + @Search + N'%' OR material.ten_vattu LIKE N'%' + @Search + N'%')
    ORDER BY material.ten_vattu, material.id_vattu
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT LocationCode = location.ma_location, AreaCode = location.ma_khu_vuc,
        ShelfCode = location.ma_ke, FloorNumber = location.ma_tang, Description = location.mo_ta
    FROM dbo.tbl_dm_location AS location ORDER BY location.ma_location;

    SELECT TotalCount = COUNT_BIG(1) FROM dbo.tbl_dm_vattu AS material
    WHERE ISNULL(material.status_active, N'1') NOT IN (N'0', N'false', N'inactive')
      AND (@Search IS NULL OR material.id_vattu LIKE N'%' + @Search + N'%'
        OR material.id_bravo LIKE N'%' + @Search + N'%' OR material.ten_vattu LIKE N'%' + @Search + N'%');
END;

