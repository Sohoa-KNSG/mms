using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.OutboundRequests;

public sealed class OutboundRequestGateway(ISqlConnectionFactory connectionFactory, IOptions<SqlOptions> options)
{
    public Task<OutboundCatalog> GetPlannedCatalogAsync(string userId, string? planningUnit,
        string? search, int page, int pageSize, CancellationToken token) =>
        GetCatalogAsync("api.usp_WMS_OUT01_GetPlannedCatalog_v1", userId, planningUnit, search, page, pageSize, token);
    public Task<OutboundCatalog> GetUnplannedCatalogAsync(string userId, string? planningUnit,
        string? search, int page, int pageSize, CancellationToken token) =>
        GetCatalogAsync("api.usp_WMS_OUT02_GetUnplannedCatalog_v1", userId, planningUnit, search, page, pageSize, token);
    public Task<OutboundCatalog> GetOverPlanCatalogAsync(string userId, string? planningUnit,
        string? search, int page, int pageSize, CancellationToken token) =>
        GetCatalogAsync("api.usp_WMS_OUT03_GetOverPlanCatalog_v1", userId, planningUnit, search, page, pageSize, token);

    public Task<CreatedOutboundRequest> CreatePlannedAsync(string userId, CreateOutboundRequest request, CancellationToken token) =>
        CreateAsync("api.usp_WMS_OUT01_CreatePlannedRequest_v1", userId, request, token);
    public Task<CreatedOutboundRequest> CreateUnplannedAsync(string userId, CreateOutboundRequest request, CancellationToken token) =>
        CreateAsync("api.usp_WMS_OUT02_CreateUnplannedRequest_v1", userId, request, token);
    public Task<CreatedOutboundRequest> CreateOverPlanAsync(string userId, CreateOutboundRequest request, CancellationToken token) =>
        CreateAsync("api.usp_WMS_OUT03_CreateOverPlanRequest_v1", userId, request, token);

    public async Task<OutboundRequestQueue> GetQueueAsync(string userId, string? search, string? status,
        DateTime? fromDate, DateTime? toDate, int page, int pageSize, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT05_GetRequestQueue_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Status", SqlDbType.NVarChar, 20).Value = DbValue(status);
        command.Parameters.Add("@FromDate", SqlDbType.DateTime).Value = DbValue(fromDate);
        command.Parameters.Add("@ToDate", SqlDbType.DateTime).Value = DbValue(toDate);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(token);
        var items = new List<OutboundRequestQueueItem>();
        while (await reader.ReadAsync(token)) items.Add(ReadQueueItem(reader));
        long total = 0;
        if (await reader.NextResultAsync(token) && await reader.ReadAsync(token)) total = reader.GetRequiredInt64("TotalCount");
        return new OutboundRequestQueue(items, total, page, pageSize);
    }

    public async Task<OutboundRequestDetail?> GetRequestAsync(string userId, int requestId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT04_GetRequest_v1");
        AddUser(command, userId); command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) return null;
        var header = ReadHeader(reader);
        var lines = new List<OutboundRequestLine>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) lines.Add(new OutboundRequestLine(
            reader.GetRequiredInt32("LineId"), reader.GetNullableInt32("PlanId"), reader.GetNullableString("MaterialId"),
            reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("Quantity"),
            reader.GetNullableString("Unit"), reader.GetNullableDateTime("NeededAt"), reader.GetNullableString("Note"),
            reader.GetNullableString("DestinationBravoCode")));
        var approvals = new List<ApprovalHistory>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) approvals.Add(new ApprovalHistory(
            reader.GetRequiredInt32("ApprovalRunId"), reader.GetNullableInt32("ApprovalStep"),
            reader.GetNullableInt32("TotalApprovalSteps"), reader.GetNullableString("ApproverEmployeeCode"),
            reader.GetNullableString("ApproverName"), reader.GetNullableString("ApproverMail"),
            reader.GetNullableString("ApproverRank"), reader.GetNullableString("Decision"),
            reader.GetNullableDateTime("DecidedAt"), reader.GetNullableString("Note")));
        return new OutboundRequestDetail(header, lines, approvals);
    }

    public async Task<ChangedOutboundRequest> SaveAsync(string userId, int requestId, SaveOutboundRequest request, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT04_SaveRequest_v1");
        AddUser(command, userId); command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
        AddRequestHeader(command, request.NeededAt, request.DestinationBravoCode, request.DestinationName);
        command.Parameters.Add("@ExpectedChangedAt", SqlDbType.DateTime).Value = request.ExpectedChangedAt;
        AddItems(command, request.Items);
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP OUT-04 không trả kết quả.");
        return new ChangedOutboundRequest(reader.GetRequiredInt32("RequestId"), reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    public async Task<DecidedOutboundRequest> DecideAsync(string userId, int requestId, DecideOutboundRequest request, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT05_DecideRequest_v1");
        AddUser(command, userId); command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
        command.Parameters.Add("@ApprovalRunId", SqlDbType.Int).Value = request.ApprovalRunId;
        command.Parameters.Add("@Decision", SqlDbType.NVarChar, 20).Value = request.Decision;
        command.Parameters.Add("@Note", SqlDbType.NVarChar, -1).Value = DbValue(request.Note);
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP OUT-05 không trả kết quả duyệt.");
        return new DecidedOutboundRequest(reader.GetRequiredInt32("RequestId"), reader.GetRequiredString("Decision"),
            reader.GetRequiredInt32("DecidedStep"), reader.GetRequiredInt32("TotalApprovalSteps"),
            reader.GetNullableInt32("NextApprovalRunId"), reader.GetBoolean(reader.GetOrdinal("IsFinal")),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    public async Task<ChangedOutboundRequest> CancelAsync(string userId, int requestId, CancelOutboundRequest request, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT05_CancelRequest_v1");
        AddUser(command, userId); command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
        command.Parameters.Add("@Reason", SqlDbType.NVarChar, 255).Value = request.Reason;
        command.Parameters.Add("@ExpectedChangedAt", SqlDbType.DateTime).Value = request.ExpectedChangedAt;
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP OUT-05 không trả kết quả hủy.");
        return new ChangedOutboundRequest(reader.GetRequiredInt32("RequestId"), reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    private async Task<OutboundCatalog> GetCatalogAsync(string procedure, string userId, string? planningUnit,
        string? search, int page, int pageSize, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, procedure); AddUser(command, userId);
        command.Parameters.Add("@PlanningUnit", SqlDbType.NVarChar, 50).Value = DbValue(planningUnit);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(token);
        var items = new List<OutboundCatalogItem>();
        while (await reader.ReadAsync(token)) items.Add(new OutboundCatalogItem(reader.GetNullableInt32("PlanId"),
            reader.GetNullableString("PlanningUnit"), reader.GetRequiredString("MaterialId"), reader.GetNullableString("BravoId"),
            reader.GetNullableString("MaterialName"), reader.GetNullableString("Unit"), reader.GetNullableDecimal("LimitQuantity"),
            reader.GetRequiredDecimal("UsedQuantity"), reader.GetNullableDecimal("RemainingQuantity"),
            reader.GetNullableString("PlanMonth"), reader.GetNullableString("PlanYear"), reader.GetNullableString("Note")));
        var units = new List<PlanningUnitOption>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) units.Add(new PlanningUnitOption(
            reader.GetRequiredString("PlanningUnit"), reader.GetNullableString("PlanningUnitName")));
        var destinations = new List<DestinationOption>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) destinations.Add(new DestinationOption(
            reader.GetNullableString("PlanningUnit"), reader.GetRequiredString("DestinationBravoCode"), reader.GetNullableString("DestinationName")));
        long total = 0;
        if (await reader.NextResultAsync(token) && await reader.ReadAsync(token)) total = reader.GetRequiredInt64("TotalCount");
        return new OutboundCatalog(items, units, destinations, total, page, pageSize);
    }

    private async Task<CreatedOutboundRequest> CreateAsync(string procedure, string userId, CreateOutboundRequest request, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, procedure); AddUser(command, userId);
        command.Parameters.Add("@PlanningUnit", SqlDbType.NVarChar, 50).Value = request.PlanningUnit;
        AddRequestHeader(command, request.NeededAt, request.DestinationBravoCode, request.DestinationName);
        AddItems(command, request.Items);
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP tạo đề nghị không trả kết quả.");
        return new CreatedOutboundRequest(reader.GetRequiredInt32("RequestId"), reader.GetRequiredInt32("FlowId"),
            reader.GetRequiredString("Classification"), reader.GetRequiredInt32("ApprovalRunId"),
            reader.GetRequiredInt32("CurrentApprovalStep"), reader.GetRequiredInt32("TotalApprovalSteps"),
            reader.GetDateTime(reader.GetOrdinal("CreatedAt")));
    }

    private SqlCommand Command(SqlConnection connection, string procedure) => new(procedure, connection)
        { CommandType = CommandType.StoredProcedure, CommandTimeout = options.Value.CommandTimeoutSeconds };
    private static void AddUser(SqlCommand command, string userId) => command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;
    private static void AddRequestHeader(SqlCommand command, DateTime neededAt, string? destinationCode, string? destinationName)
    {
        command.Parameters.Add("@NeededAt", SqlDbType.DateTime).Value = neededAt;
        command.Parameters.Add("@DestinationBravoCode", SqlDbType.NVarChar, 50).Value = DbValue(destinationCode);
        command.Parameters.Add("@DestinationName", SqlDbType.NVarChar, 50).Value = DbValue(destinationName);
    }
    private static void AddItems(SqlCommand command, IReadOnlyList<OutboundRequestItemInput> items) =>
        command.Parameters.Add(new SqlParameter("@Items", SqlDbType.Structured) { TypeName = "api.OutboundRequestItem_v1", Value = ItemTable(items) });
    private static DataTable ItemTable(IReadOnlyList<OutboundRequestItemInput> items)
    {
        var table = new DataTable();
        table.Columns.Add("PlanId", typeof(int)); table.Columns.Add("MaterialId", typeof(string));
        table.Columns.Add("BravoId", typeof(string)); table.Columns.Add("MaterialName", typeof(string));
        table.Columns.Add("Quantity", typeof(decimal)); table.Columns.Add("Unit", typeof(string));
        table.Columns.Add("Note", typeof(string)); table.Columns.Add("DestinationBravoCode", typeof(string));
        foreach (var item in items) table.Rows.Add(DbValue(item.PlanId), item.MaterialId, DbValue(item.BravoId),
            DbValue(item.MaterialName), item.Quantity, DbValue(item.Unit), DbValue(item.Note), DbValue(item.DestinationBravoCode));
        return table;
    }
    private static OutboundRequestHeader ReadHeader(SqlDataReader reader) => new(reader.GetRequiredInt32("RequestId"),
        reader.GetNullableString("DepartmentCode"), reader.GetNullableString("RequesterName"), reader.GetNullableDateTime("CreatedAt"),
        reader.GetNullableDateTime("ChangedAt"), reader.GetNullableInt32("FlowId"), reader.GetNullableString("Classification"),
        reader.GetNullableString("PlanningUnit"), reader.GetNullableDateTime("NeededAt"), reader.GetNullableString("DestinationBravoCode"),
        reader.GetNullableString("DestinationName"), reader.GetNullableString("RequestStatusCode"), reader.GetNullableString("PickingStatusCode"),
        reader.GetRequiredString("ApprovalStatus"), reader.GetNullableInt32("CurrentApprovalStep"), reader.GetNullableInt32("TotalApprovalSteps"),
        reader.GetBoolean(reader.GetOrdinal("CanEdit")), reader.GetBoolean(reader.GetOrdinal("CanCancel")), reader.GetBoolean(reader.GetOrdinal("CanApprove")));
    private static OutboundRequestQueueItem ReadQueueItem(SqlDataReader reader) => new(reader.GetRequiredInt32("RequestId"),
        reader.GetNullableString("DepartmentCode"), reader.GetNullableString("RequesterName"), reader.GetNullableDateTime("CreatedAt"),
        reader.GetNullableDateTime("ChangedAt"), reader.GetNullableInt32("FlowId"), reader.GetNullableString("Classification"),
        reader.GetNullableString("PlanningUnit"), reader.GetNullableDateTime("NeededAt"), reader.GetNullableString("DestinationBravoCode"),
        reader.GetNullableString("DestinationName"), reader.GetNullableString("RequestStatusCode"), reader.GetNullableString("PickingStatusCode"),
        reader.GetRequiredString("ApprovalStatus"), reader.GetNullableInt32("CurrentApprovalStep"), reader.GetNullableInt32("TotalApprovalSteps"),
        reader.GetRequiredInt32("LineCount"), reader.GetRequiredDecimal("TotalQuantity"), reader.GetBoolean(reader.GetOrdinal("CanEdit")),
        reader.GetBoolean(reader.GetOrdinal("CanCancel")), reader.GetBoolean(reader.GetOrdinal("CanApprove")));
    private static object DbValue(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();
    private static object DbValue(int? value) => value.HasValue ? value.Value : DBNull.Value;
    private static object DbValue(DateTime? value) => value.HasValue ? value.Value : DBNull.Value;
}
