CREATE OR ALTER PROCEDURE api.usp_WMS_OUT02_GetUnplannedCatalog_v1
    @UserId nvarchar(50), @PlanningUnit nvarchar(50) = NULL,
    @Search nvarchar(200) = NULL, @Page int = 1, @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @DepartmentCode nvarchar(50);
    SELECT @DepartmentCode = ma_bophan FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @DepartmentCode IS NULL THROW 51001, N'Tài khoản không hoạt động.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_denghi_xuatkho_no_planning', N'scr_mob_denghi_xuatkho_no_planning', N'scr_denghi_xuatkho_request')
    ) THROW 51001, N'Không có quyền xem danh mục ngoài kế hoạch.', 1;
    SET @PlanningUnit = NULLIF(LTRIM(RTRIM(@PlanningUnit)), N'');
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    SELECT PlanId = CONVERT(int, NULL), PlanningUnit = @PlanningUnit,
        MaterialId = material.id_vattu, BravoId = material.id_bravo,
        MaterialName = material.ten_vattu, Unit = material.unit,
        LimitQuantity = CONVERT(decimal(19,4), NULL), UsedQuantity = CONVERT(decimal(19,4), 0),
        RemainingQuantity = CONVERT(decimal(19,4), NULL),
        PlanMonth = CONVERT(nvarchar(20), NULL), PlanYear = CONVERT(nvarchar(20), NULL),
        Note = CONVERT(nvarchar(255), NULL)
    FROM dbo.tbl_dm_vattu AS material
    WHERE ISNULL(material.status_active, N'1') NOT IN (N'0', N'false', N'inactive')
      AND (@Search IS NULL OR material.id_vattu LIKE N'%' + @Search + N'%'
        OR material.id_bravo LIKE N'%' + @Search + N'%' OR material.ten_vattu LIKE N'%' + @Search + N'%')
    ORDER BY material.ten_vattu, material.id_vattu
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT PlanningUnit = donvi_kehoach, PlanningUnitName = MAX(ten_kehoach)
    FROM dbo.tbl_dm_kehoach WHERE ma_ql = @DepartmentCode AND ISNULL(status_active, 0) = 1
    GROUP BY donvi_kehoach ORDER BY donvi_kehoach;
    SELECT PlanningUnit = donvi_ke_hoach, DestinationBravoCode = ma_bravo,
        DestinationName = ten_bravo_bophan
    FROM dbo.tbl_sx_bravo WHERE ma_ql = @DepartmentCode
      AND (@PlanningUnit IS NULL OR donvi_ke_hoach = @PlanningUnit)
    ORDER BY donvi_ke_hoach, ma_bravo;
    SELECT TotalCount = COUNT_BIG(1) FROM dbo.tbl_dm_vattu AS material
    WHERE ISNULL(material.status_active, N'1') NOT IN (N'0', N'false', N'inactive')
      AND (@Search IS NULL OR material.id_vattu LIKE N'%' + @Search + N'%'
        OR material.id_bravo LIKE N'%' + @Search + N'%' OR material.ten_vattu LIKE N'%' + @Search + N'%');
END;
