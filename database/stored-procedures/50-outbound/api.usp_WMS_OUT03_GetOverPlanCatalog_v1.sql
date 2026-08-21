CREATE OR ALTER PROCEDURE api.usp_WMS_OUT03_GetOverPlanCatalog_v1
    @UserId nvarchar(50), @PlanningUnit nvarchar(50) = NULL,
    @Search nvarchar(200) = NULL, @Page int = 1, @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    EXEC api.usp_WMS_OUT01_GetPlannedCatalog_v1
        @UserId = @UserId, @PlanningUnit = @PlanningUnit,
        @Search = @Search, @Page = @Page, @PageSize = @PageSize,
        @RequiredScreenCode = N'scr_denghi_xuatkho_planning_vuot';
END;
