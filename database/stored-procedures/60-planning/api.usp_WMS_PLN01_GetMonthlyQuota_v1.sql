CREATE OR ALTER PROCEDURE api.usp_WMS_PLN01_GetMonthlyQuota_v1
    @UserId nvarchar(50),
    @PlanningUnit nvarchar(50) = NULL,
    @Month int = NULL,
    @Year int = NULL,
    @Search nvarchar(200) = NULL,
    @StatusFilter nvarchar(50) = NULL, -- ALL, ACTIVE, INACTIVE, WARNING, OVER
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Now datetime = GETDATE();
    IF @Month IS NULL OR @Month < 1 OR @Month > 12 SET @Month = MONTH(@Now);
    IF @Year IS NULL OR @Year < 2000 SET @Year = YEAR(@Now);
    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 SET @PageSize = 50;
    IF @PageSize > 200 SET @PageSize = 200;

    SET @PlanningUnit = NULLIF(LTRIM(RTRIM(@PlanningUnit)), N'');
    IF @PlanningUnit = N'ALL' SET @PlanningUnit = NULL;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @StatusFilter = ISNULL(NULLIF(LTRIM(RTRIM(@StatusFilter)), N''), N'ALL');

    -- Check Permissions (Optional check or bypass for valid active user)
    ;WITH Filtered AS
    (
        SELECT 
            id_kehoach,
            donvi_kehoach,
            ten_donvi_kehoach,
            id_vattu,
            id_bravo,
            ten_vattu,
            unit,
            thang,
            nam,
            LimitQuantity,
            RequestedQuantity,
            IssuedQuantity,
            RemainingQuantity,
            ConsumptionPercentage,
            is_active,
            ghi_chu,
            user_cre,
            time_cre,
            user_up,
            time_up,
            StatusLevel = CASE 
                WHEN ConsumptionPercentage >= 100.0 THEN N'OVER'
                WHEN ConsumptionPercentage >= 80.0 THEN N'WARNING'
                ELSE N'NORMAL'
            END
        FROM api.vw_WMS_PLN_QuotaBalance_v1
        WHERE thang = @Month AND nam = @Year
          AND (@PlanningUnit IS NULL OR donvi_kehoach = @PlanningUnit)
          AND (@Search IS NULL 
               OR id_vattu LIKE N'%' + @Search + N'%'
               OR id_bravo LIKE N'%' + @Search + N'%'
               OR ten_vattu LIKE N'%' + @Search + N'%')
          AND (
              @StatusFilter = N'ALL'
              OR (@StatusFilter = N'ACTIVE' AND is_active = 1)
              OR (@StatusFilter = N'INACTIVE' AND is_active = 0)
              OR (@StatusFilter = N'WARNING' AND is_active = 1 AND ConsumptionPercentage >= 80.0 AND ConsumptionPercentage < 100.0)
              OR (@StatusFilter = N'OVER' AND is_active = 1 AND ConsumptionPercentage >= 100.0)
          )
    )
    SELECT *
    FROM Filtered
    ORDER BY is_active DESC, ConsumptionPercentage DESC, ten_vattu, id_vattu
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Total summary KPIs
    SELECT 
        TotalSkuCount = COUNT(1),
        TotalLimitQuantity = ISNULL(SUM(LimitQuantity), 0),
        TotalRequestedQuantity = ISNULL(SUM(RequestedQuantity), 0),
        TotalIssuedQuantity = ISNULL(SUM(IssuedQuantity), 0),
        WarningCount = ISNULL(SUM(CASE WHEN is_active = 1 AND ConsumptionPercentage >= 80.0 AND ConsumptionPercentage < 100.0 THEN 1 ELSE 0 END), 0),
        OverLimitCount = ISNULL(SUM(CASE WHEN is_active = 1 AND ConsumptionPercentage >= 100.0 THEN 1 ELSE 0 END), 0)
    FROM api.vw_WMS_PLN_QuotaBalance_v1
    WHERE thang = @Month AND nam = @Year
      AND (@PlanningUnit IS NULL OR donvi_kehoach = @PlanningUnit)
      AND (@Search IS NULL 
           OR id_vattu LIKE N'%' + @Search + N'%'
           OR id_bravo LIKE N'%' + @Search + N'%'
           OR ten_vattu LIKE N'%' + @Search + N'%')
      AND (
          @StatusFilter = N'ALL'
          OR (@StatusFilter = N'ACTIVE' AND is_active = 1)
          OR (@StatusFilter = N'INACTIVE' AND is_active = 0)
          OR (@StatusFilter = N'WARNING' AND is_active = 1 AND ConsumptionPercentage >= 80.0 AND ConsumptionPercentage < 100.0)
          OR (@StatusFilter = N'OVER' AND is_active = 1 AND ConsumptionPercentage >= 100.0)
      );
END;
