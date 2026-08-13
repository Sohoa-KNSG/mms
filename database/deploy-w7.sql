:on error exit
IF DB_NAME() <> N'MMS'
    THROW 51000, N'Script W7 chi duoc chay khi database hien tai la MMS.', 1;
GO
SET XACT_ABORT ON;
GO
:r .\migrations\0006_w7_table_types.sql
GO
:r .\stored-procedures\w7\api.usp_WMS_RET01_GetReturnCatalog_v1.sql
GO
:r .\stored-procedures\w7\api.usp_WMS_RET01_CreateInternalReturn_v1.sql
GO
:r .\stored-procedures\w7\api.usp_WMS_RET01_GetReturnQueue_v1.sql
GO
:r .\stored-procedures\w7\api.usp_WMS_RET01_GetInternalReturn_v1.sql
GO
:r .\stored-procedures\w7\api.usp_WMS_RET02_ConfirmInternalReturn_v1.sql
GO
:r .\stored-procedures\w7\api.usp_WMS_RET03_GetReturnDocuments_v1.sql
GO
:r .\stored-procedures\w7\api.usp_WMS_RET03_GetReturnBatches_v1.sql
GO
:r .\stored-procedures\w7\api.usp_WMS_RET03_SplitReturnBatch_v1.sql
GO
