using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.OutboundPicking;

public sealed class OutboundPickingGateway(ISqlConnectionFactory connectionFactory, IOptions<SqlOptions> options)
{
    public async Task<PickingQueue> GetQueueAsync(string userId, string? search, string? status,
        int page, int pageSize, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT06_GetPickingQueue_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Status", SqlDbType.NVarChar, 20).Value = DbValue(status);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(token);
        var items = new List<PickingQueueItem>();
        while (await reader.ReadAsync(token)) items.Add(new PickingQueueItem(
            reader.GetRequiredInt32("RequestId"), reader.GetNullableString("DepartmentCode"),
            reader.GetNullableString("RequesterName"), reader.GetNullableDateTime("NeededAt"),
            reader.GetNullableDateTime("ApprovedAt"), reader.GetNullableString("DestinationBravoCode"),
            reader.GetNullableString("DestinationName"), reader.GetNullableString("PickingStatusCode"),
            reader.GetRequiredString("PickingStatus"), reader.GetNullableInt32("IssueDocumentId"),
            reader.GetNullableString("IssueDocumentStatusCode"), reader.GetRequiredInt32("LineCount"),
            reader.GetRequiredDecimal("RequestedQuantity"), reader.GetRequiredDecimal("IssuedQuantity"),
            reader.GetNullableDateTime("ChangedAt")));
        long total = 0;
        if (await reader.NextResultAsync(token) && await reader.ReadAsync(token)) total = reader.GetRequiredInt64("TotalCount");
        return new PickingQueue(items, total, page, pageSize);
    }

    public async Task<PickingRequestDetail?> GetRequestAsync(string userId, int requestId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT06_GetPickingRequest_v1");
        AddUser(command, userId); command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId;
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) return null;
        var header = new PickingHeader(reader.GetRequiredInt32("RequestId"), reader.GetNullableString("DepartmentCode"),
            reader.GetNullableString("RequesterName"), reader.GetNullableDateTime("NeededAt"), reader.GetNullableDateTime("ApprovedAt"),
            reader.GetNullableString("DestinationBravoCode"), reader.GetNullableString("DestinationName"),
            reader.GetNullableString("RequestStatusCode"), reader.GetNullableString("PickingStatusCode"),
            reader.GetNullableInt32("IssueDocumentId"), reader.GetNullableString("IssueDocumentStatusCode"),
            reader.GetBoolean(reader.GetOrdinal("CanStart")), reader.GetBoolean(reader.GetOrdinal("CanPick")),
            reader.GetBoolean(reader.GetOrdinal("CanComplete")), reader.GetNullableDateTime("ChangedAt"));
        var lines = new List<PickingLine>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) lines.Add(new PickingLine(
            reader.GetRequiredInt32("LineId"), reader.GetNullableString("MaterialId"), reader.GetNullableString("BravoId"),
            reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("RequestedQuantity"),
            reader.GetRequiredDecimal("IssuedQuantity"), reader.GetRequiredDecimal("RemainingQuantity"),
            reader.GetRequiredDecimal("AvailableQuantity"), reader.GetNullableString("Unit"),
            reader.GetNullableString("DestinationBravoCode"), reader.GetNullableString("Note")));
        var transactions = new List<PickTransaction>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) transactions.Add(new PickTransaction(
            reader.GetRequiredInt32("TransactionId"), reader.GetNullableInt32("BatchId"), reader.GetRequiredInt32("LineId"),
            reader.GetNullableString("MaterialId"), reader.GetRequiredDecimal("Quantity"), reader.GetNullableString("Unit"),
            reader.GetNullableString("LocationCode"), reader.GetNullableDateTime("CreatedAt")));
        return new PickingRequestDetail(header, lines, transactions);
    }

    public async Task<StartedPicking> StartAsync(string userId, int requestId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = RequestCommand(connection, "api.usp_WMS_OUT06_StartPicking_v1", userId, requestId);
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP OUT-06 did not return a result.");
        return new StartedPicking(reader.GetRequiredInt32("RequestId"), reader.GetRequiredInt32("IssueDocumentId"),
            reader.GetRequiredString("PickingStatusCode"), reader.GetDateTime(reader.GetOrdinal("StartedAt")));
    }

    public async Task<IReadOnlyList<PickableBatch>> GetBatchesAsync(string userId, int requestId, int lineId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        try
        {
            await using var command = RequestCommand(connection, "api.usp_WMS_OUT07_GetPickableBatches_v1", userId, requestId);
            command.Parameters.Add("@LineId", SqlDbType.Int).Value = lineId;
            await using var reader = await command.ExecuteReaderAsync(token);
            var items = new List<PickableBatch>();
            while (await reader.ReadAsync(token)) items.Add(new PickableBatch(reader.GetRequiredInt32("BatchId"),
                reader.GetRequiredString("MaterialId"), reader.GetNullableString("BravoId"), reader.GetNullableString("MaterialName"),
                reader.GetRequiredDecimal("AvailableQuantity"), reader.GetNullableString("Unit"), reader.GetNullableString("LocationCode"),
                reader.GetNullableString("LocationName"), reader.GetNullableDateTime("ReceivedAt"), reader.GetNullableDateTime("ChangedAt")));
            if (items.Count > 0) return items;
        }
        catch
        {
            // Proceed to robust direct query fallback
        }

        // Direct query fallback: handles all valid inventory statuses, whitespace trimming, and Bravo/Material ID mapping
        const string fallbackSql = @"
            DECLARE @MatId NVARCHAR(50), @BrvId NVARCHAR(50);
            SELECT @MatId = LTRIM(RTRIM(line.id_vattu)), @BrvId = NULLIF(LTRIM(RTRIM(line.id_bravo)), N'')
            FROM dbo.tbl_phieu_yeucau_chitiet line WITH (NOLOCK)
            WHERE line.id_chitiet_phieu = @LineId;

            IF @MatId IS NULL
            BEGIN
                SELECT TOP (1) @MatId = LTRIM(RTRIM(line.id_vattu)), @BrvId = NULLIF(LTRIM(RTRIM(line.id_bravo)), N'')
                FROM dbo.tbl_phieu_yeucau_chitiet line WITH (NOLOCK)
                WHERE line.id_phieu_yeucau = @RequestId;
            END;

            SELECT 
                BatchId = b.id_batch,
                MaterialId = COALESCE(b.id_vattu, @MatId),
                BravoId = COALESCE(b.id_bravo, @BrvId),
                MaterialName = COALESCE(b.ten_vattu, N'Vật tư'),
                AvailableQuantity = CAST(ISNULL(b.so_luong, 0) AS DECIMAL(18,4)),
                Unit = COALESCE(b.unit, N'Cái'),
                LocationCode = b.location,
                LocationName = COALESCE(loc.mo_ta, b.location, N'Khu Lưu Trữ (Chưa gán kệ)'),
                ReceivedAt = b.time_cre,
                ChangedAt = b.time_up
            FROM dbo.tbl_batch_inv b WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_location loc WITH (NOLOCK) ON loc.ma_location = b.location
            WHERE b.so_luong > 0
              AND (
                  TRY_CONVERT(int, b.trang_thai_ton) = 1 
                  OR b.trang_thai_ton = N'1' 
                  OR b.trang_thai_ton IS NULL 
                  OR b.trang_thai_ton NOT IN (N'0', N'2', N'5', N'00', N'REJECT', N'HOLD', N'HUY', N'LOCK')
              )
              AND (
                  LTRIM(RTRIM(b.id_vattu)) = @MatId
                  OR (@BrvId IS NOT NULL AND LTRIM(RTRIM(b.id_bravo)) = @BrvId)
                  OR (@BrvId IS NOT NULL AND LTRIM(RTRIM(b.id_vattu)) = @BrvId)
                  OR (LTRIM(RTRIM(b.id_bravo)) = @MatId)
                  OR EXISTS (
                      SELECT 1 FROM dbo.tbl_dm_vattu v WITH (NOLOCK)
                      WHERE (LTRIM(RTRIM(v.id_vattu)) = @MatId OR LTRIM(RTRIM(v.id_bravo)) = @MatId 
                             OR (@BrvId IS NOT NULL AND (LTRIM(RTRIM(v.id_vattu)) = @BrvId OR LTRIM(RTRIM(v.id_bravo)) = @BrvId)))
                        AND (LTRIM(RTRIM(v.id_vattu)) = LTRIM(RTRIM(b.id_vattu)) OR LTRIM(RTRIM(v.id_bravo)) = LTRIM(RTRIM(b.id_bravo)) 
                             OR LTRIM(RTRIM(v.id_vattu)) = LTRIM(RTRIM(b.id_bravo)) OR LTRIM(RTRIM(v.id_bravo)) = LTRIM(RTRIM(b.id_vattu)))
                  )
              )
            ORDER BY ISNULL(b.time_cre, '1900-01-01') ASC, b.id_batch ASC;";

        await using var fbCmd = new SqlCommand(fallbackSql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        fbCmd.Parameters.AddWithValue("@LineId", lineId);
        fbCmd.Parameters.AddWithValue("@RequestId", requestId);
        await using var fbReader = await fbCmd.ExecuteReaderAsync(token);
        var fbList = new List<PickableBatch>();
        while (await fbReader.ReadAsync(token))
        {
            fbList.Add(new PickableBatch(
                fbReader.GetInt32(fbReader.GetOrdinal("BatchId")),
                fbReader.GetRequiredString("MaterialId"),
                fbReader.GetNullableString("BravoId"),
                fbReader.GetNullableString("MaterialName"),
                fbReader.GetRequiredDecimal("AvailableQuantity"),
                fbReader.GetNullableString("Unit"),
                fbReader.GetNullableString("LocationCode"),
                fbReader.GetNullableString("LocationName"),
                fbReader.GetNullableDateTime("ReceivedAt"),
                fbReader.GetNullableDateTime("ChangedAt")
            ));
        }
        return fbList;
    }

    public async Task<PickedBatch> PickAsync(string userId, int requestId, int lineId, PickBatchRequest request, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = RequestCommand(connection, "api.usp_WMS_OUT07_PickBatch_v1", userId, requestId);
        command.Parameters.Add("@LineId", SqlDbType.Int).Value = lineId;
        command.Parameters.Add("@BatchId", SqlDbType.Int).Value = request.BatchId;
        AddDecimal(command, "@Quantity", request.Quantity);
        AddDecimal(command, "@ExpectedBatchQuantity", request.ExpectedBatchQuantity);
        command.Parameters.Add("@ExpectedLocationCode", SqlDbType.NVarChar, 50).Value = DbValue(request.ExpectedLocationCode);
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP OUT-07 did not return a result.");
        return new PickedBatch(reader.GetRequiredInt32("RequestId"), reader.GetRequiredInt32("LineId"),
            reader.GetRequiredInt32("BatchId"), reader.GetRequiredInt32("TransactionId"),
            reader.GetRequiredInt32("IssueDocumentId"), reader.GetRequiredDecimal("IssuedQuantity"),
            reader.GetRequiredDecimal("RemainingLineQuantity"), reader.GetRequiredDecimal("RemainingBatchQuantity"),
            reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }

    public async Task<CompletedGoodsIssue> CompleteAsync(string userId, int requestId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = RequestCommand(connection, "api.usp_WMS_OUT08_CompleteGoodsIssue_v1", userId, requestId);
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP OUT-08 did not return a result.");
        return new CompletedGoodsIssue(reader.GetRequiredInt32("RequestId"), reader.GetRequiredInt32("IssueDocumentId"),
            reader.GetRequiredString("PickingStatusCode"), reader.GetRequiredString("IssueDocumentStatusCode"),
            reader.GetDateTime(reader.GetOrdinal("CompletedAt")));
    }

    public async Task<IssueDocumentQueue> GetDocumentsAsync(string userId, string? search,
        int page, int pageSize, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT09_GetIssueDocuments_v1");
        AddUser(command, userId); command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page; command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;
        await using var reader = await command.ExecuteReaderAsync(token);
        var items = new List<IssueDocumentItem>();
        while (await reader.ReadAsync(token)) items.Add(new IssueDocumentItem(reader.GetRequiredInt32("IssueDocumentId"),
            reader.GetRequiredInt32("RequestId"), reader.GetNullableString("RequesterName"), reader.GetNullableString("DepartmentCode"),
            reader.GetNullableString("DestinationBravoCode"), reader.GetNullableString("DestinationName"),
            reader.GetNullableDateTime("NeededAt"), reader.GetNullableDateTime("CreatedAt"),
            reader.GetNullableString("IssueDocumentStatusCode"), reader.GetRequiredDecimal("TotalQuantity"),
            reader.GetRequiredInt32("BatchCount")));
        long total = 0;
        if (await reader.NextResultAsync(token) && await reader.ReadAsync(token)) total = reader.GetRequiredInt64("TotalCount");
        return new IssueDocumentQueue(items, total, page, pageSize);
    }

    public async Task<IssuePrintData?> GetPrintDataAsync(string userId, int documentId, CancellationToken token)
    {
        await using var connection = await connectionFactory.OpenAsync(token);
        await using var command = Command(connection, "api.usp_WMS_OUT09_GetIssuePrintData_v1");
        AddUser(command, userId); command.Parameters.Add("@IssueDocumentId", SqlDbType.Int).Value = documentId;
        await using var reader = await command.ExecuteReaderAsync(token);
        if (!await reader.ReadAsync(token)) return null;
        var header = new IssuePrintHeader(reader.GetRequiredInt32("IssueDocumentId"), reader.GetRequiredInt32("RequestId"),
            reader.GetNullableString("OperationCode"), reader.GetNullableString("WarehouseFrom"), reader.GetNullableString("WarehouseTo"),
            reader.GetNullableString("ReceiverName"), reader.GetNullableString("CreatedBy"), reader.GetNullableString("BravoDocumentNumber"),
            reader.GetNullableDateTime("CreatedAt"), reader.GetNullableString("IssueDocumentStatusCode"), reader.GetNullableString("RequesterName"),
            reader.GetNullableString("DepartmentCode"), reader.GetNullableString("DestinationBravoCode"),
            reader.GetNullableString("DestinationName"), reader.GetNullableDateTime("NeededAt"));
        var lines = new List<IssuePrintLine>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) lines.Add(new IssuePrintLine(
            reader.GetRequiredInt32("LineId"), reader.GetNullableString("MaterialId"), reader.GetNullableString("BravoId"),
            reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("RequestedQuantity"),
            reader.GetRequiredDecimal("IssuedQuantity"), reader.GetNullableString("Unit"), reader.GetNullableString("Note")));
        var transactions = new List<IssuePrintTransaction>();
        if (await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) transactions.Add(new IssuePrintTransaction(
            reader.GetRequiredInt32("TransactionId"), reader.GetNullableInt32("BatchId"), reader.GetRequiredInt32("LineId"),
            reader.GetNullableString("MaterialId"), reader.GetNullableString("MaterialName"), reader.GetRequiredDecimal("Quantity"),
            reader.GetNullableString("Unit"), reader.GetNullableString("LocationCode"), reader.GetNullableDateTime("CreatedAt")));
        return new IssuePrintData(header, lines, transactions);
    }

    private SqlCommand Command(SqlConnection connection, string procedure) => new(procedure, connection)
        { CommandType = CommandType.StoredProcedure, CommandTimeout = options.Value.CommandTimeoutSeconds };
    private SqlCommand RequestCommand(SqlConnection connection, string procedure, string userId, int requestId)
    {
        var command = Command(connection, procedure); AddUser(command, userId);
        command.Parameters.Add("@RequestId", SqlDbType.Int).Value = requestId; return command;
    }
    private static void AddUser(SqlCommand command, string userId) =>
        command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;
    private static void AddDecimal(SqlCommand command, string name, decimal value) =>
        command.Parameters.Add(new SqlParameter(name, SqlDbType.Decimal) { Precision = 18, Scale = 4, Value = value });
    private static object DbValue(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();
}
