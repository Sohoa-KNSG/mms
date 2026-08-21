:on error exit
IF DB_NAME() <> N'MMS'
    THROW 51000, N'Toan bo contract chi duoc deploy vao database MMS.', 1;
GO

-- 1. Migrations & Table Types
:r .\migrations\0001_api_schema.sql
:r .\migrations\0002_w2_table_types.sql
:r .\migrations\0003_w3_table_types.sql
:r .\migrations\0004_w4_table_types.sql
:r .\migrations\0005_w5_table_types.sql
:r .\migrations\0006_w7_table_types.sql
GO

-- 2. 00-access
:r .\stored-procedures\00-access\api.usp_SEC_AUTH01_GetUserContext_v1.sql
GO
:r .\stored-procedures\00-access\api.usp_SEC_AUTH01_AuthenticateLegacy_v1.sql
GO
:r .\stored-procedures\00-access\api.usp_SEC_AUTH02_GetNavigation_v1.sql
GO

-- 3. 01-administration
:r .\stored-procedures\01-administration\api.usp_SEC_ADM01_GetRoleMatrix_v1.sql
GO
:r .\stored-procedures\01-administration\api.usp_SEC_ADM01_SaveRolePermissions_v1.sql
GO
:r .\stored-procedures\01-administration\api.usp_WMS_ADM02_GetConfigurationCatalog_v1.sql
GO
:r .\stored-procedures\01-administration\api.usp_WMS_ADM02_SaveConfiguration_v1.sql
GO
:r .\stored-procedures\01-administration\api.usp_WMS_ADM03_GetOperationsSummary_v1.sql
GO

-- 4. 10-receiving
:r .\stored-procedures\10-receiving\api.usp_WMS_INB01_GetPurchaseOrders_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB01_CreateReceiptWithPo_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB02_GetMaterials_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB02_CreateReceiptWithoutPo_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB03_GetReceipt_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB03_SaveReceipt_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB04_GetReceiptLog_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB05_GetUnmatchedReceipts_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB05_AttachPurchaseOrder_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB06_GetPurchaseOrderMatches_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB07_ProcessWarehouseReceipt_v1.sql
GO
:r .\stored-procedures\10-receiving\api.usp_WMS_INB08_GetBatchLabels_v1.sql
GO

-- 5. 20-quality
:r .\stored-procedures\20-quality\api.usp_QC_QC01_GetConfiguration_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC01_SaveCriteria_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC02_GetMaterialAssignments_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC02_AssignMaterialCheck_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC03_GetInspectionCandidates_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC03_CreateInspection_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC04_GetEvaluation_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC04_EvaluateMaterial_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC05_GetInspectionHistory_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC05_UpdateInspectionResult_v1.sql
GO
:r .\stored-procedures\20-quality\api.usp_QC_QC06_GetInspectionPrintData_v1.sql
GO

-- 6. 30-location-operations
:r .\stored-procedures\30-location-operations\api.usp_WMS_LOC01_GetLocationMap_v1.sql
GO
:r .\stored-procedures\30-location-operations\api.usp_WMS_LOC02_GetPutAwayWorklist_v1.sql
GO
:r .\stored-procedures\30-location-operations\api.usp_WMS_LOC02_PutAwayBatches_v1.sql
GO
:r .\stored-procedures\30-location-operations\api.usp_WMS_LOC03_GetRelocationWorklist_v1.sql
GO
:r .\stored-procedures\30-location-operations\api.usp_WMS_LOC03_RelocateBatches_v1.sql
GO
:r .\stored-procedures\30-location-operations\api.usp_WMS_LOC04_GetTakeDownWorklist_v1.sql
GO
:r .\stored-procedures\30-location-operations\api.usp_WMS_LOC04_TakeDownBatches_v1.sql
GO

-- 7. 40-inventory
:r .\stored-procedures\40-inventory\api.usp_WMS_INV01_GetInventoryBalance_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV02_GetBatchHistory_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV03_GetMaterialHistory_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV04_GetDeclarationCatalog_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV04_DeclareInventory_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV05_GetSplittableBatches_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV05_SplitBatch_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV06_GetBatchCount_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV06_CountBatch_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV07_GetLocationCount_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_WMS_INV07_CountLocationBatch_v1.sql
GO
:r .\stored-procedures\40-inventory\api.usp_INV08_CycleCount_Init_v1.sql
GO

-- 8. 50-outbound
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT00_SubmitRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT01_GetPlannedCatalog_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT01_CreatePlannedRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT02_GetUnplannedCatalog_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT02_CreateUnplannedRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT03_GetOverPlanCatalog_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT03_CreateOverPlanRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT04_GetRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT04_SaveRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT05_GetRequestQueue_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT05_DecideRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT05_CancelRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT06_GetPickingQueue_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT06_GetPickingRequest_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT06_StartPicking_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT07_GetPickableBatches_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT07_PickBatch_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT08_CompleteGoodsIssue_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT09_GetIssueDocuments_v1.sql
GO
:r .\stored-procedures\50-outbound\api.usp_WMS_OUT09_GetIssuePrintData_v1.sql
GO

-- 9. 60-internal-returns
:r .\stored-procedures\60-internal-returns\api.usp_WMS_RET01_GetReturnCatalog_v1.sql
GO
:r .\stored-procedures\60-internal-returns\api.usp_WMS_RET01_GetReturnQueue_v1.sql
GO
:r .\stored-procedures\60-internal-returns\api.usp_WMS_RET01_CreateInternalReturn_v1.sql
GO
:r .\stored-procedures\60-internal-returns\api.usp_WMS_RET01_GetInternalReturn_v1.sql
GO
:r .\stored-procedures\60-internal-returns\api.usp_WMS_RET02_ConfirmInternalReturn_v1.sql
GO
:r .\stored-procedures\60-internal-returns\api.usp_WMS_RET03_GetReturnDocuments_v1.sql
GO
:r .\stored-procedures\60-internal-returns\api.usp_WMS_RET03_GetReturnBatches_v1.sql
GO
:r .\stored-procedures\60-internal-returns\api.usp_WMS_RET03_SplitReturnBatch_v1.sql
GO

-- 10. Security
:r .\security\0001_api_runtime_role.sql
GO

PRINT N'Da deploy thanh cong toan bo 100% Stored Procedures & Schemas database MMS.';
GO
