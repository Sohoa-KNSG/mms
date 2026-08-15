using System.Security.Claims;

namespace Mms.Api.Modules.InternalReturns;

public static class InternalReturnEndpoints
{
    public static IEndpointRouteBuilder MapInternalReturnEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/internal-returns").RequireAuthorization().WithTags("Internal Returns");
        group.MapGet("/catalog", async (ClaimsPrincipal principal, InternalReturnGateway gateway, string? search, CancellationToken token) =>
            Results.Ok(await gateway.GetCatalogAsync(User(principal), search, token))).WithName("RET-01_GetReturnCatalog");
        group.MapPost("", async (ClaimsPrincipal principal, InternalReturnGateway gateway, CreateInternalReturn request, CancellationToken token) =>
        {
            if (string.IsNullOrWhiteSpace(request.DestinationBravoCode) || request.QualityCode is not ("1" or "2") || request.ReturnAt == default ||
                request.Items.Count is < 1 or > 200 || request.Items.Any(item => string.IsNullOrWhiteSpace(item.MaterialId) || item.Quantity <= 0 || string.IsNullOrWhiteSpace(item.Note)))
                return Invalid("return", "Destination, quality, return date and 1-200 valid lines are required.");
            if (request.Items.Select(item => item.MaterialId.Trim()).Distinct().Count() != request.Items.Count)
                return Invalid("items", "Materials must not be duplicated.");
            return Results.Ok(await gateway.CreateAsync(User(principal), request, token));
        }).WithName("RET-01_CreateInternalReturn");
        group.MapGet("", async (ClaimsPrincipal principal, InternalReturnGateway gateway, string? search, string? status,
            int? page, int? pageSize, CancellationToken token) =>
        {
            var paging = Paging(page, pageSize);
            return Results.Ok(await gateway.GetQueueAsync(User(principal), search, status, paging.Page, paging.PageSize, token));
        }).WithName("RET-01_GetReturnQueue");
        group.MapGet("/{returnId:int}", async (ClaimsPrincipal principal, InternalReturnGateway gateway, int returnId, CancellationToken token) =>
        {
            if (returnId <= 0) return Invalid("returnId", "Return id must be greater than zero.");
            var result = await gateway.GetAsync(User(principal), returnId, token);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("RET-01_GetInternalReturn");
        group.MapPost("/{returnId:int}/confirmation", async (ClaimsPrincipal principal, InternalReturnGateway gateway,
            int returnId, ConfirmInternalReturn request, CancellationToken token) =>
        {
            if (returnId <= 0 || request.ResultCode is < 1 or > 3 || (request.ResultCode == 3 && string.IsNullOrWhiteSpace(request.Note)))
                return Invalid("confirmation", "Return, result and rejection reason are invalid.");
            return Results.Ok(await gateway.ConfirmAsync(User(principal), returnId, request, token));
        }).WithName("RET-02_ConfirmInternalReturn");
        group.MapGet("/documents/confirmed", async (ClaimsPrincipal principal, InternalReturnGateway gateway, string? search, CancellationToken token) =>
            Results.Ok(await gateway.GetDocumentsAsync(User(principal), search, token))).WithName("RET-03_GetReturnDocuments");
        group.MapGet("/documents/{documentId:int}/batches", async (ClaimsPrincipal principal, InternalReturnGateway gateway,
            int documentId, CancellationToken token) => documentId <= 0 ? Invalid("documentId", "Document id must be greater than zero.")
                : Results.Ok(await gateway.GetBatchesAsync(User(principal), documentId, token))).WithName("RET-03_GetReturnBatches");
        group.MapPost("/documents/{documentId:int}/batches/{batchId:int}/split", async (ClaimsPrincipal principal,
            InternalReturnGateway gateway, int documentId, int batchId, SplitReturnBatch request, CancellationToken token) =>
            documentId <= 0 || batchId <= 0 || request.SplitQuantity <= 0 || request.SplitQuantity >= request.ExpectedQuantity
                ? Invalid("split", "Document, batch and split quantities are invalid.")
                : Results.Ok(await gateway.SplitAsync(User(principal), documentId, batchId, request, token)))
            .WithName("RET-03_SplitReturnBatch");
        return endpoints;
    }

    private static string User(ClaimsPrincipal principal) => principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? principal.Identity?.Name ?? throw new UnauthorizedAccessException("Missing user identity.");
    private static (int Page, int PageSize) Paging(int? page, int? pageSize) => (Math.Max(page ?? 1, 1), Math.Clamp(pageSize ?? 50, 1, 200));
    private static IResult Invalid(string key, string value) => Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [value] });
}
