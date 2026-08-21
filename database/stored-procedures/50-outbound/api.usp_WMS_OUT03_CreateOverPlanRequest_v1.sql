CREATE OR ALTER PROCEDURE api.usp_WMS_OUT03_CreateOverPlanRequest_v1
    @UserId nvarchar(50), @PlanningUnit nvarchar(50), @NeededAt datetime,
    @DestinationBravoCode nvarchar(50) = NULL, @DestinationName nvarchar(50) = NULL,
    @Items api.OutboundRequestItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    EXEC api.usp_WMS_OUT00_SubmitRequest_v1 @UserId, N'vuot', @PlanningUnit, @NeededAt,
        @DestinationBravoCode, @DestinationName, @Items;
END;
