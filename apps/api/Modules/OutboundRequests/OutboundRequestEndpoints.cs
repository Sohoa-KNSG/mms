using System.Security.Claims;

namespace Mms.Api.Modules.OutboundRequests;

public static class OutboundRequestEndpoints
{
    public static IEndpointRouteBuilder MapOutboundRequestEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/outbound-requests").RequireAuthorization().WithTags("Outbound Requests");
        group.MapGet("/catalog/planned", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            string? planningUnit, string? search, int? page, int? pageSize, CancellationToken token) =>
        {
            var paging = Paging(page, pageSize);
            return Results.Ok(await gateway.GetPlannedCatalogAsync(User(principal), planningUnit, search, paging.Page, paging.PageSize, token));
        }).WithName("OUT-01_GetPlannedCatalog");
        group.MapPost("/planned", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            CreateOutboundRequest request, CancellationToken token) =>
        {
            var invalid = ValidateCreate(request, planRequired: true);
            return invalid ?? Results.Ok(await gateway.CreatePlannedAsync(User(principal), request, token));
        }).WithName("OUT-01_CreatePlannedRequest");

        group.MapGet("/catalog/unplanned", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            string? planningUnit, string? search, int? page, int? pageSize, CancellationToken token) =>
        {
            var paging = Paging(page, pageSize);
            return Results.Ok(await gateway.GetUnplannedCatalogAsync(User(principal), planningUnit, search, paging.Page, paging.PageSize, token));
        }).WithName("OUT-02_GetUnplannedCatalog");
        group.MapPost("/unplanned", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            CreateOutboundRequest request, CancellationToken token) =>
        {
            var invalid = ValidateCreate(request, planRequired: false);
            return invalid ?? Results.Ok(await gateway.CreateUnplannedAsync(User(principal), request, token));
        }).WithName("OUT-02_CreateUnplannedRequest");

        group.MapGet("/catalog/over-plan", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            string? planningUnit, string? search, int? page, int? pageSize, CancellationToken token) =>
        {
            var paging = Paging(page, pageSize);
            return Results.Ok(await gateway.GetOverPlanCatalogAsync(User(principal), planningUnit, search, paging.Page, paging.PageSize, token));
        }).WithName("OUT-03_GetOverPlanCatalog");
        group.MapPost("/over-plan", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            CreateOutboundRequest request, CancellationToken token) =>
        {
            var invalid = ValidateCreate(request, planRequired: true);
            return invalid ?? Results.Ok(await gateway.CreateOverPlanAsync(User(principal), request, token));
        }).WithName("OUT-03_CreateOverPlanRequest");

        group.MapGet("", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            string? search, string? status, DateTime? fromDate, DateTime? toDate, int? page, int? pageSize, CancellationToken token) =>
        {
            var paging = Paging(page, pageSize);
            return Results.Ok(await gateway.GetQueueAsync(User(principal), search, status, fromDate, toDate, paging.Page, paging.PageSize, token));
        }).WithName("OUT-05_GetRequestQueue");
        group.MapGet("/{requestId:int}", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            int requestId, CancellationToken token) =>
        {
            if (requestId <= 0) return Invalid("requestId", "Mã phiếu phải lớn hơn 0.");
            var result = await gateway.GetRequestAsync(User(principal), requestId, token);
            return result is null ? Results.NotFound() : Results.Ok(result);
        }).WithName("OUT-04_GetRequest");
        group.MapPut("/{requestId:int}", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            int requestId, SaveOutboundRequest request, CancellationToken token) =>
        {
            if (requestId <= 0 || request.NeededAt == default || request.ExpectedChangedAt == default)
                return Invalid("request", "Mã phiếu, thời gian cần và phiên bản dữ liệu là bắt buộc.");
            var invalid = ValidateItems(request.Items, planRequired: false);
            return invalid ?? Results.Ok(await gateway.SaveAsync(User(principal), requestId, request, token));
        }).WithName("OUT-04_SaveRequest");
        group.MapPost("/{requestId:int}/decision", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            int requestId, DecideOutboundRequest request, CancellationToken token) =>
        {
            var decision = string.IsNullOrWhiteSpace(request.Decision) ? string.Empty : request.Decision.Trim().ToLowerInvariant();
            if (requestId <= 0 || request.ApprovalRunId <= 0 || decision is not ("approve" or "reject")
                || (decision == "reject" && string.IsNullOrWhiteSpace(request.Note)))
                return Invalid("decision", "Bước duyệt, quyết định và lý do từ chối phải hợp lệ.");
            return Results.Ok(await gateway.DecideAsync(User(principal), requestId, request with { Decision = decision }, token));
        }).WithName("OUT-05_DecideRequest");
        group.MapPost("/{requestId:int}/cancel", async (ClaimsPrincipal principal, OutboundRequestGateway gateway,
            int requestId, CancelOutboundRequest request, CancellationToken token) =>
        {
            if (requestId <= 0 || request.ExpectedChangedAt == default || string.IsNullOrWhiteSpace(request.Reason))
                return Invalid("cancel", "Mã phiếu, lý do và phiên bản dữ liệu là bắt buộc.");
            return Results.Ok(await gateway.CancelAsync(User(principal), requestId, request, token));
        }).WithName("OUT-05_CancelRequest");
        return endpoints;
    }

    private static IResult? ValidateCreate(CreateOutboundRequest request, bool planRequired)
    {
        if (string.IsNullOrWhiteSpace(request.PlanningUnit) || request.NeededAt == default)
            return Invalid("request", "Đơn vị kế hoạch và thời gian cần là bắt buộc.");
        return ValidateItems(request.Items, planRequired);
    }
    private static IResult? ValidateItems(IReadOnlyList<OutboundRequestItemInput> items, bool planRequired)
    {
        if (items.Count is < 1 or > 200 || items.Any(item => string.IsNullOrWhiteSpace(item.MaterialId)
            || item.Quantity <= 0 || (planRequired && item.PlanId is null or <= 0)))
            return Invalid("items", "Phiếu phải có 1-200 dòng vật tư hợp lệ.");
        if (items.Select(item => (item.MaterialId.Trim(), item.DestinationBravoCode?.Trim() ?? string.Empty)).Distinct().Count() != items.Count)
            return Invalid("items", "Không được trùng vật tư và tổ nhận trên cùng phiếu.");
        return null;
    }
    private static string User(ClaimsPrincipal principal) => principal.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? principal.Identity?.Name ?? throw new UnauthorizedAccessException("Không có user identity.");
    private static (int Page, int PageSize) Paging(int? page, int? pageSize) =>
        (Math.Max(page ?? 1, 1), Math.Clamp(pageSize ?? 50, 1, 200));
    private static IResult Invalid(string key, string value) =>
        Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [value] });
}
