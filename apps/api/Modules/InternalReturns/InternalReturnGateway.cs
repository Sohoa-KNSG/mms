using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.InternalReturns;

public sealed class InternalReturnGateway(ISqlConnectionFactory connectionFactory, IOptions<SqlOptions> options)
{
    public async Task<ReturnCatalog> GetCatalogAsync(string userId, string? search, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_RET01_GetReturnCatalog_v1");
        AddUser(command, userId); command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        await using var reader = await command.ExecuteReaderAsync(token);
        var materials = new List<ReturnMaterial>();
        while (await reader.ReadAsync(token)) materials.Add(new ReturnMaterial(reader.GetRequiredString("MaterialId"),
            reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"), reader.GetNullableString("Unit")));
        var destinations = new List<ReturnDestination>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) destinations.Add(new ReturnDestination(
            reader.GetRequiredString("DestinationBravoCode"), reader.GetNullableString("DestinationName")));
        return new ReturnCatalog(materials, destinations);
    }

    public async Task<CreatedInternalReturn> CreateAsync(string userId, CreateInternalReturn request, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_RET01_CreateInternalReturn_v1");
        AddUser(command, userId);
        command.Parameters.Add("@DestinationBravoCode", SqlDbType.NVarChar, 50).Value = request.DestinationBravoCode;
        command.Parameters.Add("@QualityCode", SqlDbType.NVarChar, 20).Value = request.QualityCode;
        command.Parameters.Add("@ReturnAt", SqlDbType.DateTime).Value = request.ReturnAt;
        command.Parameters.Add("@Note", SqlDbType.NVarChar, -1).Value = DbValue(request.Note);
        command.Parameters.Add(new SqlParameter("@Items", SqlDbType.Structured) { TypeName = "api.InternalReturnItem_v1", Value = ItemTable(request.Items) });
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP RET-01 did not return a result.");
        return new CreatedInternalReturn(reader.GetRequiredInt32("ReturnId"), reader.GetRequiredString("StatusCode"), reader.GetDateTime(reader.GetOrdinal("CreatedAt")));
    }

    public async Task<InternalReturnQueue> GetQueueAsync(string userId, string? search, string? status,
        int page, int pageSize, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_RET01_GetReturnQueue_v1");
        AddUser(command, userId); command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Status", SqlDbType.NVarChar, 20).Value = DbValue(status);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page; command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(token);
        var items = new List<InternalReturnQueueItem>();
        while (await reader.ReadAsync(token)) items.Add(ReadQueue(reader));
        long total = 0;
        if (await reader.NextResultAsync(token) && await reader.ReadAsync(token)) total = reader.GetRequiredInt64("TotalCount");
        return new InternalReturnQueue(items, total, page, pageSize);
    }

    public async Task<InternalReturnDetail?> GetAsync(string userId, int returnId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_RET01_GetInternalReturn_v1");
        AddUser(command, userId); command.Parameters.Add("@ReturnId", SqlDbType.Int).Value = returnId;
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) return null;
        var header = new InternalReturnHeader(reader.GetRequiredInt32("ReturnId"), reader.GetNullableString("WarehouseCode"),
            reader.GetNullableString("DestinationBravoCode"), reader.GetNullableString("DestinationName"), reader.GetNullableString("QualityCode"),
            reader.GetNullableString("WarehouseResultCode"), reader.GetNullableString("Note"), reader.GetNullableString("CreatedBy"),
            reader.GetNullableDateTime("ReturnAt"), reader.GetNullableDateTime("CreatedAt"), reader.GetNullableString("StatusCode"),
            reader.GetNullableString("DepartmentCode"), reader.GetBoolean(reader.GetOrdinal("CanConfirm")));
        var lines = new List<InternalReturnLine>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) lines.Add(new InternalReturnLine(
            reader.GetRequiredInt32("LineId"), reader.GetNullableString("MaterialId"), reader.GetNullableString("BravoId"),
            reader.GetNullableString("MaterialName"), reader.GetNullableString("Unit"), reader.GetRequiredDecimal("Quantity"), reader.GetNullableString("Note")));
        return new InternalReturnDetail(header, lines);
    }

    public async Task<ConfirmedInternalReturn> ConfirmAsync(string userId, int returnId, ConfirmInternalReturn request, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_RET02_ConfirmInternalReturn_v1");
        AddUser(command, userId); command.Parameters.Add("@ReturnId", SqlDbType.Int).Value = returnId;
        command.Parameters.Add("@ResultCode", SqlDbType.Int).Value = request.ResultCode;
        command.Parameters.Add("@Note", SqlDbType.NVarChar, -1).Value = DbValue(request.Note);
        command.Parameters.Add("@BravoDocumentNumber", SqlDbType.NVarChar, 50).Value = DbValue(request.BravoDocumentNumber);
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP RET-02 did not return a result.");
        return new ConfirmedInternalReturn(reader.GetRequiredInt32("ReturnId"), reader.GetRequiredInt32("ResultCode"),
            reader.GetRequiredString("StatusCode"), reader.GetNullableString("WarehouseResultCode"), reader.GetNullableInt32("TransactionDocumentId"),
            reader.GetRequiredInt32("CreatedBatchCount"), reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    public async Task<IReadOnlyList<ReturnDocument>> GetDocumentsAsync(string userId, string? search, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_RET03_GetReturnDocuments_v1");
        AddUser(command, userId); command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        await using var reader = await command.ExecuteReaderAsync(token); var items = new List<ReturnDocument>();
        while (await reader.ReadAsync(token)) items.Add(new ReturnDocument(reader.GetRequiredInt32("TransactionDocumentId"),
            reader.GetNullableInt32("ReturnId"), reader.GetNullableString("DestinationCode"), reader.GetNullableString("DestinationName"),
            reader.GetNullableDateTime("CreatedAt"), reader.GetNullableString("StatusCode"), reader.GetRequiredInt32("BatchCount"), reader.GetRequiredDecimal("TotalQuantity")));
        return items;
    }

    public async Task<IReadOnlyList<ReturnBatch>> GetBatchesAsync(string userId, int documentId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_RET03_GetReturnBatches_v1");
        AddUser(command, userId); command.Parameters.Add("@TransactionDocumentId", SqlDbType.Int).Value = documentId;
        await using var reader = await command.ExecuteReaderAsync(token); var items = new List<ReturnBatch>();
        while (await reader.ReadAsync(token)) items.Add(new ReturnBatch(reader.GetRequiredInt32("TransactionId"), reader.GetRequiredInt32("BatchId"),
            reader.GetNullableString("MaterialId"), reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("Quantity"),
            reader.GetNullableString("Unit"), reader.GetNullableString("InventoryStatusCode"), reader.GetNullableString("LocationCode"),
            reader.GetNullableDateTime("CreatedAt"), reader.GetNullableDateTime("ChangedAt")));
        return items;
    }

    public async Task<SplitReturnBatchResult> SplitAsync(string userId, int documentId, int batchId, SplitReturnBatch request, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_RET03_SplitReturnBatch_v1");
        AddUser(command, userId); command.Parameters.Add("@TransactionDocumentId", SqlDbType.Int).Value = documentId;
        command.Parameters.Add("@BatchId", SqlDbType.Int).Value = batchId;
        AddDecimal(command, "@SplitQuantity", request.SplitQuantity); AddDecimal(command, "@ExpectedQuantity", request.ExpectedQuantity);
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP RET-03 did not return a result.");
        return new SplitReturnBatchResult(reader.GetRequiredInt32("TransactionDocumentId"), reader.GetRequiredInt32("SourceBatchId"),
            reader.GetRequiredInt32("NewBatchId"), reader.GetRequiredDecimal("SourceQuantity"), reader.GetRequiredDecimal("NewQuantity"),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    private SqlCommand Command(SqlConnection connection, string procedure) => new(procedure, connection) { CommandType = CommandType.StoredProcedure, CommandTimeout = options.Value.CommandTimeoutSeconds };
    private static void AddUser(SqlCommand command, string userId) => command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;
    private static void AddDecimal(SqlCommand command, string name, decimal value) => command.Parameters.Add(new SqlParameter(name, SqlDbType.Decimal) { Precision = 19, Scale = 4, Value = value });
    private static object DbValue(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();
    private static InternalReturnQueueItem ReadQueue(SqlDataReader reader) => new(reader.GetRequiredInt32("ReturnId"), reader.GetNullableString("WarehouseCode"),
        reader.GetNullableString("DestinationBravoCode"), reader.GetNullableString("DestinationName"), reader.GetNullableString("QualityCode"),
        reader.GetNullableString("WarehouseResultCode"), reader.GetNullableString("Note"), reader.GetNullableString("CreatedBy"), reader.GetNullableDateTime("ReturnAt"),
        reader.GetNullableDateTime("CreatedAt"), reader.GetNullableString("StatusCode"), reader.GetNullableString("DepartmentCode"), reader.GetRequiredInt32("LineCount"), reader.GetRequiredDecimal("TotalQuantity"));
    private static DataTable ItemTable(IReadOnlyList<InternalReturnItemInput> items)
    {
        var table = new DataTable(); table.Columns.Add("MaterialId", typeof(string)); table.Columns.Add("BravoId", typeof(string));
        table.Columns.Add("MaterialName", typeof(string)); table.Columns.Add("Quantity", typeof(decimal)); table.Columns.Add("Unit", typeof(string)); table.Columns.Add("Note", typeof(string));
        foreach (var item in items) table.Rows.Add(item.MaterialId, DbValue(item.BravoId), DbValue(item.MaterialName), item.Quantity, DbValue(item.Unit), item.Note);
        return table;
    }
}
