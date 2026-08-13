/* Set a real user that has the relevant legacy role/screen mappings before running. */
DECLARE @UserId nvarchar(50) = N'__REPLACE_WITH_TEST_USER__';

EXEC api.usp_SEC_AUTH01_GetUserContext_v1 @UserId = @UserId;
EXEC api.usp_SEC_AUTH02_GetNavigation_v1 @UserId = @UserId;
EXEC api.usp_WMS_INB04_GetReceiptLog_v1 @UserId = @UserId, @Page = 1, @PageSize = 5;
EXEC api.usp_WMS_INV01_GetInventoryBalance_v1 @UserId = @UserId, @Page = 1, @PageSize = 5;
EXEC api.usp_WMS_LOC01_GetLocationMap_v1 @UserId = @UserId, @Page = 1, @PageSize = 5;
EXEC api.usp_WMS_ADM03_GetOperationsSummary_v1 @UserId = @UserId;

DECLARE @BatchId int = (SELECT TOP (1) id_batch FROM dbo.tbl_batch_inv ORDER BY id_batch DESC);
IF @BatchId IS NOT NULL
    EXEC api.usp_WMS_INV02_GetBatchHistory_v1 @UserId = @UserId, @BatchId = @BatchId;

DECLARE @MaterialId nvarchar(50) =
    (SELECT TOP (1) id_vattu FROM dbo.tbl_batch_inv ORDER BY id_batch DESC);
IF @MaterialId IS NOT NULL
    EXEC api.usp_WMS_INV03_GetMaterialHistory_v1
        @UserId = @UserId, @MaterialId = @MaterialId, @Page = 1, @PageSize = 5;

