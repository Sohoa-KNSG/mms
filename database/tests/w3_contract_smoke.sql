SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ExpectedObjects TABLE (ObjectName sysname NOT NULL PRIMARY KEY);
INSERT @ExpectedObjects (ObjectName) VALUES
    (N'api.usp_WMS_INB01_GetPurchaseOrders_v1'),
    (N'api.usp_WMS_INB01_CreateReceiptWithPo_v1'),
    (N'api.usp_WMS_INB02_GetMaterials_v1'),
    (N'api.usp_WMS_INB02_CreateReceiptWithoutPo_v1'),
    (N'api.usp_WMS_INB03_GetReceipt_v1'),
    (N'api.usp_WMS_INB03_SaveReceipt_v1'),
    (N'api.usp_WMS_INB05_GetUnmatchedReceipts_v1'),
    (N'api.usp_WMS_INB05_AttachPurchaseOrder_v1'),
    (N'api.usp_WMS_INB06_GetPurchaseOrderMatches_v1'),
    (N'api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1'),
    (N'api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1'),
    (N'api.usp_WMS_INB07_ProcessWarehouseReceipt_v1'),
    (N'api.usp_WMS_INB08_GetBatchLabels_v1');

IF EXISTS
(
    SELECT 1 FROM @ExpectedObjects AS expected
    WHERE OBJECT_ID(expected.ObjectName, N'P') IS NULL
)
BEGIN
    SELECT MissingObject = expected.ObjectName
    FROM @ExpectedObjects AS expected
    WHERE OBJECT_ID(expected.ObjectName, N'P') IS NULL;
    THROW 51100, N'Thiếu stored procedure W3.', 1;
END;

IF TYPE_ID(N'api.ReceivingLineItem_v1') IS NULL
 OR TYPE_ID(N'api.ReceiptImageItem_v1') IS NULL
 OR TYPE_ID(N'api.ReceiptPoAssignmentItem_v1') IS NULL
 OR TYPE_ID(N'api.WarehouseReceiptItem_v1') IS NULL
    THROW 51101, N'Thiếu table type W3.', 1;

IF EXISTS
(
    SELECT 1 FROM @ExpectedObjects AS expected
    INNER JOIN sys.sql_modules AS module ON module.object_id = OBJECT_ID(expected.ObjectName)
    WHERE module.definition LIKE N'%EXEC(%'
       OR module.definition LIKE N'%sp_executesql%'
)
    THROW 51102, N'SP W3 không được dùng SQL động.', 1;

SELECT ContractStatus = N'PASS', ProcedureCount = COUNT(*) FROM @ExpectedObjects;

