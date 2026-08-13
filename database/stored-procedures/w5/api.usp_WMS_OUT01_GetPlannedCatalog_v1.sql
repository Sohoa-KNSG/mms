CREATE OR ALTER PROCEDURE api.usp_WMS_OUT01_GetPlannedCatalog_v1
    @UserId nvarchar(50), @PlanningUnit nvarchar(50) = NULL,
    @Search nvarchar(200) = NULL, @Page int = 1, @PageSize int = 50,
    @RequiredScreenCode nvarchar(50) = N'scr_denghi_xuatkho_planning'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE @DepartmentCode nvarchar(50);
    SELECT @DepartmentCode = ma_bophan FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @DepartmentCode IS NULL THROW 51001, N'Tài khoản không hoạt động.', 1;
    IF @RequiredScreenCode NOT IN (N'scr_denghi_xuatkho_planning', N'scr_denghi_xuatkho_planning_vuot')
        THROW 51022, N'Màn hình yêu cầu không hợp lệ.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId
          AND
          (
              (@RequiredScreenCode = N'scr_denghi_xuatkho_planning' AND ScreenCode IN (N'scr_denghi_xuatkho_planning', N'scr_mob_denghi_xuatkho_planning'))
              OR (@RequiredScreenCode = N'scr_denghi_xuatkho_planning_vuot' AND ScreenCode IN (N'scr_denghi_xuatkho_planning_vuot', N'scr_mob_denghi_xuatkho_planning_vuot'))
          )
    ) THROW 51001, N'Không có quyền xem danh mục đề nghị.', 1;
    SET @PlanningUnit = NULLIF(LTRIM(RTRIM(@PlanningUnit)), N'');
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    ;WITH Catalog AS
    (
        SELECT PlanId = planItem.id_kehoach, PlanningUnit = planItem.donvi_kehoach,
            MaterialId = planItem.id_vattu, BravoId = planItem.id_bravo,
            MaterialName = planItem.ten_vattu, Unit = planItem.unit,
            LimitQuantity = CONVERT(decimal(19,4), ISNULL(planItem.dinh_muc, 0)),
            UsedQuantity = CONVERT(decimal(19,4), ISNULL(reserved.ReservedQuantity, 0)),
            RemainingQuantity = CONVERT(decimal(19,4), CASE
                WHEN ISNULL(planItem.dinh_muc, 0) > ISNULL(reserved.ReservedQuantity, 0)
                THEN ISNULL(planItem.dinh_muc, 0) - ISNULL(reserved.ReservedQuantity, 0) ELSE 0 END),
            PlanMonth = planItem.thang, PlanYear = planItem.nam, Note = planItem.ghi_chu
        FROM dbo.tbl_dinhmuc AS planItem
        INNER JOIN dbo.tbl_dm_kehoach AS planUnit
          ON planUnit.donvi_kehoach = planItem.donvi_kehoach
         AND planUnit.ma_ql = @DepartmentCode AND ISNULL(planUnit.status_active, 0) = 1
        OUTER APPLY
        (
            SELECT ReservedQuantity = SUM(ISNULL(line.so_luong, 0))
            FROM dbo.tbl_phieu_yeucau_chitiet AS line
            INNER JOIN dbo.tbl_phieu_yeucau AS request ON request.id_phieu_yeucau = line.id_phieu_yeucau
            WHERE line.id_kehoach = planItem.id_kehoach
              AND ISNULL(request.trang_thai_phieu, N'0') <> N'0'
              AND NOT EXISTS
              (
                  SELECT 1 FROM dbo.tbl_his_pheduyet AS history
                  WHERE history.id_phieu_yeucau = request.id_phieu_yeucau
                    AND LOWER(ISNULL(history.trangthai_pheduyet, N'')) = N'reject'
              )
        ) AS reserved
        WHERE ISNULL(planItem.is_active, 0) = 1
          AND (@PlanningUnit IS NULL OR planItem.donvi_kehoach = @PlanningUnit)
          AND (@Search IS NULL OR planItem.id_vattu LIKE N'%' + @Search + N'%'
            OR planItem.id_bravo LIKE N'%' + @Search + N'%' OR planItem.ten_vattu LIKE N'%' + @Search + N'%')
    )
    SELECT * FROM Catalog ORDER BY MaterialName, MaterialId
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT PlanningUnit = donvi_kehoach, PlanningUnitName = MAX(ten_kehoach)
    FROM dbo.tbl_dm_kehoach WHERE ma_ql = @DepartmentCode AND ISNULL(status_active, 0) = 1
    GROUP BY donvi_kehoach ORDER BY donvi_kehoach;
    SELECT PlanningUnit = donvi_ke_hoach, DestinationBravoCode = ma_bravo,
        DestinationName = ten_bravo_bophan
    FROM dbo.tbl_sx_bravo WHERE ma_ql = @DepartmentCode
      AND (@PlanningUnit IS NULL OR donvi_ke_hoach = @PlanningUnit)
    ORDER BY donvi_ke_hoach, ma_bravo;
    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_dinhmuc AS planItem
    INNER JOIN dbo.tbl_dm_kehoach AS planUnit ON planUnit.donvi_kehoach = planItem.donvi_kehoach
      AND planUnit.ma_ql = @DepartmentCode AND ISNULL(planUnit.status_active, 0) = 1
    WHERE ISNULL(planItem.is_active, 0) = 1
      AND (@PlanningUnit IS NULL OR planItem.donvi_kehoach = @PlanningUnit)
      AND (@Search IS NULL OR planItem.id_vattu LIKE N'%' + @Search + N'%'
        OR planItem.id_bravo LIKE N'%' + @Search + N'%' OR planItem.ten_vattu LIKE N'%' + @Search + N'%');
END;
