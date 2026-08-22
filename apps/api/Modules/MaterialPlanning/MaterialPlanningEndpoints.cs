using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Mms.Api.Modules.MaterialPlanning;

public static class MaterialPlanningEndpoints
{
    private static string GetUserId(ClaimsPrincipal principal, HttpContext httpContext)
    {
        return httpContext.Request.Headers["X-User-Id"].FirstOrDefault()
            ?? httpContext.Request.Headers["X-Dev-User"].FirstOrDefault()
            ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.Identity?.Name
            ?? "57";
    }

    public static IEndpointRouteBuilder MapMaterialPlanningEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/v1/planning");

        // 1. Get Planning Units Catalog
        group.MapGet("/planning-units", async (
            ClaimsPrincipal principal,
            HttpContext context,
            MaterialPlanningGateway gateway,
            CancellationToken token) =>
        {
            var userId = GetUserId(principal, context);
            return Results.Ok(await gateway.GetPlanningUnitsAsync(userId, token));
        }).WithName("PLN_GetPlanningUnits");

        // 2. Get Monthly Quota & KPIs
        group.MapGet("/quotas", async (
            ClaimsPrincipal principal,
            HttpContext context,
            MaterialPlanningGateway gateway,
            [FromQuery] string? planningUnit,
            [FromQuery] int? month,
            [FromQuery] int? year,
            [FromQuery] string? search,
            [FromQuery] string? statusFilter,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            CancellationToken token) =>
        {
            var userId = GetUserId(principal, context);
            return Results.Ok(await gateway.GetMonthlyQuotaAsync(
                userId, planningUnit, month, year, search, statusFilter, page ?? 1, pageSize ?? 50, token));
        }).WithName("PLN_GetMonthlyQuota");

        // 3. Validate Paste Grid Data from Excel
        group.MapPost("/quotas/validate-paste", async (
            ClaimsPrincipal principal,
            HttpContext context,
            MaterialPlanningGateway gateway,
            [FromBody] List<ValidatePasteItemInput> items,
            CancellationToken token) =>
        {
            var userId = GetUserId(principal, context);
            return Results.Ok(await gateway.ValidatePasteDataAsync(userId, items ?? [], token));
        }).WithName("PLN_ValidatePasteData");

        // 4. Bulk Save Quotas (From Smart Paste or Form)
        group.MapPost("/quotas/bulk-save", async (
            ClaimsPrincipal principal,
            HttpContext context,
            MaterialPlanningGateway gateway,
            [FromBody] BulkSaveQuotaRequest request,
            CancellationToken token) =>
        {
            var userId = GetUserId(principal, context);
            if (string.IsNullOrWhiteSpace(request.PlanningUnit))
                return Results.BadRequest(new { message = "Đơn vị kế hoạch không được để trống." });
            if (request.Items == null || request.Items.Count == 0)
                return Results.BadRequest(new { message = "Danh sách vật tư định mức trống." });

            return Results.Ok(await gateway.BulkSaveQuotaAsync(userId, request, token));
        }).WithName("PLN_BulkSaveQuota");

        // 5. Copy Previous Month Quotas
        group.MapPost("/quotas/copy-previous-month", async (
            ClaimsPrincipal principal,
            HttpContext context,
            MaterialPlanningGateway gateway,
            [FromBody] CopyPreviousMonthRequest request,
            CancellationToken token) =>
        {
            var userId = GetUserId(principal, context);
            return Results.Ok(await gateway.CopyPreviousMonthQuotaAsync(userId, request, token));
        }).WithName("PLN_CopyPreviousMonthQuota");

        // 6. Toggle Quota Active Status
        group.MapPatch("/quotas/{planId:int}/status", async (
            ClaimsPrincipal principal,
            HttpContext context,
            MaterialPlanningGateway gateway,
            int planId,
            [FromBody] ToggleStatusRequest body,
            CancellationToken token) =>
        {
            var userId = GetUserId(principal, context);
            return Results.Ok(await gateway.ToggleQuotaStatusAsync(userId, planId, body.IsActive, token));
        }).WithName("PLN_ToggleQuotaStatus");

        // 7. Get Quota Usage History
        group.MapGet("/quotas/{planId:int}/usage-history", async (
            ClaimsPrincipal principal,
            HttpContext context,
            MaterialPlanningGateway gateway,
            int planId,
            CancellationToken token) =>
        {
            var userId = GetUserId(principal, context);
            return Results.Ok(await gateway.GetQuotaUsageHistoryAsync(userId, planId, token));
        }).WithName("PLN_GetQuotaUsageHistory");

        // 8. Get 3-Way Reconciliation (Planning vs Consumption vs Procurement)
        group.MapGet("/reconciliation", async (
            ClaimsPrincipal principal,
            HttpContext context,
            MaterialPlanningGateway gateway,
            [FromQuery] int? month,
            [FromQuery] int? year,
            [FromQuery] string? balanceStatus,
            [FromQuery] string? search,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            CancellationToken token) =>
        {
            var userId = GetUserId(principal, context);
            return Results.Ok(await gateway.Get3WayReconciliationAsync(
                userId, month, year, balanceStatus, search, page ?? 1, pageSize ?? 50, token));
        }).WithName("PLN_Get3WayReconciliation");

        return endpoints;
    }
}

public record ToggleStatusRequest(int IsActive);
