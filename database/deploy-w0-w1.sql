:on error exit

IF DB_NAME() <> N'MMS'
    THROW 51000, N'Script W0/W1 chỉ được chạy khi database hiện tại là MMS.', 1;
GO

:r .\migrations\0001_api_schema.sql

:r .\stored-procedures\w0\api.usp_SEC_AUTH01_GetUserContext_v1.sql
GO
:r .\stored-procedures\w0\api.usp_SEC_AUTH02_GetNavigation_v1.sql
GO

:r .\stored-procedures\w1\api.usp_WMS_INB04_GetReceiptLog_v1.sql
GO
:r .\stored-procedures\w1\api.usp_WMS_INV01_GetInventoryBalance_v1.sql
GO
:r .\stored-procedures\w1\api.usp_WMS_INV02_GetBatchHistory_v1.sql
GO
:r .\stored-procedures\w1\api.usp_WMS_INV03_GetMaterialHistory_v1.sql
GO
:r .\stored-procedures\w1\api.usp_WMS_LOC01_GetLocationMap_v1.sql
GO
:r .\stored-procedures\w1\api.usp_WMS_ADM03_GetOperationsSummary_v1.sql
GO

:r .\security\0001_api_runtime_role.sql

PRINT N'Đã triển khai contract database W0/W1.';
GO

