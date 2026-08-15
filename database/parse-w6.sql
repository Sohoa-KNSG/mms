:on error exit
IF DB_NAME() <> N'MMS'
    THROW 51000, N'Parse W6 chi duoc chay khi database hien tai la MMS.', 1;
GO
SET PARSEONLY ON;
GO
:r .\stored-procedures\w6\api.usp_WMS_OUT06_GetPickingQueue_v1.sql
GO
:r .\stored-procedures\w6\api.usp_WMS_OUT06_GetPickingRequest_v1.sql
GO
:r .\stored-procedures\w6\api.usp_WMS_OUT06_StartPicking_v1.sql
GO
:r .\stored-procedures\w6\api.usp_WMS_OUT07_GetPickableBatches_v1.sql
GO
:r .\stored-procedures\w6\api.usp_WMS_OUT07_PickBatch_v1.sql
GO
:r .\stored-procedures\w6\api.usp_WMS_OUT08_CompleteGoodsIssue_v1.sql
GO
:r .\stored-procedures\w6\api.usp_WMS_OUT09_GetIssueDocuments_v1.sql
GO
:r .\stored-procedures\w6\api.usp_WMS_OUT09_GetIssuePrintData_v1.sql
GO
SET PARSEONLY OFF;
GO
SELECT ParseStatus = N'PASS', DatabaseName = DB_NAME();
GO
