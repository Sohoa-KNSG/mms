using System.Security.Claims;

namespace Mms.Api.Modules.ReadModels;

public static class ReadEndpoints
{
    public static IEndpointRouteBuilder MapReadEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1")
            .RequireAuthorization()
            .WithTags("Read models");

        group.MapGet("/receipts/log", async (
            ClaimsPrincipal principal,
            ReadGateway gateway,
            string? search,
            int? page,
            int? pageSize,
            CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetReceiptLogAsync(
                GetUserId(principal), search, paging.Page, paging.PageSize, cancellationToken));
        }).WithName("INB-04_GetReceiptLog");

        group.MapGet("/inventory/balances", async (
            ClaimsPrincipal principal,
            ReadGateway gateway,
            string? search,
            int? page,
            int? pageSize,
            CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetInventoryBalancesAsync(
                GetUserId(principal), search, paging.Page, paging.PageSize, cancellationToken));
        }).WithName("INV-01_GetInventoryBalances");

        group.MapGet("/batches/{batchId:int}/history", async (
            ClaimsPrincipal principal,
            ReadGateway gateway,
            int batchId,
            CancellationToken cancellationToken) =>
        {
            if (batchId <= 0)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["batchId"] = ["Mã batch phải lớn hơn 0."],
                });
            }

            var result = await gateway.GetBatchHistoryAsync(GetUserId(principal), batchId, cancellationToken);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("INV-02_GetBatchHistory");

        group.MapGet("/materials/{materialId}/history", async (
            ClaimsPrincipal principal,
            ReadGateway gateway,
            string materialId,
            int? page,
            int? pageSize,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(materialId) || materialId.Length > 50)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["materialId"] = ["Mã vật tư là bắt buộc và không vượt quá 50 ký tự."],
                });
            }

            var paging = NormalizePaging(page, pageSize);
            var result = await gateway.GetMaterialHistoryAsync(
                GetUserId(principal), materialId.Trim(), paging.Page, paging.PageSize, cancellationToken);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("INV-03_GetMaterialHistory");

        group.MapGet("/locations", async (
            ClaimsPrincipal principal,
            ReadGateway gateway,
            string? area,
            int? page,
            int? pageSize,
            CancellationToken cancellationToken) =>
        {
            var paging = NormalizePaging(page, pageSize);
            return Results.Ok(await gateway.GetLocationsAsync(
                GetUserId(principal), area, paging.Page, paging.PageSize, cancellationToken));
        }).WithName("LOC-01_GetLocationMap");

        group.MapGet("/operations/summary", async (
            ClaimsPrincipal principal,
            ReadGateway gateway,
            CancellationToken cancellationToken) =>
            Results.Ok(await gateway.GetOperationsSummaryAsync(GetUserId(principal), cancellationToken)))
            .WithName("ADM-03_GetOperationsSummary");

        return endpoints;
    }

    private static string GetUserId(ClaimsPrincipal principal) =>
        principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? principal.Identity?.Name
        ?? throw new UnauthorizedAccessException("Không có user identity.");

    private static (int Page, int PageSize) NormalizePaging(int? page, int? pageSize) =>
        (Math.Max(page ?? 1, 1), Math.Clamp(pageSize ?? 50, 1, 200));
}

