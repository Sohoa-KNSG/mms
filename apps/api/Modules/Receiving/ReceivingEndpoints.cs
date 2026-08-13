using System.Security.Claims;

namespace Mms.Api.Modules.Receiving;

public static class ReceivingEndpoints
{
    public static IEndpointRouteBuilder MapReceivingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/receiving")
            .RequireAuthorization()
            .WithTags("Receiving");

        group.MapGet("/purchase-orders", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, string? search,
            int? page, int? pageSize, CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetPurchaseOrdersAsync(GetUserId(principal), search,
                paging.Page, paging.PageSize, cancellationToken));
        }).WithName("INB-01_GetPurchaseOrders");

        group.MapPost("/receipts/with-po", async (
            ClaimsPrincipal principal, ReceivingGateway gateway,
            CreateReceiptWithPoRequest request, CancellationToken cancellationToken) =>
        {
            var validation = ValidateLines(request.Lines, request.Images);
            if (string.IsNullOrWhiteSpace(request.PurchaseOrder) || string.IsNullOrWhiteSpace(request.WarehouseCode))
            {
                validation["header"] = ["PO và kho là bắt buộc."];
            }
            if (validation.Count > 0) return Results.ValidationProblem(validation);
            var result = await gateway.CreateReceiptWithPoAsync(GetUserId(principal), request, cancellationToken);
            return Results.Created($"/api/v1/receiving/receipts/{result.ReceiptId}", result);
        }).WithName("INB-01_CreateReceiptWithPo");

        group.MapGet("/materials", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, string? search,
            int? page, int? pageSize, CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetMaterialsAsync(GetUserId(principal), search,
                paging.Page, paging.PageSize, cancellationToken));
        }).WithName("INB-02_GetMaterials");

        group.MapPost("/receipts/without-po", async (
            ClaimsPrincipal principal, ReceivingGateway gateway,
            CreateReceiptWithoutPoRequest request, CancellationToken cancellationToken) =>
        {
            var validation = ValidateLines(request.Lines, request.Images);
            if (string.IsNullOrWhiteSpace(request.SupplierName) || string.IsNullOrWhiteSpace(request.WarehouseCode))
            {
                validation["header"] = ["Nhà cung cấp và kho là bắt buộc."];
            }
            if (validation.Count > 0) return Results.ValidationProblem(validation);
            var result = await gateway.CreateReceiptWithoutPoAsync(GetUserId(principal), request, cancellationToken);
            return Results.Created($"/api/v1/receiving/receipts/{result.ReceiptId}", result);
        }).WithName("INB-02_CreateReceiptWithoutPo");

        group.MapGet("/receipts/{receiptId:int}", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, int receiptId,
            CancellationToken cancellationToken) =>
        {
            if (receiptId <= 0) return InvalidId("receiptId", "Mã phiếu nhận phải lớn hơn 0.");
            var result = await gateway.GetReceiptAsync(GetUserId(principal), receiptId, cancellationToken);
            return result.Header is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("INB-03_GetReceipt");

        group.MapPut("/receipts/{receiptId:int}", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, int receiptId,
            SaveReceiptRequest request, CancellationToken cancellationToken) =>
        {
            if (receiptId <= 0) return InvalidId("receiptId", "Mã phiếu nhận phải lớn hơn 0.");
            var action = request.Action.Trim().ToUpperInvariant();
            var validation = action == "CANCEL"
                ? new Dictionary<string, string[]>()
                : ValidateLines(request.Lines, request.Images);
            if (string.IsNullOrWhiteSpace(request.ExpectedStatus)
                || action is not ("SAVE" or "CONFIRM" or "CANCEL"))
            {
                validation["command"] = ["Trạng thái kỳ vọng và thao tác SAVE/CONFIRM/CANCEL là bắt buộc."];
            }
            if (validation.Count > 0) return Results.ValidationProblem(validation);
            return Results.Ok(await gateway.SaveReceiptAsync(GetUserId(principal), receiptId, request, cancellationToken));
        }).WithName("INB-03_SaveReceipt");

        group.MapGet("/po-attachments/receipts", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, string? search,
            int? page, int? pageSize, CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetUnmatchedReceiptsAsync(GetUserId(principal), search,
                paging.Page, paging.PageSize, cancellationToken));
        }).WithName("INB-05_GetUnmatchedReceipts");

        group.MapPut("/receipts/{receiptId:int}/purchase-order", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, int receiptId,
            AttachPurchaseOrderRequest request, CancellationToken cancellationToken) =>
        {
            var validation = ValidateAssignments(receiptId, request.ExpectedStatus, request.Assignments);
            if (string.IsNullOrWhiteSpace(request.PurchaseOrder)) validation["purchaseOrder"] = ["PO là bắt buộc."];
            if (validation.Count > 0) return Results.ValidationProblem(validation);
            return Results.Ok(await gateway.AttachPurchaseOrderAsync(GetUserId(principal), receiptId, request, cancellationToken));
        }).WithName("INB-05_AttachPurchaseOrder");

        group.MapGet("/receipts/{receiptId:int}/purchase-order-matches", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, int receiptId,
            string? search, CancellationToken cancellationToken) =>
        {
            if (receiptId <= 0) return InvalidId("receiptId", "Mã phiếu nhận phải lớn hơn 0.");
            return Results.Ok(await gateway.GetPurchaseOrderMatchesAsync(GetUserId(principal), receiptId, search, cancellationToken));
        }).WithName("INB-06_GetPurchaseOrderMatches");

        group.MapPut("/receipts/{receiptId:int}/purchase-orders", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, int receiptId,
            AttachMultiplePurchaseOrdersRequest request, CancellationToken cancellationToken) =>
        {
            var validation = ValidateAssignments(receiptId, request.ExpectedStatus, request.Assignments);
            if (validation.Count > 0) return Results.ValidationProblem(validation);
            return Results.Ok(await gateway.AttachMultiplePurchaseOrdersAsync(GetUserId(principal), receiptId, request, cancellationToken));
        }).WithName("INB-06_AttachMultiplePurchaseOrders");

        group.MapGet("/warehouse-queue", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, string? search,
            int? receiptId, int? page, int? pageSize, CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetWarehouseQueueAsync(GetUserId(principal), search,
                PositiveOrNull(receiptId), paging.Page, paging.PageSize, cancellationToken));
        }).WithName("INB-07_GetWarehouseReceiptQueue");

        group.MapPost("/receipts/{receiptId:int}/warehouse", async (
            ClaimsPrincipal principal, ReceivingGateway gateway, int receiptId,
            ProcessWarehouseReceiptRequest request, CancellationToken cancellationToken) =>
        {
            var validation = new Dictionary<string, string[]>();
            if (receiptId <= 0) validation["receiptId"] = ["Mã phiếu nhận phải lớn hơn 0."];
            if (string.IsNullOrWhiteSpace(request.ExpectedStatus)) validation["expectedStatus"] = ["Trạng thái kỳ vọng là bắt buộc."];
            if (request.Items.Count is < 1 or > 200 || request.Items.Any(item => item.ReceivingLineId <= 0 || item.Quantity <= 0)
                || request.Items.Select(item => item.ReceivingLineId).Distinct().Count() != request.Items.Count)
            {
                validation["items"] = ["Cần 1-200 dòng nhập kho hợp lệ và không trùng."];
            }
            if (validation.Count > 0) return Results.ValidationProblem(validation);
            return Results.Ok(await gateway.ProcessWarehouseReceiptAsync(GetUserId(principal), receiptId, request, cancellationToken));
        }).WithName("INB-07_ProcessWarehouseReceipt");

        group.MapGet("/batch-labels", async (
            ClaimsPrincipal principal, ReceivingGateway gateway,
            int? receiptId, int? transactionDocumentId, int? batchId,
            CancellationToken cancellationToken) =>
        {
            receiptId = PositiveOrNull(receiptId);
            transactionDocumentId = PositiveOrNull(transactionDocumentId);
            batchId = PositiveOrNull(batchId);
            if (receiptId is null && transactionDocumentId is null && batchId is null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["filter"] = ["Cần mã phiếu nhận, phiếu giao dịch hoặc batch."],
                });
            }
            return Results.Ok(await gateway.GetBatchLabelsAsync(GetUserId(principal), receiptId,
                transactionDocumentId, batchId, cancellationToken));
        }).WithName("INB-08_GetBatchLabels");

        return endpoints;
    }

    private static Dictionary<string, string[]> ValidateLines(
        IReadOnlyList<ReceivingLineInput> lines, IReadOnlyList<ReceiptImageInput> images)
    {
        var errors = new Dictionary<string, string[]>();
        if (lines.Count is < 1 or > 200 || lines.Any(line => string.IsNullOrWhiteSpace(line.MaterialId)
            || line.DocumentQuantity <= 0 || line.ReceivedQuantity <= 0))
        {
            errors["lines"] = ["Cần 1-200 dòng vật tư với số lượng hợp lệ."];
        }
        if (images.Count > 20 || images.Any(image => string.IsNullOrWhiteSpace(image.Category)
            || string.IsNullOrWhiteSpace(image.ImageLink)))
        {
            errors["images"] = ["Tối đa 20 liên kết ảnh hợp lệ."];
        }
        return errors;
    }

    private static Dictionary<string, string[]> ValidateAssignments(
        int receiptId, string expectedStatus, IReadOnlyList<PoAssignmentInput> assignments)
    {
        var errors = new Dictionary<string, string[]>();
        if (receiptId <= 0) errors["receiptId"] = ["Mã phiếu nhận phải lớn hơn 0."];
        if (string.IsNullOrWhiteSpace(expectedStatus)) errors["expectedStatus"] = ["Trạng thái kỳ vọng là bắt buộc."];
        if (assignments.Count is < 1 or > 200
            || assignments.Any(item => item.ReceivingLineId <= 0 || string.IsNullOrWhiteSpace(item.PurchaseOrderKey)
                || item.ReceivedQuantity <= 0)
            || assignments.Select(item => item.ReceivingLineId).Distinct().Count() != assignments.Count)
        {
            errors["assignments"] = ["Cần 1-200 ánh xạ dòng/PO hợp lệ và không trùng."];
        }
        return errors;
    }

    private static IResult InvalidId(string key, string message) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [message] });

    private static string GetUserId(ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? principal.Identity?.Name
        ?? throw new UnauthorizedAccessException("Không có user identity.");

    private static int? PositiveOrNull(int? value) => value is > 0 ? value : null;
    private static (int Page, int PageSize) NormalizePaging(int? page, int? pageSize) =>
        (Math.Max(page ?? 1, 1), Math.Clamp(pageSize ?? 50, 1, 200));
}

