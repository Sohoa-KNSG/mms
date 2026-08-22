CREATE OR ALTER PROCEDURE api.usp_WMS_PLN03_Get3WayReconciliation_v1
    @UserId nvarchar(50),
    @Month int = NULL,
    @Year int = NULL,
    @BalanceStatus nvarchar(50) = NULL, -- ALL, SHORTAGE, OVERSTOCK, BALANCED
    @Search nvarchar(200) = NULL,
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

    SET @BalanceStatus = ISNULL(NULLIF(LTRIM(RTRIM(@BalanceStatus)), N''), N'ALL');
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');

    ;WITH Rec AS
    (
        SELECT 
            MaterialId,
            BravoId,
            MaterialName,
            Unit,
            PlanMonth,
            PlanYear,
            PlannedQuota,
            RequestedQuantity,
            IssuedQuantity,
            RemainingQuota,
            PoOrderedQuantity,
            ReceivedQuantity,
            InTransitQuantity,
            AvailableInventory,
            PurchaseRecommendationGap,
            BalanceStatusCode,
            SupplyFulfillmentRate = CASE 
                WHEN PlannedQuota > 0 THEN ROUND(((AvailableInventory + PoOrderedQuantity) * 100.0) / PlannedQuota, 2)
                ELSE 100.0
            END,
            ConsumptionRate = CASE 
                WHEN PlannedQuota > 0 THEN ROUND((IssuedQuantity * 100.0) / PlannedQuota, 2)
                ELSE 0.0
            END
        FROM api.vw_WMS_PLN_3WayReconciliation_v1
        WHERE PlanMonth = @Month AND PlanYear = @Year
          AND (@BalanceStatus = N'ALL' OR BalanceStatusCode = @BalanceStatus)
          AND (@Search IS NULL 
               OR MaterialId LIKE N'%' + @Search + N'%'
               OR BravoId LIKE N'%' + @Search + N'%'
               OR MaterialName LIKE N'%' + @Search + N'%')
    )
    SELECT *
    FROM Rec
    ORDER BY 
        CASE BalanceStatusCode WHEN N'SHORTAGE' THEN 1 WHEN N'OVERSTOCK' THEN 2 ELSE 3 END,
        MaterialName, MaterialId
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- KPIs Summary
    SELECT 
        TotalSkuCount = COUNT(1),
        TotalPlannedQuota = ISNULL(SUM(PlannedQuota), 0),
        TotalIssuedQuantity = ISNULL(SUM(IssuedQuantity), 0),
        TotalPoQuantity = ISNULL(SUM(PoOrderedQuantity), 0),
        TotalAvailableInventory = ISNULL(SUM(AvailableInventory), 0),
        ShortageCount = ISNULL(SUM(CASE WHEN BalanceStatusCode = N'SHORTAGE' THEN 1 ELSE 0 END), 0),
        OverstockCount = ISNULL(SUM(CASE WHEN BalanceStatusCode = N'OVERSTOCK' THEN 1 ELSE 0 END), 0),
        TotalPurchaseGap = ISNULL(SUM(PurchaseRecommendationGap), 0)
    FROM api.vw_WMS_PLN_3WayReconciliation_v1
    WHERE PlanMonth = @Month AND PlanYear = @Year
      AND (@BalanceStatus = N'ALL' OR BalanceStatusCode = @BalanceStatus)
      AND (@Search IS NULL 
           OR MaterialId LIKE N'%' + @Search + N'%'
           OR BravoId LIKE N'%' + @Search + N'%'
           OR MaterialName LIKE N'%' + @Search + N'%');
END;
