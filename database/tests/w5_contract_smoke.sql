SET NOCOUNT ON;
DECLARE @Expected TABLE (ObjectName sysname NOT NULL PRIMARY KEY);
INSERT @Expected VALUES
(N'api.usp_WMS_OUT00_SubmitRequest_v1'),
(N'api.usp_WMS_OUT01_GetPlannedCatalog_v1'),(N'api.usp_WMS_OUT01_CreatePlannedRequest_v1'),
(N'api.usp_WMS_OUT02_GetUnplannedCatalog_v1'),(N'api.usp_WMS_OUT02_CreateUnplannedRequest_v1'),
(N'api.usp_WMS_OUT03_GetOverPlanCatalog_v1'),(N'api.usp_WMS_OUT03_CreateOverPlanRequest_v1'),
(N'api.usp_WMS_OUT04_GetRequest_v1'),(N'api.usp_WMS_OUT04_SaveRequest_v1'),
(N'api.usp_WMS_OUT05_GetRequestQueue_v1'),(N'api.usp_WMS_OUT05_DecideRequest_v1'),
(N'api.usp_WMS_OUT05_CancelRequest_v1');
IF EXISTS (SELECT 1 FROM @Expected WHERE OBJECT_ID(ObjectName, N'P') IS NULL)
BEGIN
    SELECT MissingObject = ObjectName FROM @Expected WHERE OBJECT_ID(ObjectName, N'P') IS NULL;
    THROW 51200, N'Thiếu SP W5.', 1;
END;
IF TYPE_ID(N'api.OutboundRequestItem_v1') IS NULL THROW 51201, N'Thiếu type W5.', 1;
IF EXISTS
(
    SELECT 1 FROM @Expected AS expected
    INNER JOIN sys.sql_modules AS module ON module.object_id = OBJECT_ID(expected.ObjectName)
    WHERE module.definition LIKE N'%EXEC(%' OR module.definition LIKE N'%sp_executesql%'
) THROW 51202, N'SP W5 không được dùng SQL động.', 1;
SELECT ContractStatus = N'PASS', ProcedureCount = COUNT(*) FROM @Expected;
