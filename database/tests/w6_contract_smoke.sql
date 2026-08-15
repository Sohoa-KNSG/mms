SET NOCOUNT ON;
DECLARE @Expected TABLE (ObjectName sysname NOT NULL PRIMARY KEY);
INSERT @Expected VALUES
(N'api.usp_WMS_OUT06_GetPickingQueue_v1'),(N'api.usp_WMS_OUT06_GetPickingRequest_v1'),
(N'api.usp_WMS_OUT06_StartPicking_v1'),(N'api.usp_WMS_OUT07_GetPickableBatches_v1'),
(N'api.usp_WMS_OUT07_PickBatch_v1'),(N'api.usp_WMS_OUT08_CompleteGoodsIssue_v1'),
(N'api.usp_WMS_OUT09_GetIssueDocuments_v1'),(N'api.usp_WMS_OUT09_GetIssuePrintData_v1');
IF EXISTS (SELECT 1 FROM @Expected WHERE OBJECT_ID(ObjectName, N'P') IS NULL)
BEGIN
    SELECT MissingObject = ObjectName FROM @Expected WHERE OBJECT_ID(ObjectName, N'P') IS NULL;
    THROW 51210, N'Thieu SP W6.', 1;
END;
IF EXISTS
(
    SELECT 1 FROM @Expected AS expected
    INNER JOIN sys.sql_modules AS module ON module.object_id = OBJECT_ID(expected.ObjectName)
    WHERE module.definition LIKE N'%EXEC(%' OR module.definition LIKE N'%sp_executesql%'
) THROW 51211, N'SP W6 khong duoc dung SQL dong.', 1;
SELECT ContractStatus = N'PASS', ProcedureCount = COUNT(*) FROM @Expected;
