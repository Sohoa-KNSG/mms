CREATE OR ALTER PROCEDURE api.usp_WMS_INB02_GetMaterials_v1
    @UserId nvarchar(50),
    @Search nvarchar(200) = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_nhanhang_khong_po'
    )
        THROW 51001, N'Không có quyền nhận hàng không PO.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    SELECT MaterialId = material.id_vattu, BravoId = material.id_bravo,
        MaterialName = material.ten_vattu, Unit = material.unit,
        SupplierCode = material.ma_ncc, MaterialGroupCode = material.nhom_vattu
    FROM dbo.tbl_dm_vattu AS material
    WHERE ISNULL(material.status_active, N'1') NOT IN (N'0', N'false', N'inactive')
      AND (@Search IS NULL
       OR material.id_vattu LIKE N'%' + @Search + N'%'
       OR material.id_bravo LIKE N'%' + @Search + N'%'
       OR material.ten_vattu LIKE N'%' + @Search + N'%'
       OR material.ma_ncc LIKE N'%' + @Search + N'%')
    ORDER BY material.ten_vattu, material.id_vattu
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_dm_vattu AS material
    WHERE ISNULL(material.status_active, N'1') NOT IN (N'0', N'false', N'inactive')
      AND (@Search IS NULL
       OR material.id_vattu LIKE N'%' + @Search + N'%'
       OR material.id_bravo LIKE N'%' + @Search + N'%'
       OR material.ten_vattu LIKE N'%' + @Search + N'%'
       OR material.ma_ncc LIKE N'%' + @Search + N'%');
END;

