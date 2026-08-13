namespace Mms.Api.Modules.InternalReturns;

public sealed record ReturnMaterial(string MaterialId, string? BravoId, string? MaterialName, string? Unit);
public sealed record ReturnDestination(string DestinationBravoCode, string? DestinationName);
public sealed record ReturnCatalog(IReadOnlyList<ReturnMaterial> Materials, IReadOnlyList<ReturnDestination> Destinations);
public sealed record InternalReturnItemInput(string MaterialId, string? BravoId, string? MaterialName,
    decimal Quantity, string? Unit, string Note);
public sealed record CreateInternalReturn(string DestinationBravoCode, string QualityCode,
    DateTime ReturnAt, string? Note, IReadOnlyList<InternalReturnItemInput> Items);
public sealed record CreatedInternalReturn(int ReturnId, string StatusCode, DateTime CreatedAt);
public sealed record InternalReturnQueueItem(int ReturnId, string? WarehouseCode, string? DestinationBravoCode,
    string? DestinationName, string? QualityCode, string? WarehouseResultCode, string? Note,
    string? CreatedBy, DateTime? ReturnAt, DateTime? CreatedAt, string? StatusCode,
    string? DepartmentCode, int LineCount, decimal TotalQuantity);
public sealed record InternalReturnQueue(IReadOnlyList<InternalReturnQueueItem> Items, long TotalCount, int Page, int PageSize);
public sealed record InternalReturnHeader(int ReturnId, string? WarehouseCode, string? DestinationBravoCode,
    string? DestinationName, string? QualityCode, string? WarehouseResultCode, string? Note,
    string? CreatedBy, DateTime? ReturnAt, DateTime? CreatedAt, string? StatusCode,
    string? DepartmentCode, bool CanConfirm);
public sealed record InternalReturnLine(int LineId, string? MaterialId, string? BravoId,
    string? MaterialName, string? Unit, decimal Quantity, string? Note);
public sealed record InternalReturnDetail(InternalReturnHeader Header, IReadOnlyList<InternalReturnLine> Lines);
public sealed record ConfirmInternalReturn(int ResultCode, string? Note, string? BravoDocumentNumber);
public sealed record ConfirmedInternalReturn(int ReturnId, int ResultCode, string StatusCode,
    string? WarehouseResultCode, int? TransactionDocumentId, int CreatedBatchCount, DateTime ChangedAt);
public sealed record ReturnDocument(int TransactionDocumentId, int? ReturnId, string? DestinationCode,
    string? DestinationName, DateTime? CreatedAt, string? StatusCode, int BatchCount, decimal TotalQuantity);
public sealed record ReturnBatch(int TransactionId, int BatchId, string? MaterialId, string? BravoId,
    string? MaterialName, decimal Quantity, string? Unit, string? InventoryStatusCode,
    string? LocationCode, DateTime? CreatedAt, DateTime? ChangedAt);
public sealed record SplitReturnBatch(decimal SplitQuantity, decimal ExpectedQuantity);
public sealed record SplitReturnBatchResult(int TransactionDocumentId, int SourceBatchId, int NewBatchId,
    decimal SourceQuantity, decimal NewQuantity, DateTime ChangedAt);
