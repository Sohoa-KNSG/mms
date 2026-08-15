using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.InventoryOperations;

public sealed class InventoryOperationGateway(ISqlConnectionFactory connectionFactory, IOptions<SqlOptions> options)
{
    public async Task<DeclarationCatalog> GetDeclarationCatalogAsync(string userId, string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV04_GetDeclarationCatalog_v1");
        AddUser(command, userId); command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page; command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var items = new List<DeclarationMaterial>();
        while (await reader.ReadAsync(cancellationToken)) items.Add(new DeclarationMaterial(reader.GetRequiredString("MaterialId"),
            reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"), reader.GetNullableString("Unit"), reader.GetRequiredDecimal("CurrentQuantity")));
        var locations = new List<LocationOption>();
        if (await reader.NextResultAsync(cancellationToken)) while (await reader.ReadAsync(cancellationToken)) locations.Add(ReadLocation(reader));
        long total = 0; if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken)) total = reader.GetRequiredInt64("TotalCount");
        return new DeclarationCatalog(items, locations, total, page, pageSize);
    }

    public async Task<DeclareInventoryResult> DeclareInventoryAsync(string userId, DeclareInventoryRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV04_DeclareInventory_v1");
        AddUser(command, userId); command.Parameters.Add("@WarehouseCode", SqlDbType.NVarChar, 50).Value = request.WarehouseCode;
        command.Parameters.Add("@Reason", SqlDbType.NVarChar, 50).Value = request.Reason;
        command.Parameters.Add(new SqlParameter("@Items", SqlDbType.Structured) { TypeName = "api.InventoryDeclarationItem_v1", Value = DeclarationTable(request.Items) });
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) throw new InvalidOperationException("SP INV-04 không trả kết quả.");
        var documentId = reader.GetRequiredInt32("TransactionDocumentId"); var count = reader.GetRequiredInt32("BatchCount");
        var createdAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt")); var batches = new List<DeclaredBatch>();
        if (await reader.NextResultAsync(cancellationToken)) while (await reader.ReadAsync(cancellationToken)) batches.Add(new DeclaredBatch(reader.GetRequiredString("MaterialId"), reader.GetRequiredInt32("BatchId")));
        return new DeclareInventoryResult(documentId, count, createdAt, batches);
    }

    public async Task<SplittableBatchPage> GetSplittableBatchesAsync(string userId, string? search, int? batchId, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV05_GetSplittableBatches_v1");
        AddUser(command, userId); command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@BatchId", SqlDbType.Int).Value = DbValue(batchId); command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize; await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var items = new List<SplittableBatch>(); while (await reader.ReadAsync(cancellationToken)) items.Add(new SplittableBatch(
            reader.GetRequiredInt32("BatchId"), reader.GetNullableInt32("ReceivingLineId"), reader.GetNullableString("WarehouseCode"),
            reader.GetNullableString("MaterialId"), reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"),
            reader.GetRequiredDecimal("Quantity"), reader.GetNullableString("Unit"), reader.GetNullableString("LocationCode"),
            reader.GetNullableString("InventoryStatusCode"), reader.GetRequiredDecimal("TransactionBalance"),
            reader.GetBoolean(reader.GetOrdinal("IsBalanced")), reader.GetNullableDateTime("ChangedAt")));
        long total = 0; if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken)) total = reader.GetRequiredInt64("TotalCount");
        return new SplittableBatchPage(items, total, page, pageSize);
    }

    public async Task<SplitBatchResult> SplitBatchAsync(string userId, int batchId, SplitBatchRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV05_SplitBatch_v1"); AddUser(command, userId);
        command.Parameters.Add("@BatchId", SqlDbType.Int).Value = batchId; command.Parameters.Add(Decimal("@SplitQuantity", request.SplitQuantity));
        command.Parameters.Add(Decimal("@ExpectedQuantity", request.ExpectedQuantity)); await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken)) throw new InvalidOperationException("SP INV-05 không trả kết quả.");
        return new SplitBatchResult(reader.GetRequiredInt32("SourceBatchId"), reader.GetRequiredInt32("NewBatchId"),
            reader.GetRequiredInt32("TransactionDocumentId"), reader.GetRequiredDecimal("SourceQuantity"),
            reader.GetRequiredDecimal("NewQuantity"), reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    public async Task<BatchCountData> GetBatchCountAsync(string userId, int batchId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken); await using var command = CreateCommand(connection, "api.usp_WMS_INV06_GetBatchCount_v1");
        AddUser(command, userId); command.Parameters.Add("@BatchId", SqlDbType.Int).Value = batchId; await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        CountBatchHeader? header = null; if (await reader.ReadAsync(cancellationToken)) header = new CountBatchHeader(reader.GetRequiredInt32("BatchId"),
            reader.GetNullableString("MaterialId"), reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("SystemQuantity"),
            reader.GetNullableString("Unit"), reader.GetNullableString("WarehouseCode"), reader.GetNullableString("LocationCode"), reader.GetNullableString("InventoryStatusCode"), reader.GetNullableDateTime("ChangedAt"));
        var transactions = new List<CountTransaction>(); if (await reader.NextResultAsync(cancellationToken)) while (await reader.ReadAsync(cancellationToken)) transactions.Add(new CountTransaction(
            reader.GetRequiredInt32("TransactionId"), reader.GetNullableInt32("TransactionDocumentId"), reader.GetNullableString("OperationCode"), reader.GetRequiredDecimal("Quantity"), reader.GetNullableString("Unit"), reader.GetNullableDateTime("CreatedAt")));
        return new BatchCountData(header, transactions);
    }

    public Task<CountBatchResult> CountBatchAsync(string userId, int batchId, CountBatchRequest request, CancellationToken cancellationToken) =>
        ExecuteCountAsync("api.usp_WMS_INV06_CountBatch_v1", userId, null, batchId, request.ActualQuantity, request.ExpectedQuantity, request.Reason, cancellationToken);

    public async Task<LocationCountData> GetLocationCountAsync(string userId, string locationCode, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken); await using var command = CreateCommand(connection, "api.usp_WMS_INV07_GetLocationCount_v1");
        AddUser(command, userId); command.Parameters.Add("@LocationCode", SqlDbType.NVarChar, 50).Value = locationCode; await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        LocationCountHeader? location = null; if (await reader.ReadAsync(cancellationToken)) location = new LocationCountHeader(reader.GetRequiredString("LocationCode"), reader.GetNullableString("AreaCode"),
            reader.GetNullableString("ShelfCode"), reader.GetNullableInt32("ColumnNumber"), reader.GetNullableInt32("FloorNumber"), reader.GetNullableInt32("PositionNumber"), reader.GetNullableString("Description"));
        var batches = new List<LocationCountBatch>(); if (await reader.NextResultAsync(cancellationToken)) while (await reader.ReadAsync(cancellationToken)) batches.Add(new LocationCountBatch(
            reader.GetRequiredInt32("BatchId"), reader.GetNullableString("MaterialId"), reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("SystemQuantity"), reader.GetNullableString("Unit"), reader.GetNullableString("LocationCode"), reader.GetNullableDateTime("ChangedAt")));
        return new LocationCountData(location, batches);
    }

    public async Task<CountLocationBatchResult> CountLocationBatchAsync(string userId, string locationCode, int batchId, CountLocationBatchRequest request, CancellationToken cancellationToken)
    {
        var result = await ExecuteCountAsync("api.usp_WMS_INV07_CountLocationBatch_v1", userId, locationCode, batchId, request.ActualQuantity, request.ExpectedQuantity, request.Reason, cancellationToken);
        return new CountLocationBatchResult(locationCode, result.BatchId, result.TransactionDocumentId, result.PreviousQuantity, result.ActualQuantity, result.DifferenceQuantity, result.ChangedAt);
    }

    private async Task<CountBatchResult> ExecuteCountAsync(string procedure, string userId, string? locationCode, int batchId, decimal actual, decimal expected, string reason, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken); await using var command = CreateCommand(connection, procedure); AddUser(command, userId);
        if (locationCode is not null) command.Parameters.Add("@LocationCode", SqlDbType.NVarChar, 50).Value = locationCode;
        command.Parameters.Add("@BatchId", SqlDbType.Int).Value = batchId; command.Parameters.Add(Decimal("@ActualQuantity", actual));
        command.Parameters.Add(Decimal("@ExpectedQuantity", expected)); command.Parameters.Add("@Reason", SqlDbType.NVarChar, 50).Value = reason;
        await using var reader = await command.ExecuteReaderAsync(cancellationToken); if (!await reader.ReadAsync(cancellationToken)) throw new InvalidOperationException("SP kiểm kê không trả kết quả.");
        return new CountBatchResult(reader.GetRequiredInt32("BatchId"), reader.GetRequiredInt32("TransactionDocumentId"), reader.GetRequiredDecimal("PreviousQuantity"),
            reader.GetRequiredDecimal("ActualQuantity"), reader.GetRequiredDecimal("DifferenceQuantity"), reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    private SqlCommand CreateCommand(SqlConnection connection, string procedure) => new(procedure, connection) { CommandType = CommandType.StoredProcedure, CommandTimeout = options.Value.CommandTimeoutSeconds };
    private static void AddUser(SqlCommand command, string userId) => command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;
    private static object DbValue(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();
    private static object DbValue(int? value) => value.HasValue ? value.Value : DBNull.Value;
    private static SqlParameter Decimal(string name, decimal value) => new(name, SqlDbType.Decimal) { Precision = 19, Scale = 4, Value = value };
    private static DataTable DeclarationTable(IReadOnlyList<InventoryDeclarationInput> items) { var table = new DataTable(); table.Columns.Add("MaterialId", typeof(string)); table.Columns.Add("Quantity", typeof(decimal)); table.Columns.Add("Unit", typeof(string)); table.Columns.Add("LocationCode", typeof(string)); foreach (var item in items) table.Rows.Add(item.MaterialId, item.Quantity, DbValue(item.Unit), DbValue(item.LocationCode)); return table; }
    private static LocationOption ReadLocation(SqlDataReader reader) => new(reader.GetRequiredString("LocationCode"), reader.GetNullableString("AreaCode"), reader.GetNullableString("ShelfCode"), reader.GetNullableInt32("ColumnNumber"), reader.GetNullableInt32("FloorNumber"), reader.GetNullableInt32("PositionNumber"), reader.GetNullableString("Description"));
}

