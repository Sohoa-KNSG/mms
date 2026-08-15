SET NOCOUNT ON;
DECLARE @Expected TABLE (ObjectName sysname NOT NULL PRIMARY KEY);
INSERT @Expected VALUES
(N'api.usp_WMS_INV04_GetDeclarationCatalog_v1'),(N'api.usp_WMS_INV04_DeclareInventory_v1'),
(N'api.usp_WMS_INV05_GetSplittableBatches_v1'),(N'api.usp_WMS_INV05_SplitBatch_v1'),
(N'api.usp_WMS_INV06_GetBatchCount_v1'),(N'api.usp_WMS_INV06_CountBatch_v1'),
(N'api.usp_WMS_INV07_GetLocationCount_v1'),(N'api.usp_WMS_INV07_CountLocationBatch_v1'),
(N'api.usp_WMS_LOC02_GetPutAwayWorklist_v1'),(N'api.usp_WMS_LOC02_PutAwayBatches_v1'),
(N'api.usp_WMS_LOC03_GetRelocationWorklist_v1'),(N'api.usp_WMS_LOC03_RelocateBatches_v1'),
(N'api.usp_WMS_LOC04_GetTakeDownWorklist_v1'),(N'api.usp_WMS_LOC04_TakeDownBatches_v1');
IF EXISTS (SELECT 1 FROM @Expected WHERE OBJECT_ID(ObjectName, N'P') IS NULL)
BEGIN SELECT MissingObject = ObjectName FROM @Expected WHERE OBJECT_ID(ObjectName, N'P') IS NULL; THROW 51100, N'Thiếu SP W4.', 1; END;
IF TYPE_ID(N'api.InventoryDeclarationItem_v1') IS NULL OR TYPE_ID(N'api.BatchLocationItem_v1') IS NULL THROW 51101, N'Thiếu type W4.', 1;
IF EXISTS (SELECT 1 FROM @Expected AS expected INNER JOIN sys.sql_modules AS module ON module.object_id = OBJECT_ID(expected.ObjectName)
    WHERE module.definition LIKE N'%EXEC(%' OR module.definition LIKE N'%sp_executesql%') THROW 51102, N'SP W4 không được dùng SQL động.', 1;
SELECT ContractStatus = N'PASS', ProcedureCount = COUNT(*) FROM @Expected;

