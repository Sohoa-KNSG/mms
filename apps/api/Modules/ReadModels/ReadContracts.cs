using Mms.Api.Contracts;

namespace Mms.Api.Modules.ReadModels;

public sealed record ReceiptLogItem(
    int HistoryId,
    string ReceiptId,
    string? WarehouseCode,
    string? CustomerName,
    string? PurchaseOrder,
    string? StatusCode,
    string? StatusLabel,
    string? ActionType,
    string? ActorName,
    DateTime? AuditTime);

public sealed record InventoryBalanceItem(
    string MaterialId,
    string? BravoId,
    string? MaterialName,
    string Unit,
    string? WarehouseCode,
    decimal BatchBalance,
    decimal LedgerBalance,
    decimal Variance);

public sealed record BatchSnapshot(
    int BatchId,
    string MaterialId,
    string? MaterialName,
    decimal Quantity,
    string Unit,
    string? WarehouseCode,
    string? LocationCode,
    string InventoryStatus);

public sealed record BatchHistoryEvent(
    string EventId,
    string EventType,
    string? EventName,
    decimal? Quantity,
    string? ActorId,
    DateTime? OccurredAt,
    string? Reference);

public sealed record BatchHistory(BatchSnapshot Batch, IReadOnlyList<BatchHistoryEvent> Events);

public sealed record MaterialSnapshot(
    string MaterialId,
    string? BravoId,
    string? MaterialName,
    string? Unit,
    decimal CurrentBalance);

public sealed record MaterialHistoryItem(
    int TransactionId,
    int? BatchId,
    int? DocumentId,
    string? OperationCode,
    string? OperationName,
    decimal Quantity,
    decimal SignedQuantity,
    DateTime? OccurredAt,
    string? StatusCode);

public sealed record MaterialHistory(
    MaterialSnapshot Material,
    IReadOnlyList<MaterialHistoryItem> Items,
    long TotalCount);

public sealed record LocationItem(
    string LocationCode,
    string? AreaCode,
    string? RackCode,
    int? ColumnNumber,
    int? LevelNumber,
    int? PositionNumber,
    string? Description,
    int BatchCount,
    decimal TotalQuantity);

public sealed record StatusCount(string Scope, string StatusCode, string? StatusLabel, int Count);

public sealed record OperationsSummary(
    DateTime GeneratedAt,
    int InventoryMaterialCount,
    int ActiveBatchCount,
    int UnlocatedBatchCount,
    int ReceiptCountToday,
    int TransactionCountToday,
    IReadOnlyList<StatusCount> StatusCounts,
    int BalanceVarianceCount,
    decimal TotalAbsoluteVariance);

public static class ReadContractAliases
{
    public static PagedResult<T> Page<T>(IReadOnlyList<T> items, long totalCount, int page, int pageSize) =>
        new(items, totalCount, page, pageSize);
}

