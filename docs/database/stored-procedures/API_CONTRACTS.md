# API contract

Database `MMS` · snapshot `2026-08-15 13:42:41 +07:00` · **79 procedure**

## Mục lục

- [`api.usp_QC_QC01_GetConfiguration_v1`](#api-usp-qc-qc01-getconfiguration-v1)
- [`api.usp_QC_QC01_SaveCriteria_v1`](#api-usp-qc-qc01-savecriteria-v1)
- [`api.usp_QC_QC02_AssignMaterialCheck_v1`](#api-usp-qc-qc02-assignmaterialcheck-v1)
- [`api.usp_QC_QC02_GetMaterialAssignments_v1`](#api-usp-qc-qc02-getmaterialassignments-v1)
- [`api.usp_QC_QC03_CreateInspection_v1`](#api-usp-qc-qc03-createinspection-v1)
- [`api.usp_QC_QC03_GetInspectionCandidates_v1`](#api-usp-qc-qc03-getinspectioncandidates-v1)
- [`api.usp_QC_QC04_EvaluateMaterial_v1`](#api-usp-qc-qc04-evaluatematerial-v1)
- [`api.usp_QC_QC04_GetEvaluation_v1`](#api-usp-qc-qc04-getevaluation-v1)
- [`api.usp_QC_QC05_GetInspectionHistory_v1`](#api-usp-qc-qc05-getinspectionhistory-v1)
- [`api.usp_QC_QC05_UpdateInspectionResult_v1`](#api-usp-qc-qc05-updateinspectionresult-v1)
- [`api.usp_QC_QC06_GetInspectionPrintData_v1`](#api-usp-qc-qc06-getinspectionprintdata-v1)
- [`api.usp_SEC_ADM01_GetRoleMatrix_v1`](#api-usp-sec-adm01-getrolematrix-v1)
- [`api.usp_SEC_ADM01_SaveRolePermissions_v1`](#api-usp-sec-adm01-saverolepermissions-v1)
- [`api.usp_SEC_AUTH01_AuthenticateLegacy_v1`](#api-usp-sec-auth01-authenticatelegacy-v1)
- [`api.usp_SEC_AUTH01_GetUserContext_v1`](#api-usp-sec-auth01-getusercontext-v1)
- [`api.usp_SEC_AUTH02_GetNavigation_v1`](#api-usp-sec-auth02-getnavigation-v1)
- [`api.usp_WMS_ADM02_GetConfigurationCatalog_v1`](#api-usp-wms-adm02-getconfigurationcatalog-v1)
- [`api.usp_WMS_ADM02_SaveConfiguration_v1`](#api-usp-wms-adm02-saveconfiguration-v1)
- [`api.usp_WMS_ADM03_GetOperationsSummary_v1`](#api-usp-wms-adm03-getoperationssummary-v1)
- [`api.usp_WMS_INB01_CreateReceiptWithPo_v1`](#api-usp-wms-inb01-createreceiptwithpo-v1)
- [`api.usp_WMS_INB01_GetPurchaseOrders_v1`](#api-usp-wms-inb01-getpurchaseorders-v1)
- [`api.usp_WMS_INB02_CreateReceiptWithoutPo_v1`](#api-usp-wms-inb02-createreceiptwithoutpo-v1)
- [`api.usp_WMS_INB02_GetMaterials_v1`](#api-usp-wms-inb02-getmaterials-v1)
- [`api.usp_WMS_INB03_GetReceipt_v1`](#api-usp-wms-inb03-getreceipt-v1)
- [`api.usp_WMS_INB03_SaveReceipt_v1`](#api-usp-wms-inb03-savereceipt-v1)
- [`api.usp_WMS_INB04_GetReceiptLog_v1`](#api-usp-wms-inb04-getreceiptlog-v1)
- [`api.usp_WMS_INB05_AttachPurchaseOrder_v1`](#api-usp-wms-inb05-attachpurchaseorder-v1)
- [`api.usp_WMS_INB05_GetUnmatchedReceipts_v1`](#api-usp-wms-inb05-getunmatchedreceipts-v1)
- [`api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1`](#api-usp-wms-inb06-attachmultiplepurchaseorders-v1)
- [`api.usp_WMS_INB06_GetPurchaseOrderMatches_v1`](#api-usp-wms-inb06-getpurchaseordermatches-v1)
- [`api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1`](#api-usp-wms-inb07-getwarehousereceiptqueue-v1)
- [`api.usp_WMS_INB07_ProcessWarehouseReceipt_v1`](#api-usp-wms-inb07-processwarehousereceipt-v1)
- [`api.usp_WMS_INB08_GetBatchLabels_v1`](#api-usp-wms-inb08-getbatchlabels-v1)
- [`api.usp_WMS_INV01_GetInventoryBalance_v1`](#api-usp-wms-inv01-getinventorybalance-v1)
- [`api.usp_WMS_INV02_GetBatchHistory_v1`](#api-usp-wms-inv02-getbatchhistory-v1)
- [`api.usp_WMS_INV03_GetMaterialHistory_v1`](#api-usp-wms-inv03-getmaterialhistory-v1)
- [`api.usp_WMS_INV04_DeclareInventory_v1`](#api-usp-wms-inv04-declareinventory-v1)
- [`api.usp_WMS_INV04_GetDeclarationCatalog_v1`](#api-usp-wms-inv04-getdeclarationcatalog-v1)
- [`api.usp_WMS_INV05_GetSplittableBatches_v1`](#api-usp-wms-inv05-getsplittablebatches-v1)
- [`api.usp_WMS_INV05_SplitBatch_v1`](#api-usp-wms-inv05-splitbatch-v1)
- [`api.usp_WMS_INV06_CountBatch_v1`](#api-usp-wms-inv06-countbatch-v1)
- [`api.usp_WMS_INV06_GetBatchCount_v1`](#api-usp-wms-inv06-getbatchcount-v1)
- [`api.usp_WMS_INV07_CountLocationBatch_v1`](#api-usp-wms-inv07-countlocationbatch-v1)
- [`api.usp_WMS_INV07_GetLocationCount_v1`](#api-usp-wms-inv07-getlocationcount-v1)
- [`api.usp_WMS_LOC01_GetLocationMap_v1`](#api-usp-wms-loc01-getlocationmap-v1)
- [`api.usp_WMS_LOC02_GetPutAwayWorklist_v1`](#api-usp-wms-loc02-getputawayworklist-v1)
- [`api.usp_WMS_LOC02_PutAwayBatches_v1`](#api-usp-wms-loc02-putawaybatches-v1)
- [`api.usp_WMS_LOC03_GetRelocationWorklist_v1`](#api-usp-wms-loc03-getrelocationworklist-v1)
- [`api.usp_WMS_LOC03_RelocateBatches_v1`](#api-usp-wms-loc03-relocatebatches-v1)
- [`api.usp_WMS_LOC04_GetTakeDownWorklist_v1`](#api-usp-wms-loc04-gettakedownworklist-v1)
- [`api.usp_WMS_LOC04_TakeDownBatches_v1`](#api-usp-wms-loc04-takedownbatches-v1)
- [`api.usp_WMS_OUT00_SubmitRequest_v1`](#api-usp-wms-out00-submitrequest-v1)
- [`api.usp_WMS_OUT01_CreatePlannedRequest_v1`](#api-usp-wms-out01-createplannedrequest-v1)
- [`api.usp_WMS_OUT01_GetPlannedCatalog_v1`](#api-usp-wms-out01-getplannedcatalog-v1)
- [`api.usp_WMS_OUT02_CreateUnplannedRequest_v1`](#api-usp-wms-out02-createunplannedrequest-v1)
- [`api.usp_WMS_OUT02_GetUnplannedCatalog_v1`](#api-usp-wms-out02-getunplannedcatalog-v1)
- [`api.usp_WMS_OUT03_CreateOverPlanRequest_v1`](#api-usp-wms-out03-createoverplanrequest-v1)
- [`api.usp_WMS_OUT03_GetOverPlanCatalog_v1`](#api-usp-wms-out03-getoverplancatalog-v1)
- [`api.usp_WMS_OUT04_GetRequest_v1`](#api-usp-wms-out04-getrequest-v1)
- [`api.usp_WMS_OUT04_SaveRequest_v1`](#api-usp-wms-out04-saverequest-v1)
- [`api.usp_WMS_OUT05_CancelRequest_v1`](#api-usp-wms-out05-cancelrequest-v1)
- [`api.usp_WMS_OUT05_DecideRequest_v1`](#api-usp-wms-out05-deciderequest-v1)
- [`api.usp_WMS_OUT05_GetRequestQueue_v1`](#api-usp-wms-out05-getrequestqueue-v1)
- [`api.usp_WMS_OUT06_GetPickingQueue_v1`](#api-usp-wms-out06-getpickingqueue-v1)
- [`api.usp_WMS_OUT06_GetPickingRequest_v1`](#api-usp-wms-out06-getpickingrequest-v1)
- [`api.usp_WMS_OUT06_StartPicking_v1`](#api-usp-wms-out06-startpicking-v1)
- [`api.usp_WMS_OUT07_GetPickableBatches_v1`](#api-usp-wms-out07-getpickablebatches-v1)
- [`api.usp_WMS_OUT07_PickBatch_v1`](#api-usp-wms-out07-pickbatch-v1)
- [`api.usp_WMS_OUT08_CompleteGoodsIssue_v1`](#api-usp-wms-out08-completegoodsissue-v1)
- [`api.usp_WMS_OUT09_GetIssueDocuments_v1`](#api-usp-wms-out09-getissuedocuments-v1)
- [`api.usp_WMS_OUT09_GetIssuePrintData_v1`](#api-usp-wms-out09-getissueprintdata-v1)
- [`api.usp_WMS_RET01_CreateInternalReturn_v1`](#api-usp-wms-ret01-createinternalreturn-v1)
- [`api.usp_WMS_RET01_GetInternalReturn_v1`](#api-usp-wms-ret01-getinternalreturn-v1)
- [`api.usp_WMS_RET01_GetReturnCatalog_v1`](#api-usp-wms-ret01-getreturncatalog-v1)
- [`api.usp_WMS_RET01_GetReturnQueue_v1`](#api-usp-wms-ret01-getreturnqueue-v1)
- [`api.usp_WMS_RET02_ConfirmInternalReturn_v1`](#api-usp-wms-ret02-confirminternalreturn-v1)
- [`api.usp_WMS_RET03_GetReturnBatches_v1`](#api-usp-wms-ret03-getreturnbatches-v1)
- [`api.usp_WMS_RET03_GetReturnDocuments_v1`](#api-usp-wms-ret03-getreturndocuments-v1)
- [`api.usp_WMS_RET03_SplitReturnBatch_v1`](#api-usp-wms-ret03-splitreturnbatch-v1)

## `api.usp_QC_QC01_GetConfiguration_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@CheckId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_tieuchi_kiem]` | USER TABLE |
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |
| `[dbo].[tbl_nhom_qc]` | USER TABLE |
| `[dbo].[tbl_nhom_vattu_qc]` | USER TABLE |
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |

## `api.usp_QC_QC01_SaveCriteria_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@CheckId` | `int` | Không | `—` |
| 3 | `@QcGroupCode` | `nvarchar(50)` | Không | `—` |
| 4 | `@QcGroupName` | `nvarchar(100)` | Không | `—` |
| 5 | `@DeclarationLevel` | `int` | Không | `—` |
| 6 | `@MaterialGroupCode` | `nvarchar(50)` | Không | `—` |
| 7 | `@MaterialId` | `nvarchar(50)` | Không | `—` |
| 8 | `@ExpectedChangedAt` | `datetime2` | Không | `—` |
| 9 | `@Criteria` | `[api].[QcCriterionItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[QcCriterionItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_nhom_vattu]` | USER TABLE |
| `[dbo].[tbl_dm_tieuchi_kiem]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |
| `[dbo].[tbl_nhom_qc]` | USER TABLE |
| `[dbo].[tbl_nhom_vattu_qc]` | USER TABLE |
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |

## `api.usp_QC_QC02_AssignMaterialCheck_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Scope` | `nvarchar(20)` | Không | `—` |
| 3 | `@TargetCode` | `nvarchar(50)` | Không | `—` |
| 4 | `@CheckId` | `int` | Không | `—` |
| 5 | `@ExpectedCheckId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_nhom_vattu]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |
| `[dbo].[tbl_nhom_vattu_qc]` | USER TABLE |

## `api.usp_QC_QC02_GetMaterialAssignments_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |
| `[dbo].[tbl_nhom_qc]` | USER TABLE |

## `api.usp_QC_QC03_CreateInspection_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReceiptId` | `int` | Không | `—` |
| 3 | `@Note` | `nvarchar(max)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |

## `api.usp_QC_QC03_GetInspectionCandidates_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@ReceiptId` | `int` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |
| `[dbo].[tbl_nhom_qc]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `api.usp_QC_QC04_EvaluateMaterial_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@InspectionId` | `int` | Không | `—` |
| 3 | `@ReceivingLineId` | `int` | Không | `—` |
| 4 | `@InspectionType` | `nvarchar(50)` | Không | `—` |
| 5 | `@InspectedQuantity` | `decimal(19,4)` | Không | `—` |
| 6 | `@FailedQuantity` | `decimal(19,4)` | Không | `—` |
| 7 | `@OverallResultCode` | `nvarchar(50)` | Không | `—` |
| 8 | `@Results` | `[api].[QcEvaluationItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[QcEvaluationItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_qc_kiem]` | USER TABLE |
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |

## `api.usp_QC_QC04_GetEvaluation_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@InspectionId` | `int` | Không | `—` |
| 3 | `@ReceivingLineId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_qc_kiem]` | USER TABLE |
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |

## `api.usp_QC_QC05_GetInspectionHistory_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@InspectionId` | `int` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_qc_kiem]` | USER TABLE |
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |

## `api.usp_QC_QC05_UpdateInspectionResult_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@QcResultId` | `int` | Không | `—` |
| 3 | `@InspectionType` | `nvarchar(50)` | Không | `—` |
| 4 | `@InspectedQuantity` | `decimal(19,4)` | Không | `—` |
| 5 | `@FailedQuantity` | `decimal(19,4)` | Không | `—` |
| 6 | `@ResultCode` | `nvarchar(50)` | Không | `—` |
| 7 | `@OverallResultCode` | `nvarchar(50)` | Không | `—` |
| 8 | `@DefectNote` | `nvarchar(max)` | Không | `—` |
| 9 | `@ExpectedChangedAt` | `datetime2` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_qc_kiem]` | USER TABLE |
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |

## `api.usp_QC_QC06_GetInspectionPrintData_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:47`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@InspectionId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_qc_kiem]` | USER TABLE |
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `api.usp_SEC_ADM01_GetRoleMatrix_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RoleCode` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_screen_pc]` | USER TABLE |
| `[dbo].[tbl_role]` | USER TABLE |
| `[dbo].[tbl_role_screen]` | USER TABLE |

## `api.usp_SEC_ADM01_SaveRolePermissions_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RoleCode` | `nvarchar(50)` | Không | `—` |
| 3 | `@RoleName` | `nvarchar(50)` | Không | `—` |
| 4 | `@ExpectedChangedAt` | `datetime2` | Không | `—` |
| 5 | `@Permissions` | `[api].[RolePermissionItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[RolePermissionItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_screen_pc]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_role]` | USER TABLE |
| `[dbo].[tbl_role_screen]` | USER TABLE |
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `api.usp_SEC_AUTH01_AuthenticateLegacy_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 08:12:09`
- Sửa gần nhất: `2026-08-13 08:12:09`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserName` | `nvarchar(50)` | Không | `—` |
| 2 | `@Password` | `nvarchar(255)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_role]` | USER TABLE |

## `api.usp_SEC_AUTH01_GetUserContext_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 04:35:42`
- Sửa gần nhất: `2026-08-13 08:12:09`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_role]` | USER TABLE |
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `api.usp_SEC_AUTH02_GetNavigation_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 04:35:42`
- Sửa gần nhất: `2026-08-13 08:12:09`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `api.usp_WMS_ADM02_GetConfigurationCatalog_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@CatalogCode` | `nvarchar(40)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_batch_event]` | USER TABLE |
| `[dbo].[tbl_dm_location_event]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_dm_nhom_vattu]` | USER TABLE |
| `[dbo].[tbl_dm_status_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_trangthai_ton]` | USER TABLE |

## `api.usp_WMS_ADM02_SaveConfiguration_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:20:47`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@CatalogCode` | `nvarchar(40)` | Không | `—` |
| 3 | `@KeyCode` | `nvarchar(50)` | Không | `—` |
| 4 | `@Name` | `nvarchar(100)` | Không | `—` |
| 5 | `@Description` | `nvarchar(255)` | Không | `—` |
| 6 | `@LogicValue` | `nvarchar(50)` | Không | `—` |
| 7 | `@DisplayValue` | `nvarchar(100)` | Không | `—` |
| 8 | `@ExpectedChangedAt` | `datetime2` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_batch_event]` | USER TABLE |
| `[dbo].[tbl_dm_location_event]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_dm_nhom_vattu]` | USER TABLE |
| `[dbo].[tbl_dm_status_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_trangthai_ton]` | USER TABLE |

## `api.usp_WMS_ADM03_GetOperationsSummary_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:19:55`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_dm_status_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_trangthai_ton]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INB01_CreateReceiptWithPo_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:51`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@PurchaseOrder` | `nvarchar(50)` | Không | `—` |
| 3 | `@WarehouseCode` | `nvarchar(50)` | Không | `—` |
| 4 | `@Lines` | `[api].[ReceivingLineItem_v1]` | Không | `—` |
| 5 | `@Images` | `[api].[ReceiptImageItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[ReceiptImageItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[ReceivingLineItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |
| `[dbo].[tbl_his_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang_image]` | USER TABLE |

## `api.usp_WMS_INB01_GetPurchaseOrders_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:51`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |

## `api.usp_WMS_INB02_CreateReceiptWithoutPo_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@SupplierName` | `nvarchar(50)` | Không | `—` |
| 3 | `@WarehouseCode` | `nvarchar(50)` | Không | `—` |
| 4 | `@Lines` | `[api].[ReceivingLineItem_v1]` | Không | `—` |
| 5 | `@Images` | `[api].[ReceiptImageItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[ReceiptImageItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[ReceivingLineItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_his_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang_image]` | USER TABLE |

## `api.usp_WMS_INB02_GetMaterials_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |

## `api.usp_WMS_INB03_GetReceipt_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReceiptId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang_image]` | USER TABLE |

## `api.usp_WMS_INB03_SaveReceipt_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReceiptId` | `int` | Không | `—` |
| 3 | `@WarehouseCode` | `nvarchar(50)` | Không | `—` |
| 4 | `@CustomerName` | `nvarchar(50)` | Không | `—` |
| 5 | `@PurchaseOrder` | `nvarchar(50)` | Không | `—` |
| 6 | `@Action` | `nvarchar(20)` | Không | `—` |
| 7 | `@ExpectedStatus` | `nvarchar(50)` | Không | `—` |
| 8 | `@Lines` | `[api].[ReceivingLineItem_v1]` | Không | `—` |
| 9 | `@Images` | `[api].[ReceiptImageItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[ReceiptImageItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[ReceivingLineItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |
| `[dbo].[tbl_his_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang_image]` | USER TABLE |

## `api.usp_WMS_INB04_GetReceiptLog_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:19:55`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_status_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `api.usp_WMS_INB05_AttachPurchaseOrder_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReceiptId` | `int` | Không | `—` |
| 3 | `@PurchaseOrder` | `nvarchar(50)` | Không | `—` |
| 4 | `@ExpectedStatus` | `nvarchar(50)` | Không | `—` |
| 5 | `@Assignments` | `[api].[ReceiptPoAssignmentItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[ReceiptPoAssignmentItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `api.usp_WMS_INB05_GetUnmatchedReceipts_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReceiptId` | `int` | Không | `—` |
| 3 | `@ExpectedStatus` | `nvarchar(50)` | Không | `—` |
| 4 | `@Assignments` | `[api].[ReceiptPoAssignmentItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[ReceiptPoAssignmentItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `api.usp_WMS_INB06_GetPurchaseOrderMatches_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReceiptId` | `int` | Không | `—` |
| 3 | `@Search` | `nvarchar(200)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@ReceiptId` | `int` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `api.usp_WMS_INB07_ProcessWarehouseReceipt_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Xử lý giao dịch nghiệp vụ
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReceiptId` | `int` | Không | `—` |
| 3 | `@ExpectedStatus` | `nvarchar(50)` | Không | `—` |
| 4 | `@Items` | `[api].[WarehouseReceiptItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[api].[WarehouseReceiptItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_his_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INB08_GetBatchLabels_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-12 07:39:28`
- Sửa gần nhất: `2026-08-13 01:20:52`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReceiptId` | `int` | Không | `—` |
| 3 | `@TransactionDocumentId` | `int` | Không | `—` |
| 4 | `@BatchId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV01_GetInventoryBalance_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:19:55`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV02_GetBatchHistory_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:19:55`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@BatchId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_event]` | USER TABLE |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_batch_event]` | USER TABLE |
| `[dbo].[tbl_dm_location_event]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_dm_trangthai_ton]` | USER TABLE |
| `[dbo].[tbl_location_event]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV03_GetMaterialHistory_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:19:55`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@MaterialId` | `nvarchar(50)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV04_DeclareInventory_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:56`
- Sửa gần nhất: `2026-08-13 01:20:56`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@WarehouseCode` | `nvarchar(50)` | Không | `—` |
| 3 | `@Reason` | `nvarchar(50)` | Không | `—` |
| 4 | `@Items` | `[api].[InventoryDeclarationItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[InventoryDeclarationItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_location_event]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV04_GetDeclarationCatalog_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:56`
- Sửa gần nhất: `2026-08-13 01:20:56`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |

## `api.usp_WMS_INV05_GetSplittableBatches_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:56`
- Sửa gần nhất: `2026-08-13 01:20:56`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@BatchId` | `int` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV05_SplitBatch_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:56`
- Sửa gần nhất: `2026-08-13 01:20:56`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@BatchId` | `int` | Không | `—` |
| 3 | `@SplitQuantity` | `decimal(19,4)` | Không | `—` |
| 4 | `@ExpectedQuantity` | `decimal(19,4)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV06_CountBatch_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@BatchId` | `int` | Không | `—` |
| 3 | `@ActualQuantity` | `decimal(19,4)` | Không | `—` |
| 4 | `@ExpectedQuantity` | `decimal(19,4)` | Không | `—` |
| 5 | `@Reason` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV06_GetBatchCount_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:56`
- Sửa gần nhất: `2026-08-13 01:20:56`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@BatchId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV07_CountLocationBatch_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@LocationCode` | `nvarchar(50)` | Không | `—` |
| 3 | `@BatchId` | `int` | Không | `—` |
| 4 | `@ActualQuantity` | `decimal(19,4)` | Không | `—` |
| 5 | `@ExpectedQuantity` | `decimal(19,4)` | Không | `—` |
| 6 | `@Reason` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_INV07_GetLocationCount_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@LocationCode` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |

## `api.usp_WMS_LOC01_GetLocationMap_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:19:55`
- Sửa gần nhất: `2026-08-13 01:19:55`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@AreaCode` | `nvarchar(10)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |

## `api.usp_WMS_LOC02_GetPutAwayWorklist_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |

## `api.usp_WMS_LOC02_PutAwayBatches_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@LocationCode` | `nvarchar(50)` | Không | `—` |
| 3 | `@Batches` | `[api].[BatchLocationItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[BatchLocationItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |
| `[dbo].[tbl_location_event]` | USER TABLE |

## `api.usp_WMS_LOC03_GetRelocationWorklist_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@LocationCode` | `nvarchar(50)` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |

## `api.usp_WMS_LOC03_RelocateBatches_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@TargetLocationCode` | `nvarchar(50)` | Không | `—` |
| 3 | `@Batches` | `[api].[BatchLocationItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[BatchLocationItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |
| `[dbo].[tbl_location_event]` | USER TABLE |

## `api.usp_WMS_LOC04_GetTakeDownWorklist_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@LocationCode` | `nvarchar(50)` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |

## `api.usp_WMS_LOC04_TakeDownBatches_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:20:57`
- Sửa gần nhất: `2026-08-13 01:20:57`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Batches` | `[api].[BatchLocationItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[BatchLocationItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_location_event]` | USER TABLE |

## `api.usp_WMS_OUT00_SubmitRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:17:08`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Classification` | `nvarchar(20)` | Không | `—` |
| 3 | `@PlanningUnit` | `nvarchar(50)` | Không | `—` |
| 4 | `@NeededAt` | `datetime` | Không | `—` |
| 5 | `@DestinationBravoCode` | `nvarchar(50)` | Không | `—` |
| 6 | `@DestinationName` | `nvarchar(50)` | Không | `—` |
| 7 | `@Items` | `[api].[OutboundRequestItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[OutboundRequestItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dinhmuc]` | USER TABLE |
| `[dbo].[tbl_dm_kehoach]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_flow_pheduyet]` | USER TABLE |
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |
| `[dbo].[tbl_pheduyet_process]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `api.usp_WMS_OUT01_CreatePlannedRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-08-13 01:17:08`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@PlanningUnit` | `nvarchar(50)` | Không | `—` |
| 3 | `@NeededAt` | `datetime` | Không | `—` |
| 4 | `@DestinationBravoCode` | `nvarchar(50)` | Không | `—` |
| 5 | `@DestinationName` | `nvarchar(50)` | Không | `—` |
| 6 | `@Items` | `[api].[OutboundRequestItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[OutboundRequestItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[usp_WMS_OUT00_SubmitRequest_v1]` | SQL STORED PROCEDURE |

## `api.usp_WMS_OUT01_GetPlannedCatalog_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:17:08`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@PlanningUnit` | `nvarchar(50)` | Không | `—` |
| 3 | `@Search` | `nvarchar(200)` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |
| 6 | `@RequiredScreenCode` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dinhmuc]` | USER TABLE |
| `[dbo].[tbl_dm_kehoach]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `api.usp_WMS_OUT02_CreateUnplannedRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-08-13 01:17:08`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@PlanningUnit` | `nvarchar(50)` | Không | `—` |
| 3 | `@NeededAt` | `datetime` | Không | `—` |
| 4 | `@DestinationBravoCode` | `nvarchar(50)` | Không | `—` |
| 5 | `@DestinationName` | `nvarchar(50)` | Không | `—` |
| 6 | `@Items` | `[api].[OutboundRequestItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[OutboundRequestItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[usp_WMS_OUT00_SubmitRequest_v1]` | SQL STORED PROCEDURE |

## `api.usp_WMS_OUT02_GetUnplannedCatalog_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:17:08`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@PlanningUnit` | `nvarchar(50)` | Không | `—` |
| 3 | `@Search` | `nvarchar(200)` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_kehoach]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `api.usp_WMS_OUT03_CreateOverPlanRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-08-13 01:17:09`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@PlanningUnit` | `nvarchar(50)` | Không | `—` |
| 3 | `@NeededAt` | `datetime` | Không | `—` |
| 4 | `@DestinationBravoCode` | `nvarchar(50)` | Không | `—` |
| 5 | `@DestinationName` | `nvarchar(50)` | Không | `—` |
| 6 | `@Items` | `[api].[OutboundRequestItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[OutboundRequestItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[usp_WMS_OUT00_SubmitRequest_v1]` | SQL STORED PROCEDURE |

## `api.usp_WMS_OUT03_GetOverPlanCatalog_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:17:09`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@PlanningUnit` | `nvarchar(50)` | Không | `—` |
| 3 | `@Search` | `nvarchar(200)` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[usp_WMS_OUT01_GetPlannedCatalog_v1]` | SQL STORED PROCEDURE |

## `api.usp_WMS_OUT04_GetRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:17:09`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_flow_pheduyet]` | USER TABLE |
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `api.usp_WMS_OUT04_SaveRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-08-13 01:17:09`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |
| 3 | `@NeededAt` | `datetime` | Không | `—` |
| 4 | `@DestinationBravoCode` | `nvarchar(50)` | Không | `—` |
| 5 | `@DestinationName` | `nvarchar(50)` | Không | `—` |
| 6 | `@ExpectedChangedAt` | `datetime` | Không | `—` |
| 7 | `@Items` | `[api].[OutboundRequestItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[OutboundRequestItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dinhmuc]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_flow_pheduyet]` | USER TABLE |
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `api.usp_WMS_OUT05_CancelRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Hủy hoặc xóa logic
- Tạo: `2026-08-13 01:17:09`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |
| 3 | `@Reason` | `nvarchar(255)` | Không | `—` |
| 4 | `@ExpectedChangedAt` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |

## `api.usp_WMS_OUT05_DecideRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Quyết định trạng thái nghiệp vụ
- Tạo: `2026-08-13 01:17:09`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |
| 3 | `@ApprovalRunId` | `int` | Không | `—` |
| 4 | `@Decision` | `nvarchar(20)` | Không | `—` |
| 5 | `@Note` | `nvarchar(max)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |
| `[dbo].[tbl_his_status_pheduyet]` | USER TABLE |
| `[dbo].[tbl_pheduyet_process]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |

## `api.usp_WMS_OUT05_GetRequestQueue_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:17:09`
- Sửa gần nhất: `2026-08-13 01:21:01`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Status` | `nvarchar(20)` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_flow_pheduyet]` | USER TABLE |
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `api.usp_WMS_OUT06_GetPickingQueue_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:06`
- Sửa gần nhất: `2026-08-13 01:21:06`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Status` | `nvarchar(20)` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_OUT06_GetPickingRequest_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:06`
- Sửa gần nhất: `2026-08-13 01:21:06`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_map_xuatkho]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_OUT06_StartPicking_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:21:06`
- Sửa gần nhất: `2026-08-13 01:21:06`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |

## `api.usp_WMS_OUT07_GetPickableBatches_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:06`
- Sửa gần nhất: `2026-08-13 01:21:06`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |
| 3 | `@LineId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_location]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |

## `api.usp_WMS_OUT07_PickBatch_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:21:06`
- Sửa gần nhất: `2026-08-13 01:21:06`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |
| 3 | `@LineId` | `int` | Không | `—` |
| 4 | `@BatchId` | `int` | Không | `—` |
| 5 | `@Quantity` | `decimal(18,4)` | Không | `—` |
| 6 | `@ExpectedBatchQuantity` | `decimal(18,4)` | Không | `—` |
| 7 | `@ExpectedLocationCode` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_map_xuatkho]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_OUT08_CompleteGoodsIssue_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Xử lý giao dịch nghiệp vụ
- Tạo: `2026-08-13 01:21:06`
- Sửa gần nhất: `2026-08-13 01:21:06`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@RequestId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_map_xuatkho]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_OUT09_GetIssueDocuments_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:06`
- Sửa gần nhất: `2026-08-13 01:21:06`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Page` | `int` | Không | `—` |
| 4 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_OUT09_GetIssuePrintData_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:06`
- Sửa gần nhất: `2026-08-13 01:21:06`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@IssueDocumentId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_map_xuatkho]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_RET01_CreateInternalReturn_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-08-13 01:21:11`
- Sửa gần nhất: `2026-08-13 01:21:11`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@DestinationBravoCode` | `nvarchar(50)` | Không | `—` |
| 3 | `@QualityCode` | `nvarchar(20)` | Không | `—` |
| 4 | `@ReturnAt` | `datetime` | Không | `—` |
| 5 | `@Note` | `nvarchar(max)` | Không | `—` |
| 6 | `@Items` | `[api].[InternalReturnItem_v1]` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[InternalReturnItem_v1]` | UNRESOLVED OR EXTERNAL |
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `api.usp_WMS_RET01_GetInternalReturn_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:11`
- Sửa gần nhất: `2026-08-13 01:21:11`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReturnId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |

## `api.usp_WMS_RET01_GetReturnCatalog_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:11`
- Sửa gần nhất: `2026-08-13 01:21:11`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `api.usp_WMS_RET01_GetReturnQueue_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:11`
- Sửa gần nhất: `2026-08-13 01:21:11`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |
| 3 | `@Status` | `nvarchar(20)` | Không | `—` |
| 4 | `@Page` | `int` | Không | `—` |
| 5 | `@PageSize` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_chitiet_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |

## `api.usp_WMS_RET02_ConfirmInternalReturn_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Quyết định trạng thái nghiệp vụ
- Tạo: `2026-08-13 01:21:11`
- Sửa gần nhất: `2026-08-13 01:21:11`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@ReturnId` | `int` | Không | `—` |
| 3 | `@ResultCode` | `int` | Không | `—` |
| 4 | `@Note` | `nvarchar(max)` | Không | `—` |
| 5 | `@BravoDocumentNumber` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_RET03_GetReturnBatches_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:11`
- Sửa gần nhất: `2026-08-13 01:21:11`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@TransactionDocumentId` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_RET03_GetReturnDocuments_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Truy vấn dữ liệu
- Tạo: `2026-08-13 01:21:11`
- Sửa gần nhất: `2026-08-13 01:21:11`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@Search` | `nvarchar(200)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `api.usp_WMS_RET03_SplitReturnBatch_v1`

- Phân loại: API contract
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-08-13 01:21:11`
- Sửa gần nhất: `2026-08-13 01:21:11`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@UserId` | `nvarchar(50)` | Không | `—` |
| 2 | `@TransactionDocumentId` | `int` | Không | `—` |
| 3 | `@BatchId` | `int` | Không | `—` |
| 4 | `@SplitQuantity` | `decimal(19,4)` | Không | `—` |
| 5 | `@ExpectedQuantity` | `decimal(19,4)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[api].[vw_SEC_UserScreenAccess_v1]` | VIEW |
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_dm_user]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |
