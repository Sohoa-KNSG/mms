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

        // =====================================================================
        // UC-27 (INV-08): Cycle Count Theo Vật Tư
        // =====================================================================
        group.MapPost("/cycle-counts", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, CreateCycleCountPlanRequest request, CancellationToken token) =>
        {
            if (string.IsNullOrWhiteSpace(request.MaterialId) || request.BookQuantity < 0)
                return Invalid("cycleCount", "Mã vật tư và số lượng sổ sách hợp lệ là bắt buộc.");
            var res = await gateway.CreateCycleCountPlanAsync(User(principal), request, token);
            return res.Ok ? Results.Ok(res) : Results.BadRequest(res);
        }).WithName("INV-08_CreateCycleCountPlan");

        group.MapGet("/locations", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, string? search, string? areaCode, CancellationToken token) =>
        {
            return Results.Ok(await gateway.GetWarehouseLocationsAsync(search, areaCode, token));
        }).WithName("INV_GetWarehouseLocations");

        group.MapGet("/cycle-count-materials", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, string? search, CancellationToken token) =>
        {
            return Results.Ok(await gateway.GetCycleCountMaterialsAsync(search, token));
        }).WithName("INV-08_GetCycleCountMaterials");

        group.MapGet("/cycle-counts", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, string? search, string? statusCode, CancellationToken token) =>
        {
            return Results.Ok(await gateway.GetCycleCountPlansAsync(User(principal), search, statusCode, token));
        }).WithName("INV-08_GetCycleCountPlans");

        group.MapGet("/cycle-counts/{planId:int}", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, int planId, CancellationToken token) =>
        {
            if (planId <= 0) return Invalid("planId", "Mã kế hoạch kiểm kê không hợp lệ.");
            var detail = await gateway.GetCycleCountPlanDetailAsync(User(principal), planId, token);
            return detail.Plan is null ? Results.NotFound() : Results.Ok(detail);
        }).WithName("INV-08_GetCycleCountPlanDetail");

        group.MapPost("/cycle-counts/{planId:int}/log", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, int planId, LogCycleCountRequest request, CancellationToken token) =>
        {
            if (planId <= 0 || request.DetailId <= 0 || request.BatchId <= 0 || request.ActualQuantity <= 0)
                return Invalid("logCount", "Mã chi tiết kiểm kê, batch và số lượng đếm hợp lệ (> 0) là bắt buộc.");
            var res = await gateway.LogCycleCountAsync(User(principal), request, token);
            return res.Ok ? Results.Ok(res) : Results.BadRequest(res);
        }).WithName("INV-08_LogCycleCount");

        group.MapPost("/cycle-counts/{planId:int}/finish", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, int planId, CancellationToken token) =>
        {
            if (planId <= 0) return Invalid("finishPlan", "Mã kế hoạch không hợp lệ.");
            var res = await gateway.FinishCycleCountAsync(User(principal), planId, token);
            return res.Ok ? Results.Ok(res) : Results.BadRequest(res);
        }).WithName("INV-09_FinishCycleCount");

        // =====================================================================
        // UC-10: Tách Batch & Gia Phả (Genealogy)
        // =====================================================================
        group.MapPost("/batches/{batchId:int}/split-v2", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, int batchId, SplitBatchV2Request request, CancellationToken token) =>
        {
            if (batchId <= 0 || request.SplitQuantity <= 0) return Invalid("split", "Batch và số lượng tách hợp lệ là bắt buộc.");
            var res = await gateway.SplitBatchV2Async(User(principal), batchId, request, token);
            return res.IsSuccess ? Results.Ok(res) : Results.BadRequest(res);
        }).WithName("INV-10_SplitBatchV2");

        group.MapGet("/batches/{batchId:int}/genealogy", async (ClaimsPrincipal principal, InventoryOperationGateway gateway, int batchId, CancellationToken token) =>
        {
            if (batchId <= 0) return Invalid("batchId", "Mã batch không hợp lệ.");
            return Results.Ok(await gateway.GetBatchGenealogyAsync(batchId, token));
        }).WithName("INV-10_GetBatchGenealogy");

        // =====================================================================
        // SỔ NHẬT KÝ GIAO DỊCH KHO (TRANSACTION LEDGER)
        // =====================================================================
        group.MapGet("/transactions", async (
            ClaimsPrincipal principal,
            InventoryOperationGateway gateway,
            [Microsoft.AspNetCore.Mvc.FromQuery] string? search,
            [Microsoft.AspNetCore.Mvc.FromQuery] string? operationCode,
            [Microsoft.AspNetCore.Mvc.FromQuery] int? page,
            [Microsoft.AspNetCore.Mvc.FromQuery] int? pageSize,
            CancellationToken token) =>
        {
            return Results.Ok(await gateway.GetWarehouseTransactionsAsync(search, operationCode, page ?? 1, pageSize ?? 100, token));
        }).WithName("INV_GetWarehouseTransactions");

        // =====================================================================
        // HTTP POST PRINT LABEL TO 10.17.16.102:8080
        // =====================================================================
        group.MapPost("/print-label", async (ClaimsPrincipal principal, [Microsoft.AspNetCore.Mvc.FromBody] PrintLabelWebhookRequest request, [Microsoft.AspNetCore.Mvc.FromServices] IHttpClientFactory httpClientFactory, CancellationToken token) =>
        {
            if (string.IsNullOrWhiteSpace(request.Batch))
                return Invalid("batch", "Mã batch là bắt buộc.");

            var client = httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(5);

            string userMsnv;
            try
            {
                userMsnv = !string.IsNullOrWhiteSpace(request.Msnv) ? request.Msnv : User(principal);
            }
            catch
            {
                userMsnv = !string.IsNullOrWhiteSpace(request.Msnv) ? request.Msnv : "00";
            }

            var payload = new
            {
                batch = request.Batch,
                msnv = userMsnv,
                kho = string.IsNullOrWhiteSpace(request.Kho) ? "vt" : request.Kho
            };

            var content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(payload),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            try
            {
                var targetUrl = "http://10.17.16.102:8080";
                var response = await client.PostAsync(targetUrl, content, token);
                var responseBody = await response.Content.ReadAsStringAsync(token);
                return Results.Ok(new PrintLabelResult(
                    response.IsSuccessStatusCode,
                    $"Gửi lệnh in Lô #{payload.batch} đến máy in 10.17.16.102:8080 thành công.",
                    (int)response.StatusCode,
                    payload,
                    responseBody
                ));
            }
            catch (Exception ex)
            {
                return Results.Ok(new PrintLabelResult(
                    false,
                    $"Lệnh in đã được phát. (Lưu ý mạng LAN 10.17.16.102:8080: {ex.Message})",
                    null,
                    payload,
                    null
                ));
            }
        }).WithName("PrintLabelWebhook");

        group.MapGet("/batches/{batchId:int}/full-history", async (InventoryOperationGateway gateway, int batchId, CancellationToken token) =>
        {
            if (batchId <= 0) return Invalid("batchId", "Mã Lô (Batch ID) phải lớn hơn 0.");
            var res = await gateway.GetBatchFullHistoryAsync(batchId, token);
            return res.Found ? Results.Ok(res) : Results.NotFound(new { message = $"Không tìm thấy thông tin Lô #{batchId} trên CSDL MMS1." });
        }).WithName("INV-02_GetBatchFullHistory");

        group.MapGet("/batches", async (InventoryOperationGateway gateway, string? search, string? warehouse, int? limit, CancellationToken token) =>
        {
            return Results.Ok(await gateway.GetRealBatchesAsync(search, warehouse, limit ?? 100, token));
        }).WithName("INV-02_GetRealBatches");

        return endpoints;
    }
    private static string User(ClaimsPrincipal principal) => principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.Identity?.Name ?? throw new UnauthorizedAccessException("Không có user identity.");
    private static int? Positive(int? value) => value is > 0 ? value : null;
    private static (int Page, int PageSize) Paging(int? page, int? size) => (Math.Max(page ?? 1, 1), Math.Clamp(size ?? 50, 1, 200));
    private static IResult Invalid(string key, string value) => Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [value] });
}

