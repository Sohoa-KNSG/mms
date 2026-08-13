using System.Security.Claims;

namespace Mms.Api.Modules.LocationOperations;

public static class LocationOperationEndpoints
{
    public static IEndpointRouteBuilder MapLocationOperationEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/location-operations").RequireAuthorization().WithTags("Location Operations");
        group.MapGet("/put-away", async (ClaimsPrincipal principal, LocationOperationGateway gateway, string? search, int? page, int? pageSize, CancellationToken token) => { var p = Paging(page, pageSize); return Results.Ok(await gateway.GetPutAwayAsync(User(principal), search, p.Page, p.PageSize, token)); }).WithName("LOC-02_GetPutAwayWorklist");
        group.MapPost("/put-away", async (ClaimsPrincipal principal, LocationOperationGateway gateway, BatchLocationRequest request, CancellationToken token) =>
        { var error = Validate(request, true); return error is not null ? error : Results.Ok(await gateway.PutAwayAsync(User(principal), request, token)); }).WithName("LOC-02_PutAwayBatches");
        group.MapGet("/relocation", async (ClaimsPrincipal principal, LocationOperationGateway gateway, string? search, string? locationCode, int? page, int? pageSize, CancellationToken token) => { var p = Paging(page, pageSize); return Results.Ok(await gateway.GetRelocationAsync(User(principal), search, locationCode, p.Page, p.PageSize, token)); }).WithName("LOC-03_GetRelocationWorklist");
        group.MapPost("/relocation", async (ClaimsPrincipal principal, LocationOperationGateway gateway, BatchLocationRequest request, CancellationToken token) =>
        { var error = Validate(request, true); return error is not null ? error : Results.Ok(await gateway.RelocateAsync(User(principal), request, token)); }).WithName("LOC-03_RelocateBatches");
        group.MapGet("/take-down", async (ClaimsPrincipal principal, LocationOperationGateway gateway, string? search, string? locationCode, int? page, int? pageSize, CancellationToken token) => { var p = Paging(page, pageSize); return Results.Ok(await gateway.GetTakeDownAsync(User(principal), search, locationCode, p.Page, p.PageSize, token)); }).WithName("LOC-04_GetTakeDownWorklist");
        group.MapPost("/take-down", async (ClaimsPrincipal principal, LocationOperationGateway gateway, BatchLocationRequest request, CancellationToken token) =>
        { var error = Validate(request, false); return error is not null ? error : Results.Ok(await gateway.TakeDownAsync(User(principal), request, token)); }).WithName("LOC-04_TakeDownBatches");
        return endpoints;
    }
    private static IResult? Validate(BatchLocationRequest request, bool needsTarget)
    {
        if ((needsTarget && string.IsNullOrWhiteSpace(request.TargetLocationCode)) || request.Batches.Count is < 1 or > 200
            || request.Batches.Any(item => item.BatchId <= 0) || request.Batches.Select(item => item.BatchId).Distinct().Count() != request.Batches.Count)
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["movement"] = ["Vị trí đích (nếu có) và 1-200 batch không trùng là bắt buộc."] });
        return null;
    }
    private static string User(ClaimsPrincipal principal) => principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.Identity?.Name ?? throw new UnauthorizedAccessException("Không có user identity.");
    private static (int Page, int PageSize) Paging(int? page, int? size) => (Math.Max(page ?? 1, 1), Math.Clamp(size ?? 50, 1, 200));
}

