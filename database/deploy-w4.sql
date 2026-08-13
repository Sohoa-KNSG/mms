:on error exit
SET XACT_ABORT ON;
GO
:r .\migrations\0004_w4_table_types.sql
:r .\stored-procedures\w4\api.usp_WMS_INV04_GetDeclarationCatalog_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_INV04_DeclareInventory_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_INV05_GetSplittableBatches_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_INV05_SplitBatch_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_INV06_GetBatchCount_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_INV06_CountBatch_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_INV07_GetLocationCount_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_INV07_CountLocationBatch_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_LOC02_GetPutAwayWorklist_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_LOC02_PutAwayBatches_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_LOC03_GetRelocationWorklist_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_LOC03_RelocateBatches_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_LOC04_GetTakeDownWorklist_v1.sql
:r .\stored-procedures\w4\api.usp_WMS_LOC04_TakeDownBatches_v1.sql
GO

