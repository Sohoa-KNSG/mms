using System.Data;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.MaterialPlanning;

public record MonthlyQuotaItem(
    int PlanId,
    string PlanningUnit,
    string? PlanningUnitName,
    string MaterialId,
    string? BravoId,
    string? MaterialName,
    string? Unit,
    int Month,
    int Year,
    decimal LimitQuantity,
    decimal RequestedQuantity,
    decimal IssuedQuantity,
    decimal RemainingQuantity,
    decimal ConsumptionPercentage,
    int IsActive,
    string? Note,
    string? CreatedBy,
    DateTime? CreatedAt,
    string? UpdatedBy,
    DateTime? UpdatedAt,
    string StatusLevel
);

public record MonthlyQuotaKpis(
    int TotalSkuCount,
    decimal TotalLimitQuantity,
    decimal TotalRequestedQuantity,
    decimal TotalIssuedQuantity,
    int WarningCount,
    int OverLimitCount
);

public record MonthlyQuotaPage(
    List<MonthlyQuotaItem> Items,
    MonthlyQuotaKpis Kpis,
    int Page,
    int PageSize
);

public record BulkSaveQuotaInputItem(
    string MaterialId,
    decimal Quantity,
    string? Unit,
    string? Note
);

public record BulkSaveQuotaRequest(
    string PlanningUnit,
    int Month,
    int Year,
    List<BulkSaveQuotaInputItem> Items
);

public record BulkSaveQuotaResult(
    bool IsSuccess,
    string PlanningUnit,
    int Month,
    int Year,
    int InsertedCount,
    int UpdatedCount,
    int TotalProcessed
);

public record ValidatePasteItemInput(
    string RawMaterialCode,
    decimal RawQuantity,
    string? RawUnit,
    string? RawNote
);

public record ValidatePasteItemResult(
    int RowIndex,
    string RawMaterialCode,
    bool IsValid,
    string? ErrorMessage,
    string? MaterialId,
    string? BravoId,
    string? MaterialName,
    string? Unit,
    decimal Quantity,
    string? Note,
    bool IsDuplicate
);

public record ValidatePasteResult(
    int TotalRows,
    int ValidRows,
    int InvalidRows,
    int DuplicateRows,
    List<ValidatePasteItemResult> Items
);

public record CopyPreviousMonthRequest(
    string PlanningUnit,
    int SourceMonth,
    int SourceYear,
    int TargetMonth,
    int TargetYear
);

public record CopyPreviousMonthResult(
    bool IsSuccess,
    string PlanningUnit,
    int TargetMonth,
    int TargetYear,
    int CopiedCount
);

public record ToggleQuotaStatusResult(
    int PlanId,
    int IsActive,
    DateTime UpdatedAt
);

public record QuotaUsageHistoryHeader(
    int PlanId,
    string PlanningUnit,
    string? PlanningUnitName,
    string MaterialId,
    string? BravoId,
    string? MaterialName,
    string? Unit,
    int Month,
    int Year,
    decimal LimitQuantity,
    decimal RequestedQuantity,
    decimal IssuedQuantity,
    decimal RemainingQuantity,
    decimal ConsumptionPercentage,
    int IsActive,
    string? Note
);

public record QuotaUsageHistoryItem(
    int RequestId,
    string RequestCode,
    int RequestLineId,
    decimal RequestedQuantity,
    string? Unit,
    string? Requester,
    string? DepartmentCode,
    DateTime? RequestDate,
    string? RequestStatus,
    string? PickingStatus,
    int? IssueDocumentId,
    decimal IssuedQuantity,
    string? Note
);

public record QuotaUsageHistoryResponse(
    QuotaUsageHistoryHeader Header,
    List<QuotaUsageHistoryItem> Requests
);

public record ThreeWayReconciliationItem(
    string MaterialId,
    string? BravoId,
    string? MaterialName,
    string? Unit,
    int PlanMonth,
    int PlanYear,
    decimal PlannedQuota,
    decimal RequestedQuantity,
    decimal IssuedQuantity,
    decimal RemainingQuota,
    decimal PoOrderedQuantity,
    decimal ReceivedQuantity,
    decimal InTransitQuantity,
    decimal AvailableInventory,
    decimal PurchaseRecommendationGap,
    string BalanceStatusCode,
    decimal SupplyFulfillmentRate,
    decimal ConsumptionRate
);

public record ThreeWayReconciliationKpis(
    int TotalSkuCount,
    decimal TotalPlannedQuota,
    decimal TotalIssuedQuantity,
    decimal TotalPoQuantity,
    decimal TotalAvailableInventory,
    int ShortageCount,
    int OverstockCount,
    decimal TotalPurchaseGap
);

public record ThreeWayReconciliationPage(
    List<ThreeWayReconciliationItem> Items,
    ThreeWayReconciliationKpis Kpis,
    int Page,
    int PageSize
);

public record PlanningUnitItem(
    string Code,
    string Name
);

public class MaterialPlanningGateway(ISqlConnectionFactory connectionFactory)
{
    private static SqlCommand StoredProcCommand(SqlConnection connection, string procedureName, string userId)
    {
        var command = connection.CreateCommand();
        command.CommandType = CommandType.StoredProcedure;
        command.CommandText = procedureName;
        command.Parameters.AddWithValue("@UserId", userId);
        return command;
    }

    public async Task<List<PlanningUnitItem>> GetPlanningUnitsAsync(string userId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        const string sql = @"
            SELECT DISTINCT donvi_kehoach, ten_kehoach 
            FROM dbo.tbl_dm_kehoach 
            WHERE ISNULL(status_active, 0) = 1
            ORDER BY donvi_kehoach;";

        var result = new List<PlanningUnitItem>();
        await using var command = new SqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(token);
        while (await reader.ReadAsync(token))
        {
            var code = reader.IsDBNull(0) ? "" : reader.GetString(0);
            var name = reader.IsDBNull(1) ? code : reader.GetString(1);
            result.Add(new PlanningUnitItem(code, name));
        }

        if (result.Count == 0)
        {
            result.Add(new PlanningUnitItem("PX_DAP", "Phân Xưởng Dập"));
            result.Add(new PlanningUnitItem("PX_MA", "Phân Xưởng Mạ"));
            result.Add(new PlanningUnitItem("LINE_KEM_INOX", "Line Kèm Inox - NM1"));
            result.Add(new PlanningUnitItem("PX_NHIET_LUYEN", "Phân Xưởng Nhiệt Luyện"));
            result.Add(new PlanningUnitItem("PX_DONG_GOI", "Phân Xưởng Đóng Gói"));
        }

        return result;
    }

    public async Task<MonthlyQuotaPage> GetMonthlyQuotaAsync(
        string userId,
        string? planningUnit,
        int? month,
        int? year,
        string? search,
        string? statusFilter,
        int page,
        int pageSize,
        CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = StoredProcCommand(connection, "api.usp_WMS_PLN01_GetMonthlyQuota_v1", userId);
        command.Parameters.AddWithValue("@PlanningUnit", (object?)planningUnit ?? DBNull.Value);
        command.Parameters.AddWithValue("@Month", (object?)month ?? DBNull.Value);
        command.Parameters.AddWithValue("@Year", (object?)year ?? DBNull.Value);
        command.Parameters.AddWithValue("@Search", (object?)search ?? DBNull.Value);
        command.Parameters.AddWithValue("@StatusFilter", (object?)statusFilter ?? DBNull.Value);
        command.Parameters.AddWithValue("@Page", page);
        command.Parameters.AddWithValue("@PageSize", pageSize);

        var items = new List<MonthlyQuotaItem>();
        MonthlyQuotaKpis kpis = new(0, 0, 0, 0, 0, 0);

        await using var reader = await command.ExecuteReaderAsync(token);
        while (await reader.ReadAsync(token))
        {
            items.Add(new MonthlyQuotaItem(
                reader.GetInt32(reader.GetOrdinal("id_kehoach")),
                reader.GetString(reader.GetOrdinal("donvi_kehoach")),
                reader.IsDBNull(reader.GetOrdinal("ten_donvi_kehoach")) ? null : reader.GetString(reader.GetOrdinal("ten_donvi_kehoach")),
                reader.GetString(reader.GetOrdinal("id_vattu")),
                reader.IsDBNull(reader.GetOrdinal("id_bravo")) ? null : reader.GetString(reader.GetOrdinal("id_bravo")),
                reader.IsDBNull(reader.GetOrdinal("ten_vattu")) ? null : reader.GetString(reader.GetOrdinal("ten_vattu")),
                reader.IsDBNull(reader.GetOrdinal("unit")) ? null : reader.GetString(reader.GetOrdinal("unit")),
                reader.GetInt32(reader.GetOrdinal("thang")),
                reader.GetInt32(reader.GetOrdinal("nam")),
                reader.GetDecimal(reader.GetOrdinal("LimitQuantity")),
                reader.GetDecimal(reader.GetOrdinal("RequestedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("IssuedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("RemainingQuantity")),
                reader.GetDecimal(reader.GetOrdinal("ConsumptionPercentage")),
                reader.GetInt32(reader.GetOrdinal("is_active")),
                reader.IsDBNull(reader.GetOrdinal("ghi_chu")) ? null : reader.GetString(reader.GetOrdinal("ghi_chu")),
                null,
                null,
                reader.IsDBNull(reader.GetOrdinal("user_up")) ? null : reader.GetString(reader.GetOrdinal("user_up")),
                reader.IsDBNull(reader.GetOrdinal("time_up")) ? null : reader.GetDateTime(reader.GetOrdinal("time_up")),
                reader.GetString(reader.GetOrdinal("StatusLevel"))
            ));
        }

        if (await reader.NextResultAsync(token) && await reader.ReadAsync(token))
        {
            kpis = new MonthlyQuotaKpis(
                reader.GetInt32(reader.GetOrdinal("TotalSkuCount")),
                reader.GetDecimal(reader.GetOrdinal("TotalLimitQuantity")),
                reader.GetDecimal(reader.GetOrdinal("TotalRequestedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("TotalIssuedQuantity")),
                reader.GetInt32(reader.GetOrdinal("WarningCount")),
                reader.GetInt32(reader.GetOrdinal("OverLimitCount"))
            );
        }

        return new MonthlyQuotaPage(items, kpis, page, pageSize);
    }

    public async Task<ValidatePasteResult> ValidatePasteDataAsync(
        string userId,
        List<ValidatePasteItemInput> rawItems,
        CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);

        // Fetch all materials in memory for high-speed validation
        const string sql = "SELECT id_vattu, id_bravo, ten_vattu, unit FROM dbo.tbl_dm_vattu;";
        var matDict = new Dictionary<string, (string MaterialId, string? BravoId, string MaterialName, string Unit)>(StringComparer.OrdinalIgnoreCase);
        var bravoDict = new Dictionary<string, (string MaterialId, string? BravoId, string MaterialName, string Unit)>(StringComparer.OrdinalIgnoreCase);

        await using (var cmd = new SqlCommand(sql, connection))
        await using (var reader = await cmd.ExecuteReaderAsync(token))
        {
            while (await reader.ReadAsync(token))
            {
                var id = reader.GetString(0).Trim();
                var bravo = reader.IsDBNull(1) ? null : reader.GetString(1).Trim();
                var name = reader.IsDBNull(2) ? id : reader.GetString(2);
                var unit = reader.IsDBNull(3) ? "Cái" : reader.GetString(3);

                var tuple = (id, bravo, name, unit);
                matDict[id] = tuple;
                if (!string.IsNullOrEmpty(bravo)) bravoDict[bravo] = tuple;
            }
        }

        var results = new List<ValidatePasteItemResult>();
        var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int valid = 0, invalid = 0, dup = 0;

        for (int i = 0; i < rawItems.Count; i++)
        {
            var raw = rawItems[i];
            var code = raw.RawMaterialCode?.Trim() ?? "";

            if (string.IsNullOrEmpty(code))
            {
                results.Add(new ValidatePasteItemResult(i + 1, code, false, "Mã vật tư trống", null, null, null, null, raw.RawQuantity, raw.RawNote, false));
                invalid++;
                continue;
            }

            bool isDup = !seenCodes.Add(code);
            if (isDup) dup++;

            if (raw.RawQuantity <= 0)
            {
                results.Add(new ValidatePasteItemResult(i + 1, code, false, "Số lượng định mức phải > 0", null, null, null, null, raw.RawQuantity, raw.RawNote, isDup));
                invalid++;
                continue;
            }

            if (matDict.TryGetValue(code, out var found) || bravoDict.TryGetValue(code, out found))
            {
                results.Add(new ValidatePasteItemResult(
                    i + 1,
                    code,
                    true,
                    null,
                    found.MaterialId,
                    found.BravoId,
                    found.MaterialName,
                    string.IsNullOrEmpty(raw.RawUnit) ? found.Unit : raw.RawUnit,
                    raw.RawQuantity,
                    raw.RawNote,
                    isDup
                ));
                valid++;
            }
            else
            {
                results.Add(new ValidatePasteItemResult(
                    i + 1,
                    code,
                    false,
                    "Mã không tồn tại trong danh mục CSDL",
                    null,
                    null,
                    null,
                    null,
                    raw.RawQuantity,
                    raw.RawNote,
                    isDup
                ));
                invalid++;
            }
        }

        return new ValidatePasteResult(rawItems.Count, valid, invalid, dup, results);
    }

    public async Task<BulkSaveQuotaResult> BulkSaveQuotaAsync(
        string userId,
        BulkSaveQuotaRequest request,
        CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = StoredProcCommand(connection, "api.usp_WMS_PLN01_BulkSaveQuota_v1", userId);
        command.Parameters.AddWithValue("@PlanningUnit", request.PlanningUnit);
        command.Parameters.AddWithValue("@Month", request.Month);
        command.Parameters.AddWithValue("@Year", request.Year);
        command.Parameters.AddWithValue("@ItemsJson", JsonSerializer.Serialize(request.Items));

        await using var reader = await command.ExecuteReaderAsync(token);
        if (await reader.ReadAsync(token))
        {
            return new BulkSaveQuotaResult(
                reader.GetBoolean(reader.GetOrdinal("IsSuccess")),
                reader.GetString(reader.GetOrdinal("PlanningUnit")),
                reader.GetInt32(reader.GetOrdinal("Month")),
                reader.GetInt32(reader.GetOrdinal("Year")),
                reader.GetInt32(reader.GetOrdinal("InsertedCount")),
                reader.GetInt32(reader.GetOrdinal("UpdatedCount")),
                reader.GetInt32(reader.GetOrdinal("TotalProcessed"))
            );
        }

        throw new InvalidOperationException("SP BulkSaveQuota did not return a result.");
    }

    public async Task<CopyPreviousMonthResult> CopyPreviousMonthQuotaAsync(
        string userId,
        CopyPreviousMonthRequest request,
        CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = StoredProcCommand(connection, "api.usp_WMS_PLN01_CopyPreviousMonthQuota_v1", userId);
        command.Parameters.AddWithValue("@PlanningUnit", request.PlanningUnit);
        command.Parameters.AddWithValue("@SourceMonth", request.SourceMonth);
        command.Parameters.AddWithValue("@SourceYear", request.SourceYear);
        command.Parameters.AddWithValue("@TargetMonth", request.TargetMonth);
        command.Parameters.AddWithValue("@TargetYear", request.TargetYear);

        await using var reader = await command.ExecuteReaderAsync(token);
        if (await reader.ReadAsync(token))
        {
            return new CopyPreviousMonthResult(
                reader.GetBoolean(reader.GetOrdinal("IsSuccess")),
                reader.GetString(reader.GetOrdinal("PlanningUnit")),
                reader.GetInt32(reader.GetOrdinal("TargetMonth")),
                reader.GetInt32(reader.GetOrdinal("TargetYear")),
                reader.GetInt32(reader.GetOrdinal("CopiedCount"))
            );
        }

        throw new InvalidOperationException("SP CopyPreviousMonthQuota did not return a result.");
    }

    public async Task<ToggleQuotaStatusResult> ToggleQuotaStatusAsync(
        string userId,
        int planId,
        int isActive,
        CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = StoredProcCommand(connection, "api.usp_WMS_PLN01_ToggleQuotaStatus_v1", userId);
        command.Parameters.AddWithValue("@PlanId", planId);
        command.Parameters.AddWithValue("@IsActive", isActive);

        await using var reader = await command.ExecuteReaderAsync(token);
        if (await reader.ReadAsync(token))
        {
            return new ToggleQuotaStatusResult(
                reader.GetInt32(reader.GetOrdinal("PlanId")),
                reader.GetInt32(reader.GetOrdinal("IsActive")),
                reader.GetDateTime(reader.GetOrdinal("UpdatedAt"))
            );
        }

        throw new InvalidOperationException("SP ToggleQuotaStatus did not return a result.");
    }

    public async Task<QuotaUsageHistoryResponse> GetQuotaUsageHistoryAsync(
        string userId,
        int planId,
        CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = StoredProcCommand(connection, "api.usp_WMS_PLN02_GetQuotaUsageHistory_v1", userId);
        command.Parameters.AddWithValue("@PlanId", planId);

        QuotaUsageHistoryHeader? header = null;
        var requests = new List<QuotaUsageHistoryItem>();

        await using var reader = await command.ExecuteReaderAsync(token);
        if (await reader.ReadAsync(token))
        {
            header = new QuotaUsageHistoryHeader(
                reader.GetInt32(reader.GetOrdinal("id_kehoach")),
                reader.GetString(reader.GetOrdinal("donvi_kehoach")),
                reader.IsDBNull(reader.GetOrdinal("ten_donvi_kehoach")) ? null : reader.GetString(reader.GetOrdinal("ten_donvi_kehoach")),
                reader.GetString(reader.GetOrdinal("id_vattu")),
                reader.IsDBNull(reader.GetOrdinal("id_bravo")) ? null : reader.GetString(reader.GetOrdinal("id_bravo")),
                reader.IsDBNull(reader.GetOrdinal("ten_vattu")) ? null : reader.GetString(reader.GetOrdinal("ten_vattu")),
                reader.IsDBNull(reader.GetOrdinal("unit")) ? null : reader.GetString(reader.GetOrdinal("unit")),
                reader.GetInt32(reader.GetOrdinal("thang")),
                reader.GetInt32(reader.GetOrdinal("nam")),
                reader.GetDecimal(reader.GetOrdinal("LimitQuantity")),
                reader.GetDecimal(reader.GetOrdinal("RequestedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("IssuedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("RemainingQuantity")),
                reader.GetDecimal(reader.GetOrdinal("ConsumptionPercentage")),
                reader.GetInt32(reader.GetOrdinal("is_active")),
                reader.IsDBNull(reader.GetOrdinal("ghi_chu")) ? null : reader.GetString(reader.GetOrdinal("ghi_chu"))
            );
        }

        if (header == null) throw new KeyNotFoundException($"Không tìm thấy dòng định mức #{planId}");

        if (await reader.NextResultAsync(token))
        {
            while (await reader.ReadAsync(token))
            {
                requests.Add(new QuotaUsageHistoryItem(
                    reader.GetInt32(reader.GetOrdinal("RequestId")),
                    reader.GetString(reader.GetOrdinal("RequestCode")),
                    reader.GetInt32(reader.GetOrdinal("RequestLineId")),
                    reader.GetDecimal(reader.GetOrdinal("RequestedQuantity")),
                    reader.IsDBNull(reader.GetOrdinal("Unit")) ? null : reader.GetString(reader.GetOrdinal("Unit")),
                    reader.IsDBNull(reader.GetOrdinal("Requester")) ? null : reader.GetString(reader.GetOrdinal("Requester")),
                    reader.IsDBNull(reader.GetOrdinal("DepartmentCode")) ? null : reader.GetString(reader.GetOrdinal("DepartmentCode")),
                    reader.IsDBNull(reader.GetOrdinal("RequestDate")) ? null : reader.GetDateTime(reader.GetOrdinal("RequestDate")),
                    reader.IsDBNull(reader.GetOrdinal("RequestStatus")) ? null : reader.GetString(reader.GetOrdinal("RequestStatus")),
                    reader.IsDBNull(reader.GetOrdinal("PickingStatus")) ? null : reader.GetString(reader.GetOrdinal("PickingStatus")),
                    reader.IsDBNull(reader.GetOrdinal("IssueDocumentId")) ? null : reader.GetInt32(reader.GetOrdinal("IssueDocumentId")),
                    reader.GetDecimal(reader.GetOrdinal("IssuedQuantity")),
                    reader.IsDBNull(reader.GetOrdinal("Note")) ? null : reader.GetString(reader.GetOrdinal("Note"))
                ));
            }
        }

        return new QuotaUsageHistoryResponse(header, requests);
    }

    public async Task<ThreeWayReconciliationPage> Get3WayReconciliationAsync(
        string userId,
        int? month,
        int? year,
        string? balanceStatus,
        string? search,
        int page,
        int pageSize,
        CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = StoredProcCommand(connection, "api.usp_WMS_PLN03_Get3WayReconciliation_v1", userId);
        command.Parameters.AddWithValue("@Month", (object?)month ?? DBNull.Value);
        command.Parameters.AddWithValue("@Year", (object?)year ?? DBNull.Value);
        command.Parameters.AddWithValue("@BalanceStatus", (object?)balanceStatus ?? DBNull.Value);
        command.Parameters.AddWithValue("@Search", (object?)search ?? DBNull.Value);
        command.Parameters.AddWithValue("@Page", page);
        command.Parameters.AddWithValue("@PageSize", pageSize);

        var items = new List<ThreeWayReconciliationItem>();
        ThreeWayReconciliationKpis kpis = new(0, 0, 0, 0, 0, 0, 0, 0);

        await using var reader = await command.ExecuteReaderAsync(token);
        while (await reader.ReadAsync(token))
        {
            items.Add(new ThreeWayReconciliationItem(
                reader.GetString(reader.GetOrdinal("MaterialId")),
                reader.IsDBNull(reader.GetOrdinal("BravoId")) ? null : reader.GetString(reader.GetOrdinal("BravoId")),
                reader.IsDBNull(reader.GetOrdinal("MaterialName")) ? null : reader.GetString(reader.GetOrdinal("MaterialName")),
                reader.IsDBNull(reader.GetOrdinal("Unit")) ? null : reader.GetString(reader.GetOrdinal("Unit")),
                reader.GetInt32(reader.GetOrdinal("PlanMonth")),
                reader.GetInt32(reader.GetOrdinal("PlanYear")),
                reader.GetDecimal(reader.GetOrdinal("PlannedQuota")),
                reader.GetDecimal(reader.GetOrdinal("RequestedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("IssuedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("RemainingQuota")),
                reader.GetDecimal(reader.GetOrdinal("PoOrderedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("ReceivedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("InTransitQuantity")),
                reader.GetDecimal(reader.GetOrdinal("AvailableInventory")),
                reader.GetDecimal(reader.GetOrdinal("PurchaseRecommendationGap")),
                reader.GetString(reader.GetOrdinal("BalanceStatusCode")),
                reader.GetDecimal(reader.GetOrdinal("SupplyFulfillmentRate")),
                reader.GetDecimal(reader.GetOrdinal("ConsumptionRate"))
            ));
        }

        if (await reader.NextResultAsync(token) && await reader.ReadAsync(token))
        {
            kpis = new ThreeWayReconciliationKpis(
                reader.GetInt32(reader.GetOrdinal("TotalSkuCount")),
                reader.GetDecimal(reader.GetOrdinal("TotalPlannedQuota")),
                reader.GetDecimal(reader.GetOrdinal("TotalIssuedQuantity")),
                reader.GetDecimal(reader.GetOrdinal("TotalPoQuantity")),
                reader.GetDecimal(reader.GetOrdinal("TotalAvailableInventory")),
                reader.GetInt32(reader.GetOrdinal("ShortageCount")),
                reader.GetInt32(reader.GetOrdinal("OverstockCount")),
                reader.GetDecimal(reader.GetOrdinal("TotalPurchaseGap"))
            );
        }

        return new ThreeWayReconciliationPage(items, kpis, page, pageSize);
    }
}
