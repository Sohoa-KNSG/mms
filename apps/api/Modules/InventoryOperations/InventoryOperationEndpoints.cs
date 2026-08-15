using System.Security.Claims;

namespace Mms.Api.Modules.InventoryOperations;

public static class InventoryOperationEndpoints
{
    public static IEndpointRouteBuilder MapInventoryOperationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/inventory-operations").RequireAuthorization().WithTags("Inventory Operations");
        group.MapGet("/declaration-catalog", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, string? search, int? page, int? pageSize, CancellationToken token) =>
        { var paging = Paging(page, pageSize); return Results.Ok(await gateway.GetDeclarationCatalogAsync(User(principal), search, paging.Page, paging.PageSize, token)); }).WithName("INV-04_GetDeclarationCatalog");
        group.MapPost("/declarations", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, DeclareInventoryRequest request, CancellationToken token) =>
        {
            if (string.IsNullOrWhiteSpace(request.WarehouseCode) || string.IsNullOrWhiteSpace(request.Reason)
                || request.Items.Count is < 1 or > 200 || request.Items.Any(item => string.IsNullOrWhiteSpace(item.MaterialId) || item.Quantity <= 0)
                || request.Items.Select(item => item.MaterialId).Distinct().Count() != request.Items.Count)
                return Invalid("declaration", "Kho, căn cứ và 1-200 vật tư không trùng với số lượng hợp lệ là bắt buộc.");
            return Results.Ok(await gateway.DeclareInventoryAsync(User(principal), request, token));
        }).WithName("INV-04_DeclareInventory");
        group.MapGet("/splittable-batches", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, string? search, int? batchId, int? page, int? pageSize, CancellationToken token) =>
        { var paging = Paging(page, pageSize); return Results.Ok(await gateway.GetSplittableBatchesAsync(User(principal), search, Positive(batchId), paging.Page, paging.PageSize, token)); }).WithName("INV-05_GetSplittableBatches");
        group.MapPost("/batches/{batchId:int}/split", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, int batchId, SplitBatchRequest request, CancellationToken token) =>
        {
            if (batchId <= 0 || request.SplitQuantity <= 0 || request.ExpectedQuantity <= request.SplitQuantity) return Invalid("split", "Batch và số lượng tách hợp lệ là bắt buộc.");
            return Results.Ok(await gateway.SplitBatchAsync(User(principal), batchId, request, token));
        }).WithName("INV-05_SplitBatch");
        group.MapGet("/batch-count/{batchId:int}", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, int batchId, CancellationToken token) =>
        {
            if (batchId <= 0) return Invalid("batchId", "Mã batch phải lớn hơn 0."); var result = await gateway.GetBatchCountAsync(User(principal), batchId, token);
            return result.Batch is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("INV-06_GetBatchCount");
        group.MapPost("/batch-count/{batchId:int}", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, int batchId, CountBatchRequest request, CancellationToken token) =>
        {
            if (batchId <= 0 || request.ActualQuantity < 0 || string.IsNullOrWhiteSpace(request.Reason)) return Invalid("count", "Batch, số lượng thực tế và căn cứ là bắt buộc.");
            return Results.Ok(await gateway.CountBatchAsync(User(principal), batchId, request, token));
        }).WithName("INV-06_CountBatch");
        group.MapGet("/location-count/{locationCode}", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, string locationCode, CancellationToken token) =>
        { var result = await gateway.GetLocationCountAsync(User(principal), locationCode, token); return result.Location is null ? Results.NotFound() : Results.Ok(result); }).WithName("INV-07_GetLocationCount");
        group.MapPost("/location-count/{locationCode}/batches/{batchId:int}", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, string locationCode, int batchId, CountLocationBatchRequest request, CancellationToken token) =>
        {
            if (string.IsNullOrWhiteSpace(locationCode) || batchId <= 0 || request.ActualQuantity < 0 || string.IsNullOrWhiteSpace(request.Reason)) return Invalid("count", "Vị trí, batch, số lượng và căn cứ là bắt buộc.");
            return Results.Ok(await gateway.CountLocationBatchAsync(User(principal), locationCode, batchId, request, token));
        }).WithName("INV-07_CountLocationBatch");
        return endpoints;
    }
    private static string User(ClaimsPrincipal principal) => principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.Identity?.Name ?? throw new UnauthorizedAccessException("Không có user identity.");
    private static int? Positive(int? value) => value is > 0 ? value : null;
    private static (int Page, int PageSize) Paging(int? page, int? size) => (Math.Max(page ?? 1, 1), Math.Clamp(size ?? 50, 1, 200));
    private static IResult Invalid(string key, string value) => Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [value] });
}

