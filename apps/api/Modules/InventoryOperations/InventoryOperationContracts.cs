namespace Mms.Api.Modules.InventoryOperations;

public sealed record DeclarationMaterial(string MaterialId, string? BravoId, string? MaterialName, string? Unit, decimal CurrentQuantity);
public sealed record LocationOption(string LocationCode, string? AreaCode, string? ShelfCode, int? ColumnNumber, int? FloorNumber, int? PositionNumber, string? Description);
public sealed record DeclarationCatalog(IReadOnlyList<DeclarationMaterial> Items, IReadOnlyList<LocationOption> Locations, long TotalCount, int Page, int PageSize);
public sealed record InventoryDeclarationInput(string MaterialId, decimal Quantity, string? Unit, string? LocationCode);
public sealed record DeclareInventoryRequest(string WarehouseCode, string Reason, IReadOnlyList<InventoryDeclarationInput> Items);
public sealed record DeclaredBatch(string MaterialId, int BatchId);
public sealed record DeclareInventoryResult(int TransactionDocumentId, int BatchCount, DateTime CreatedAt, IReadOnlyList<DeclaredBatch> Batches);

public sealed record SplittableBatch(int BatchId, int? ReceivingLineId, string? WarehouseCode, string? MaterialId,
    string? BravoId, string? MaterialName, decimal Quantity, string? Unit, string? LocationCode,
    string? InventoryStatusCode, decimal TransactionBalance, bool IsBalanced, DateTime? ChangedAt);
public sealed record SplittableBatchPage(IReadOnlyList<SplittableBatch> Items, long TotalCount, int Page, int PageSize);
public sealed record SplitBatchRequest(decimal SplitQuantity, decimal ExpectedQuantity);
public sealed record SplitBatchResult(int SourceBatchId, int NewBatchId, int TransactionDocumentId,
    decimal SourceQuantity, decimal NewQuantity, DateTime ChangedAt);

public sealed record CountBatchHeader(int BatchId, string? MaterialId, string? BravoId, string? MaterialName,
    decimal SystemQuantity, string? Unit, string? WarehouseCode, string? LocationCode,
    string? InventoryStatusCode, DateTime? ChangedAt);
public sealed record CountTransaction(int TransactionId, int? TransactionDocumentId, string? OperationCode,
    decimal Quantity, string? Unit, DateTime? CreatedAt);
public sealed record BatchCountData(CountBatchHeader? Batch, IReadOnlyList<CountTransaction> Transactions);
public sealed record CountBatchRequest(decimal ActualQuantity, decimal ExpectedQuantity, string Reason);
public sealed record CountBatchResult(int BatchId, int TransactionDocumentId, decimal PreviousQuantity,
    decimal ActualQuantity, decimal DifferenceQuantity, DateTime ChangedAt);

public sealed record LocationCountHeader(string LocationCode, string? AreaCode, string? ShelfCode,
    int? ColumnNumber, int? FloorNumber, int? PositionNumber, string? Description);
public sealed record LocationCountBatch(int BatchId, string? MaterialId, string? MaterialName,
    decimal SystemQuantity, string? Unit, string? LocationCode, DateTime? ChangedAt);
public sealed record LocationCountData(LocationCountHeader? Location, IReadOnlyList<LocationCountBatch> Batches);
public sealed record CountLocationBatchRequest(decimal ActualQuantity, decimal ExpectedQuantity, string Reason);
public sealed record CountLocationBatchResult(string LocationCode, int BatchId, int TransactionDocumentId,
    decimal PreviousQuantity, decimal ActualQuantity, decimal DifferenceQuantity, DateTime ChangedAt);

// =========================================================================
// UC-27 (INV-08): Cycle Count Theo Vật Tư (Bước 1)
// =========================================================================
public sealed record CreateCycleCountPlanRequest(string MaterialId, decimal BookQuantity, DateTime? StartedAt);
public sealed record CreateCycleCountPlanResult(bool Ok, string Message, int? PlanId, string? MaterialId, decimal? SystemQuantity, decimal? BookQuantity, int? BatchCount);

public sealed record CycleCountPlanSummary(
    int PlanId, string MaterialId, string? MaterialName, string? Unit,
    decimal SystemQuantity, decimal BookQuantity, decimal ActualQuantity, decimal DifferenceQuantity,
    DateTime? StartedAt, DateTime? FinishedAt, string? Note, string? StatusCode,
    string? CreatedBy, DateTime CreatedAt, string? ApprovedBy, int BatchCount, int CountLogCount);

public sealed record CycleCountBatchItem(
    int DetailId, int PlanId, int BatchId, string? BravoId, decimal SystemQuantity,
    string? Unit, string? LocationCode, DateTime? BatchCreatedAt, decimal ActualQuantity,
    int CountTimes, bool IsCounted);

public sealed record CycleCountLogItem(
    int LogId, int DetailId, int BatchId, decimal Quantity, string? Unit,
    string? LocationCode, string CreatedBy, DateTime CreatedAt);

public sealed record CycleCountPlanDetail(
    CycleCountPlanSummary? Plan,
    IReadOnlyList<CycleCountBatchItem> Batches,
    IReadOnlyList<CycleCountLogItem> Logs);

public sealed record LogCycleCountRequest(
    int DetailId, int BatchId, decimal ActualQuantity, string? Unit, string? LocationCode);

public sealed record LogCycleCountResult(
    bool Ok, string Message, int DetailId, int BatchId, decimal ActualQuantity, int? NewBatchId);

public sealed record FinishCycleCountResult(bool Ok, string Message);

public sealed record CycleCountMaterialOption(
    string MaterialId, string? BravoId, string? MaterialName, string? Unit, string? GroupName, decimal SystemQuantity);

// =========================================================================
// UC-10: Tách Batch & Gia Phả (Genealogy)
// =========================================================================
public sealed record SplitBatchV2Request(decimal SplitQuantity, string? TargetLocation);
public sealed record SplitBatchV2Result(bool IsSuccess, string Message, int? NewBatchId);

public sealed record BatchGenealogyNode(
    int BatchId, int? ParentBatchId, string? MaterialId, decimal Quantity,
    DateTime CreatedAt, string? LocationCode, int Level);

// =========================================================================
// PRINT LABEL WEBHOOK TO 10.17.16.102:8080
// =========================================================================
public sealed record PrintLabelWebhookRequest(string Batch, string? Msnv, string? Kho);
public sealed record PrintLabelResult(bool Ok, string Message, int? Status, object? Payload, string? Response);

// =========================================================================
// SỔ NHẬT KÝ GIAO DỊCH KHO (TRANSACTION LEDGER)
// =========================================================================
public sealed record WarehouseTransactionItem(
    int TransactionId,
    string TransactionCode,
    int? BatchId,
    string? BatchNumber,
    string? OperationCode,
    string? OperationName,
    string? OperationGroup,
    int Logic,
    string? MaterialId,
    string? BravoId,
    string? MaterialName,
    decimal Quantity,
    string? Unit,
    string? LocationCode,
    string? ReferenceDoc,
    string? Performer,
    string? Note,
    DateTime CreatedAt
);

// =========================================================================
// LỊCH SỬ BATCH TOÀN DIỆN (KIỂM NHẬP + GIA PHẢ + DÒNG THỜI GIAN) - UC-17 / INV-02
// =========================================================================
public sealed record BatchDetailInfo(
    int BatchId,
    int? ParentBatchId,
    string? MaterialId,
    string? BravoId,
    string? MaterialName,
    decimal Quantity,
    string? Unit,
    string? WarehouseCode,
    string? LocationCode,
    string? InventoryStatus,
    DateTime CreatedAt,
    string? CreatedBy,
    DateTime? UpdatedAt,
    string? UpdatedBy
);

public sealed record BatchInboundQCInfo(
    string? ReceivingDocCode,
    string? PoNumber,
    string? SupplierName,
    DateTime? ReceivedDate,
    string? Receiver,
    decimal? ReceivedQuantity,
    string? QcStatus,
    string? QcInspector,
    DateTime? QcDate,
    string? QcNotes
);

public sealed record BatchTimelineEvent(
    string EventId,
    string EventType,
    string? EventCode,
    string? EventName,
    int Logic,
    decimal? Quantity,
    string? Unit,
    string? LocationCode,
    string? ActorId,
    DateTime OccurredAt,
    string? ReferenceDoc,
    string? Note
);

public sealed record BatchFullHistoryResponse(
    bool Found,
    BatchDetailInfo? Batch,
    BatchInboundQCInfo? InboundQC,
    IReadOnlyList<BatchGenealogyNode> Genealogy,
    IReadOnlyList<BatchTimelineEvent> Timeline
);

public sealed record RealBatchItem(
    int BatchId,
    int? ParentBatchId,
    string? MaterialId,
    string? BravoId,
    string? MaterialName,
    decimal Quantity,
    string? Unit,
    string? WarehouseCode,
    string? LocationCode,
    string? InventoryStatus,
    DateTime CreatedAt,
    DateTime? ExpiryDate
);

