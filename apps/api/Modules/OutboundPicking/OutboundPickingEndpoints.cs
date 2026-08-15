using System.Security.Claims;

namespace Mms.Api.Modules.OutboundPicking;

public static class OutboundPickingEndpoints
{
    public static IEndpointRouteBuilder MapOutboundPickingEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/outbound-picking").RequireAuthorization().WithTags("Outbound Picking");
        group.MapGet("/requests", async (ClaimsPrincipal principal, OutboundPickingGateway gateway,
            string? search, string? status, int? page, int? pageSize, CancellationToken token) =>
        {
            var paging = Paging(page, pageSize);
            return Results.Ok(await gateway.GetQueueAsync(User(principal), search, status, paging.Page, paging.PageSize, token));
        }).WithName("OUT-06_GetPickingQueue");
        group.MapGet("/requests/{requestId:int}", async (ClaimsPrincipal principal, OutboundPickingGateway gateway,
            int requestId, CancellationToken token) =>
        {
            if (requestId <= 0) return Invalid("requestId", "Request id must be greater than zero.");
            var result = await gateway.GetRequestAsync(User(principal), requestId, token);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("OUT-06_GetPickingRequest");
        group.MapPost("/requests/{requestId:int}/start", async (ClaimsPrincipal principal, OutboundPickingGateway gateway,
            int requestId, CancellationToken token) => requestId <= 0
                ? Invalid("requestId", "Request id must be greater than zero.")
                : Results.Ok(await gateway.StartAsync(User(principal), requestId, token)))
            .WithName("OUT-06_StartPicking");
        group.MapGet("/requests/{requestId:int}/lines/{lineId:int}/batches", async (ClaimsPrincipal principal,
            OutboundPickingGateway gateway, int requestId, int lineId, CancellationToken token) =>
            requestId <= 0 || lineId <= 0 ? Invalid("line", "Request and line ids must be greater than zero.")
                : Results.Ok(await gateway.GetBatchesAsync(User(principal), requestId, lineId, token)))
            .WithName("OUT-07_GetPickableBatches");
        group.MapPost("/requests/{requestId:int}/lines/{lineId:int}/pick", async (ClaimsPrincipal principal,
            OutboundPickingGateway gateway, int requestId, int lineId, PickBatchRequest request, CancellationToken token) =>
            requestId <= 0 || lineId <= 0 || request.BatchId <= 0 || request.Quantity <= 0 || request.ExpectedBatchQuantity < request.Quantity
                ? Invalid("pick", "Batch, quantity and expected balance are invalid.")
                : Results.Ok(await gateway.PickAsync(User(principal), requestId, lineId, request, token)))
            .WithName("OUT-07_PickBatch");
        group.MapPost("/requests/{requestId:int}/complete", async (ClaimsPrincipal principal, OutboundPickingGateway gateway,
            int requestId, CancellationToken token) => requestId <= 0
                ? Invalid("requestId", "Request id must be greater than zero.")
                : Results.Ok(await gateway.CompleteAsync(User(principal), requestId, token)))
            .WithName("OUT-08_CompleteGoodsIssue");
        group.MapGet("/documents", async (ClaimsPrincipal principal, OutboundPickingGateway gateway,
            string? search, int? page, int? pageSize, CancellationToken token) =>
        {
            var paging = Paging(page, pageSize);
            return Results.Ok(await gateway.GetDocumentsAsync(User(principal), search, paging.Page, paging.PageSize, token));
        }).WithName("OUT-09_GetIssueDocuments");
        group.MapGet("/documents/{documentId:int}/print", async (ClaimsPrincipal principal, OutboundPickingGateway gateway,
            int documentId, CancellationToken token) =>
        {
            if (documentId <= 0) return Invalid("documentId", "Document id must be greater than zero.");
            var result = await gateway.GetPrintDataAsync(User(principal), documentId, token);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("OUT-09_GetIssuePrintData");
        return endpoints;
    }

    private static string User(ClaimsPrincipal principal) => principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? principal.Identity?.Name ?? throw new UnauthorizedAccessException("Missing user identity.");
    private static (int Page, int PageSize) Paging(int? page, int? pageSize) =>
        (Math.Max(page ?? 1, 1), Math.Clamp(pageSize ?? 50, 1, 200));
    private static IResult Invalid(string key, string value) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [value] });
}
