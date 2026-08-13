namespace Mms.Api.Modules.OutboundPicking;

public sealed record PickingQueueItem(int RequestId, string? DepartmentCode, string? RequesterName,
    DateTime? NeededAt, DateTime? ApprovedAt, string? DestinationBravoCode, string? DestinationName,
    string? PickingStatusCode, string PickingStatus, int? IssueDocumentId,
    string? IssueDocumentStatusCode, int LineCount, decimal RequestedQuantity,
    decimal IssuedQuantity, DateTime? ChangedAt);
public sealed record PickingQueue(IReadOnlyList<PickingQueueItem> Items, long TotalCount, int Page, int PageSize);

public sealed record PickingHeader(int RequestId, string? DepartmentCode, string? RequesterName,
    DateTime? NeededAt, DateTime? ApprovedAt, string? DestinationBravoCode, string? DestinationName,
    string? RequestStatusCode, string? PickingStatusCode, int? IssueDocumentId,
    string? IssueDocumentStatusCode, bool CanStart, bool CanPick, bool CanComplete, DateTime? ChangedAt);
public sealed record PickingLine(int LineId, string? MaterialId, string? BravoId, string? MaterialName,
    decimal RequestedQuantity, decimal IssuedQuantity, decimal RemainingQuantity,
    decimal AvailableQuantity, string? Unit, string? DestinationBravoCode, string? Note);
public sealed record PickTransaction(int TransactionId, int? BatchId, int LineId, string? MaterialId,
    decimal Quantity, string? Unit, string? LocationCode, DateTime? CreatedAt);
public sealed record PickingRequestDetail(PickingHeader Header, IReadOnlyList<PickingLine> Lines,
    IReadOnlyList<PickTransaction> Transactions);

public sealed record StartedPicking(int RequestId, int IssueDocumentId, string PickingStatusCode, DateTime StartedAt);
public sealed record PickableBatch(int BatchId, string MaterialId, string? BravoId, string? MaterialName,
    decimal AvailableQuantity, string? Unit, string? LocationCode, string? LocationName,
    DateTime? ReceivedAt, DateTime? ChangedAt);
public sealed record PickBatchRequest(int BatchId, decimal Quantity, decimal ExpectedBatchQuantity,
    string? ExpectedLocationCode);
public sealed record PickedBatch(int RequestId, int LineId, int BatchId, int TransactionId,
    int IssueDocumentId, decimal IssuedQuantity, decimal RemainingLineQuantity,
    decimal RemainingBatchQuantity, DateTime ChangedAt);
public sealed record CompletedGoodsIssue(int RequestId, int IssueDocumentId, string PickingStatusCode,
    string IssueDocumentStatusCode, DateTime CompletedAt);

public sealed record IssueDocumentItem(int IssueDocumentId, int RequestId, string? RequesterName,
    string? DepartmentCode, string? DestinationBravoCode, string? DestinationName, DateTime? NeededAt,
    DateTime? CreatedAt, string? IssueDocumentStatusCode, decimal TotalQuantity, int BatchCount);
public sealed record IssueDocumentQueue(IReadOnlyList<IssueDocumentItem> Items, long TotalCount, int Page, int PageSize);
public sealed record IssuePrintHeader(int IssueDocumentId, int RequestId, string? OperationCode,
    string? WarehouseFrom, string? WarehouseTo, string? ReceiverName, string? CreatedBy,
    string? BravoDocumentNumber, DateTime? CreatedAt, string? IssueDocumentStatusCode,
    string? RequesterName, string? DepartmentCode, string? DestinationBravoCode,
    string? DestinationName, DateTime? NeededAt);
public sealed record IssuePrintLine(int LineId, string? MaterialId, string? BravoId,
    string? MaterialName, decimal RequestedQuantity, decimal IssuedQuantity, string? Unit, string? Note);
public sealed record IssuePrintTransaction(int TransactionId, int? BatchId, int LineId,
    string? MaterialId, string? MaterialName, decimal Quantity, string? Unit,
    string? LocationCode, DateTime? CreatedAt);
public sealed record IssuePrintData(IssuePrintHeader Header, IReadOnlyList<IssuePrintLine> Lines,
    IReadOnlyList<IssuePrintTransaction> Transactions);
