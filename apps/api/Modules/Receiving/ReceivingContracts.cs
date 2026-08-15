namespace Mms.Api.Modules.Receiving;

public sealed record PurchaseOrderSummary(
    string PurchaseOrder,
    string? CustomerCode,
    DateTime? OrderDate,
    DateTime? DeliveryDate,
    decimal RemainingQuantity);

public sealed record PurchaseOrderLine(
    string PurchaseOrder,
    string PurchaseOrderKey,
    string? MaterialId,
    string? BravoId,
    string? MaterialName,
    decimal OrderedQuantity,
    decimal ReceivedQuantity,
    decimal RemainingQuantity,
    string? Unit,
    DateTime? DeliveryDate);

public sealed record PurchaseOrderPage(
    IReadOnlyList<PurchaseOrderSummary> Items,
    IReadOnlyList<PurchaseOrderLine> Lines,
    long TotalCount,
    int Page,
    int PageSize);

public sealed record ReceivingLineInput(
    int? ReceivingLineId,
    string? PurchaseOrderKey,
    string MaterialId,
    decimal DocumentQuantity,
    decimal ReceivedQuantity,
    string? Unit,
    DateTime? DeliveryDate);

public sealed record ReceiptImageInput(string Category, string ImageLink);

public sealed record CreateReceiptWithPoRequest(
    string PurchaseOrder,
    string WarehouseCode,
    IReadOnlyList<ReceivingLineInput> Lines,
    IReadOnlyList<ReceiptImageInput> Images);

public sealed record MaterialOption(
    string MaterialId,
    string? BravoId,
    string? MaterialName,
    string? Unit,
    string? SupplierCode,
    string? MaterialGroupCode);

public sealed record MaterialOptionPage(
    IReadOnlyList<MaterialOption> Items,
    long TotalCount,
    int Page,
    int PageSize);

public sealed record CreateReceiptWithoutPoRequest(
    string SupplierName,
    string WarehouseCode,
    IReadOnlyList<ReceivingLineInput> Lines,
    IReadOnlyList<ReceiptImageInput> Images);

public sealed record ReceiptCommandResult(
    int ReceiptId,
    string StatusCode,
    int LineCount,
    DateTime ChangedAt);

public sealed record ReceiptHeader(
    int ReceiptId,
    string? WarehouseCode,
    string? CustomerName,
    string? PurchaseOrder,
    string? StatusCode,
    string? CreatedBy,
    DateTime? CreatedAt,
    bool CanEdit,
    DateTime? ChangedAt);

public sealed record ReceiptLine(
    int ReceivingLineId,
    int ReceiptId,
    string? PurchaseOrderKey,
    string? MaterialId,
    string? MaterialName,
    decimal DocumentQuantity,
    decimal ReceivedQuantity,
    string? Unit,
    DateTime? DeliveryDate,
    string? LineStatusCode,
    string? QcResultCode);

public sealed record ReceiptImage(int ImageId, string? Category, string? ImageLink, DateTime? CreatedAt);
public sealed record ReceiptDetail(ReceiptHeader? Header, IReadOnlyList<ReceiptLine> Lines, IReadOnlyList<ReceiptImage> Images);

public sealed record SaveReceiptRequest(
    string WarehouseCode,
    string CustomerName,
    string PurchaseOrder,
    string Action,
    string ExpectedStatus,
    IReadOnlyList<ReceivingLineInput> Lines,
    IReadOnlyList<ReceiptImageInput> Images);

public sealed record UnmatchedReceipt(
    int ReceiptId,
    string? WarehouseCode,
    string? CustomerName,
    string? StatusCode,
    string? CreatedBy,
    DateTime? CreatedAt,
    int LineCount);

public sealed record UnmatchedReceiptLine(
    int ReceivingLineId,
    int ReceiptId,
    string? MaterialId,
    string? MaterialName,
    decimal ReceivedQuantity,
    string? Unit);

public sealed record UnmatchedReceiptPage(
    IReadOnlyList<UnmatchedReceipt> Items,
    IReadOnlyList<UnmatchedReceiptLine> Lines,
    long TotalCount,
    int Page,
    int PageSize);

public sealed record PoAssignmentInput(int ReceivingLineId, string PurchaseOrderKey, decimal ReceivedQuantity);
public sealed record AttachPurchaseOrderRequest(string PurchaseOrder, string ExpectedStatus, IReadOnlyList<PoAssignmentInput> Assignments);
public sealed record AttachMultiplePurchaseOrdersRequest(string ExpectedStatus, IReadOnlyList<PoAssignmentInput> Assignments);
public sealed record AttachPurchaseOrderResult(int ReceiptId, string PurchaseOrder, int AssignmentCount, DateTime ChangedAt);

public sealed record ReceiptLineToMatch(
    int ReceivingLineId,
    string? MaterialId,
    string? MaterialName,
    decimal ReceivedQuantity,
    string? Unit);

public sealed record PurchaseOrderMatch(
    int ReceivingLineId,
    string PurchaseOrder,
    string PurchaseOrderKey,
    string? CustomerCode,
    string? MaterialId,
    string? MaterialName,
    string? Unit,
    decimal RemainingQuantity,
    DateTime? DeliveryDate);

public sealed record PurchaseOrderMatches(IReadOnlyList<ReceiptLineToMatch> Lines, IReadOnlyList<PurchaseOrderMatch> Matches);

public sealed record WarehouseQueueReceipt(
    int ReceiptId,
    string? WarehouseCode,
    string? CustomerName,
    string? PurchaseOrder,
    string? StatusCode,
    DateTime? ReceivedAt,
    int PendingLineCount);

public sealed record WarehouseQueueLine(
    int ReceivingLineId,
    int ReceiptId,
    string? MaterialId,
    string? BravoId,
    string? MaterialName,
    decimal ReceivedQuantity,
    decimal BatchedQuantity,
    decimal RemainingQuantity,
    string? Unit,
    string? LineStatusCode,
    string? QcResultCode);

public sealed record WarehouseQueuePage(
    IReadOnlyList<WarehouseQueueReceipt> Items,
    IReadOnlyList<WarehouseQueueLine> Lines,
    long TotalCount,
    int Page,
    int PageSize);

public sealed record WarehouseReceiptInput(int ReceivingLineId, decimal Quantity);
public sealed record ProcessWarehouseReceiptRequest(string ExpectedStatus, IReadOnlyList<WarehouseReceiptInput> Items);
public sealed record CreatedBatch(int ReceivingLineId, int BatchId);
public sealed record ProcessWarehouseReceiptResult(
    int ReceiptId,
    int TransactionDocumentId,
    string StatusCode,
    int BatchCount,
    DateTime ProcessedAt,
    IReadOnlyList<CreatedBatch> Batches);

public sealed record BatchLabelHeader(
    int ReceiptId,
    string? PurchaseOrder,
    string? CustomerName,
    string? WarehouseCode,
    string? ReceiptStatusCode,
    int TransactionDocumentId,
    string? TransactionStatusCode,
    DateTime PrintedAt);

public sealed record BatchLabel(
    int BatchId,
    string BarcodeValue,
    int ReceiptId,
    int TransactionDocumentId,
    string? MaterialId,
    string? BravoId,
    string? MaterialName,
    decimal Quantity,
    string? Unit,
    string? WarehouseCode,
    string? LocationCode,
    string? InventoryStatusCode,
    string? CreatedBy,
    DateTime? CreatedAt);

public sealed record BatchLabelData(IReadOnlyList<BatchLabelHeader> Headers, IReadOnlyList<BatchLabel> Labels);

