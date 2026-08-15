SET NOCOUNT ON;
DECLARE @Expected TABLE (ObjectName sysname NOT NULL PRIMARY KEY);
INSERT @Expected VALUES
(N'api.usp_WMS_RET01_GetReturnCatalog_v1'),(N'api.usp_WMS_RET01_CreateInternalReturn_v1'),
(N'api.usp_WMS_RET01_GetReturnQueue_v1'),(N'api.usp_WMS_RET01_GetInternalReturn_v1'),
(N'api.usp_WMS_RET02_ConfirmInternalReturn_v1'),(N'api.usp_WMS_RET03_GetReturnDocuments_v1'),
(N'api.usp_WMS_RET03_GetReturnBatches_v1'),(N'api.usp_WMS_RET03_SplitReturnBatch_v1');
IF EXISTS (SELECT 1 FROM @Expected WHERE OBJECT_ID(ObjectName, N'P') IS NULL)
BEGIN
    SELECT MissingObject = ObjectName FROM @Expected WHERE OBJECT_ID(ObjectName, N'P') IS NULL;
    THROW 51220, N'Thieu SP W7.', 1;
END;
IF TYPE_ID(N'api.InternalReturnItem_v1') IS NULL THROW 51221, N'Thieu type W7.', 1;
IF EXISTS
(
    SELECT 1 FROM @Expected AS expected
    INNER JOIN sys.sql_modules AS module ON module.object_id = OBJECT_ID(expected.ObjectName)
    WHERE module.definition LIKE N'%EXEC(%' OR module.definition LIKE N'%sp_executesql%'
) THROW 51222, N'SP W7 khong duoc dung SQL dong.', 1;
SELECT ContractStatus = N'PASS', ProcedureCount = COUNT(*) FROM @Expected;
