using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Contracts;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.ReadModels;

public sealed class ReadGateway(
    ISqlConnectionFactory connectionFactory,
    IOptions<SqlOptions> options)
{
    public async Task<PagedResult<ReceiptLogItem>> GetReceiptLogAsync(
        string userId, string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INB04_GetReceiptLog_v1");
        AddContextAndPaging(command, userId, search, page, pageSize);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<ReceiptLogItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new ReceiptLogItem(
                reader.GetRequiredInt32("HistoryId"),
                reader.GetRequiredString("ReceiptId"),
                reader.GetNullableString("WarehouseCode"),
                reader.GetNullableString("CustomerName"),
                reader.GetNullableString("PurchaseOrder"),
                reader.GetNullableString("StatusCode"),
                reader.GetNullableString("StatusLabel"),
                reader.GetNullableString("ActionType"),
                reader.GetNullableString("ActorName"),
                reader.GetNullableDateTime("AuditTime")));
        }

        var totalCount = await ReadTotalCountAsync(reader, cancellationToken);
        return new PagedResult<ReceiptLogItem>(items, totalCount, page, pageSize);
    }

    public async Task<PagedResult<InventoryBalanceItem>> GetInventoryBalancesAsync(
        string userId, string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV01_GetInventoryBalance_v1");
        AddContextAndPaging(command, userId, search, page, pageSize);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<InventoryBalanceItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new InventoryBalanceItem(
                reader.GetRequiredString("MaterialId"),
                reader.GetNullableString("BravoId"),
                reader.GetNullableString("MaterialName"),
                reader.GetRequiredString("Unit"),
                reader.GetNullableString("WarehouseCode"),
                reader.GetRequiredDecimal("BatchBalance"),
                reader.GetRequiredDecimal("LedgerBalance"),
                reader.GetRequiredDecimal("Variance")));
        }

        var totalCount = await ReadTotalCountAsync(reader, cancellationToken);
        return new PagedResult<InventoryBalanceItem>(items, totalCount, page, pageSize);
    }

    public async Task<BatchHistory?> GetBatchHistoryAsync(
        string userId, int batchId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV02_GetBatchHistory_v1");
        AddUser(command, userId);
        command.Parameters.Add("@BatchId", SqlDbType.Int).Value = batchId;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        var batch = new BatchSnapshot(
            reader.GetRequiredInt32("BatchId"),
            reader.GetRequiredString("MaterialId"),
            reader.GetNullableString("MaterialName"),
            reader.GetRequiredDecimal("Quantity"),
            reader.GetRequiredString("Unit"),
            reader.GetNullableString("WarehouseCode"),
            reader.GetNullableString("LocationCode"),
            reader.GetRequiredString("InventoryStatus"));

        var events = new List<BatchHistoryEvent>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                events.Add(new BatchHistoryEvent(
                    reader.GetRequiredString("EventId"),
                    reader.GetRequiredString("EventType"),
                    reader.GetNullableString("EventName"),
                    reader.GetNullableDecimal("Quantity"),
                    reader.GetNullableString("ActorId"),
                    reader.GetNullableDateTime("OccurredAt"),
                    reader.GetNullableString("Reference")));
            }
        }

        return new BatchHistory(batch, events);
    }

    public async Task<MaterialHistory?> GetMaterialHistoryAsync(
        string userId, string materialId, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV03_GetMaterialHistory_v1");
        AddUser(command, userId);
        command.Parameters.Add("@MaterialId", SqlDbType.NVarChar, 50).Value = materialId;
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        var material = new MaterialSnapshot(
            reader.GetRequiredString("MaterialId"),
            reader.GetNullableString("BravoId"),
            reader.GetNullableString("MaterialName"),
            reader.GetNullableString("Unit"),
            reader.GetRequiredDecimal("CurrentBalance"));

        var items = new List<MaterialHistoryItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                items.Add(new MaterialHistoryItem(
                    reader.GetRequiredInt32("TransactionId"),
                    reader.GetNullableInt32("BatchId"),
                    reader.GetNullableInt32("DocumentId"),
                    reader.GetNullableString("OperationCode"),
                    reader.GetNullableString("OperationName"),
                    reader.GetRequiredDecimal("Quantity"),
                    reader.GetRequiredDecimal("SignedQuantity"),
                    reader.GetNullableDateTime("OccurredAt"),
                    reader.GetNullableString("StatusCode")));
            }
        }

        var totalCount = await ReadTotalCountAsync(reader, cancellationToken);
        return new MaterialHistory(material, items, totalCount);
    }

    public async Task<PagedResult<LocationItem>> GetLocationsAsync(
        string userId, string? area, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_LOC01_GetLocationMap_v1");
        AddUser(command, userId);
        command.Parameters.Add("@AreaCode", SqlDbType.NVarChar, 10).Value = DbValue(area);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        var items = new List<LocationItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new LocationItem(
                reader.GetRequiredString("LocationCode"),
                reader.GetNullableString("AreaCode"),
                reader.GetNullableString("RackCode"),
                reader.GetNullableInt32("ColumnNumber"),
                reader.GetNullableInt32("LevelNumber"),
                reader.GetNullableInt32("PositionNumber"),
                reader.GetNullableString("Description"),
                reader.GetRequiredInt32("BatchCount"),
                reader.GetRequiredDecimal("TotalQuantity")));
        }

        var totalCount = await ReadTotalCountAsync(reader, cancellationToken);
        return new PagedResult<LocationItem>(items, totalCount, page, pageSize);
    }

    public async Task<OperationsSummary> GetOperationsSummaryAsync(
        string userId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_ADM03_GetOperationsSummary_v1");
        AddUser(command, userId);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        if (!await reader.ReadAsync(cancellationToken))
        {
            throw new InvalidOperationException("SP ADM-03 không trả dòng tổng hợp.");
        }

        var generatedAt = reader.GetDateTime(reader.GetOrdinal("GeneratedAt"));
        var inventoryMaterialCount = reader.GetRequiredInt32("InventoryMaterialCount");
        var activeBatchCount = reader.GetRequiredInt32("ActiveBatchCount");
        var unlocatedBatchCount = reader.GetRequiredInt32("UnlocatedBatchCount");
        var receiptCountToday = reader.GetRequiredInt32("ReceiptCountToday");
        var transactionCountToday = reader.GetRequiredInt32("TransactionCountToday");
        var balanceVarianceCount = reader.GetRequiredInt32("BalanceVarianceCount");
        var totalAbsoluteVariance = reader.GetRequiredDecimal("TotalAbsoluteVariance");

        var statusCounts = new List<StatusCount>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                statusCounts.Add(new StatusCount(
                    reader.GetRequiredString("Scope"),
                    reader.GetRequiredString("StatusCode"),
                    reader.GetNullableString("StatusLabel"),
                    reader.GetRequiredInt32("Count")));
            }
        }

        return new OperationsSummary(
            generatedAt,
            inventoryMaterialCount,
            activeBatchCount,
            unlocatedBatchCount,
            receiptCountToday,
            transactionCountToday,
            statusCounts,
            balanceVarianceCount,
            totalAbsoluteVariance);
    }

    private SqlCommand CreateCommand(SqlConnection connection, string procedure) => new(procedure, connection)
    {
        CommandType = CommandType.StoredProcedure,
        CommandTimeout = options.Value.CommandTimeoutSeconds,
    };

    private static void AddUser(SqlCommand command, string userId) =>
        command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;

    private static void AddContextAndPaging(SqlCommand command, string userId, string? search, int page, int pageSize)
    {
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
    }

    private static object DbValue(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();

    private static async Task<long> ReadTotalCountAsync(SqlDataReader reader, CancellationToken cancellationToken)
    {
        if (!await reader.NextResultAsync(cancellationToken) || !await reader.ReadAsync(cancellationToken))
        {
            return 0;
        }

        return reader.GetRequiredInt64("TotalCount");
    }
}

