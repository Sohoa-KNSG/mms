:on error exit
IF DB_NAME() <> N'MMS'
    THROW 51000, N'Parse W5 chi duoc chay khi database hien tai la MMS.', 1;
GO
SET PARSEONLY ON;
GO
:r .\migrations\0005_w5_table_types.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT00_SubmitRequest_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT01_GetPlannedCatalog_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT01_CreatePlannedRequest_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT02_GetUnplannedCatalog_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT02_CreateUnplannedRequest_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT03_GetOverPlanCatalog_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT03_CreateOverPlanRequest_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT04_GetRequest_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT04_SaveRequest_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT05_GetRequestQueue_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT05_DecideRequest_v1.sql
GO
:r .\stored-procedures\w5\api.usp_WMS_OUT05_CancelRequest_v1.sql
GO
SET PARSEONLY OFF;
GO
SELECT ParseStatus = N'PASS', DatabaseName = DB_NAME();
GO
