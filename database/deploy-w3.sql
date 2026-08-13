:on error exit
SET XACT_ABORT ON;
GO

:r .\migrations\0003_w3_table_types.sql
:r .\stored-procedures\w3\api.usp_WMS_INB01_GetPurchaseOrders_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB01_CreateReceiptWithPo_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB02_GetMaterials_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB02_CreateReceiptWithoutPo_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB03_GetReceipt_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB03_SaveReceipt_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB05_GetUnmatchedReceipts_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB05_AttachPurchaseOrder_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB06_GetPurchaseOrderMatches_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB07_ProcessWarehouseReceipt_v1.sql
:r .\stored-procedures\w3\api.usp_WMS_INB08_GetBatchLabels_v1.sql
GO

