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

        // Direct query fallback: matches id_vattu with trang_thai_ton = 1 and so_luong > 0
        const string fallbackSql = @"
            DECLARE @MatId NVARCHAR(50);
            SELECT @MatId = LTRIM(RTRIM(line.id_vattu))
            FROM dbo.tbl_phieu_yeucau_chitiet line WITH (NOLOCK)
            WHERE line.id_chitiet_phieu = @LineId;

            IF @MatId IS NULL
            BEGIN
                SELECT TOP (1) @MatId = LTRIM(RTRIM(line.id_vattu))
                FROM dbo.tbl_phieu_yeucau_chitiet line WITH (NOLOCK)
                WHERE line.id_phieu_yeucau = @RequestId;
            END;

            SELECT 
                BatchId = b.id_batch,
                MaterialId = b.id_vattu,
                BravoId = b.id_bravo,
                MaterialName = b.ten_vattu,
                AvailableQuantity = CAST(ISNULL(b.so_luong, 0) AS DECIMAL(18,4)),
                Unit = b.unit,
                LocationCode = b.location,
                LocationName = COALESCE(loc.mo_ta, b.location, N'Khu Lưu Trữ (Chưa gán kệ)'),
                ReceivedAt = b.time_cre,
                ChangedAt = b.time_up
            FROM dbo.tbl_batch_inv b WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_location loc WITH (NOLOCK) ON loc.ma_location = b.location
            WHERE (b.id_vattu = @MatId OR LTRIM(RTRIM(b.id_vattu)) = @MatId)
              AND (b.trang_thai_ton = 1 OR b.trang_thai_ton = N'1' OR TRY_CONVERT(int, b.trang_thai_ton) = 1)
              AND b.so_luong > 0
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
        try
        {
            await using var command = RequestCommand(connection, "api.usp_WMS_OUT07_PickBatch_v1", userId, requestId);
            command.Parameters.Add("@LineId", SqlDbType.Int).Value = lineId;
            command.Parameters.Add("@BatchId", SqlDbType.Int).Value = request.BatchId;
            AddDecimal(command, "@Quantity", request.Quantity);
            AddDecimal(command, "@ExpectedBatchQuantity", request.ExpectedBatchQuantity);
            command.Parameters.Add("@ExpectedLocationCode", SqlDbType.NVarChar, 50).Value = DbValue(request.ExpectedLocationCode);
            await using var reader = await command.ExecuteReaderAsync(token);
            if (await reader.ReadAsync(token))
            {
                return new PickedBatch(reader.GetRequiredInt32("RequestId"), reader.GetRequiredInt32("LineId"),
                    reader.GetRequiredInt32("BatchId"), reader.GetRequiredInt32("TransactionId"),
                    reader.GetRequiredInt32("IssueDocumentId"), reader.GetRequiredDecimal("IssuedQuantity"),
                    reader.GetRequiredDecimal("RemainingLineQuantity"), reader.GetRequiredDecimal("RemainingBatchQuantity"),
                    reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
            }
        }
        catch
        {
            // Fallback to direct transaction
        }

        // Direct transactional picking fallback
        await using var tx = connection.BeginTransaction();
        try
        {
            var now = DateTime.Now;
            var empCode = userId;

            // 1. Resolve employee code
            const string empSql = "SELECT TOP 1 CONVERT(NVARCHAR(50), msnv) FROM dbo.tbl_dm_user WITH (NOLOCK) WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;";
            await using (var empCmd = new SqlCommand(empSql, connection, tx))
            {
                empCmd.Parameters.AddWithValue("@UserId", userId);
                var empObj = await empCmd.ExecuteScalarAsync(token);
                if (empObj != null && empObj != DBNull.Value) empCode = empObj.ToString()!;
            }

            // 2. Resolve Line & Material
            const string lineSql = @"
                SELECT TOP 1 
                    id_chitiet_phieu = id_chitiet_phieu,
                    id_vattu = LTRIM(RTRIM(id_vattu)),
                    id_bravo = NULLIF(LTRIM(RTRIM(id_bravo)), N''),
                    ten_vattu = ten_vattu,
                    unit = unit,
                    so_luong = CAST(ISNULL(so_luong, 0) AS DECIMAL(18,4))
                FROM dbo.tbl_phieu_yeucau_chitiet WITH (UPDLOCK, HOLDLOCK)
                WHERE id_chitiet_phieu = @LineId OR id_phieu_yeucau = @RequestId;";

            string matId = "", matName = "Vật tư", unit = "Cái", bravoId = "";
            decimal reqQty = 0;
            int realLineId = lineId;

            await using (var lineCmd = new SqlCommand(lineSql, connection, tx))
            {
                lineCmd.Parameters.AddWithValue("@LineId", lineId);
                lineCmd.Parameters.AddWithValue("@RequestId", requestId);
                await using var lineReader = await lineCmd.ExecuteReaderAsync(token);
                if (await lineReader.ReadAsync(token))
                {
                    realLineId = lineReader.GetInt32(lineReader.GetOrdinal("id_chitiet_phieu"));
                    matId = lineReader.GetString(lineReader.GetOrdinal("id_vattu"));
                    bravoId = lineReader.IsDBNull(lineReader.GetOrdinal("id_bravo")) ? "" : lineReader.GetString(lineReader.GetOrdinal("id_bravo"));
                    matName = lineReader.IsDBNull(lineReader.GetOrdinal("ten_vattu")) ? "Vật tư" : lineReader.GetString(lineReader.GetOrdinal("ten_vattu"));
                    unit = lineReader.IsDBNull(lineReader.GetOrdinal("unit")) ? "Cái" : lineReader.GetString(lineReader.GetOrdinal("unit"));
                    reqQty = lineReader.GetDecimal(lineReader.GetOrdinal("so_luong"));
                }
            }

            // 3. Resolve / Create Issue Document
            int issueDocId = 0;
            const string docSql = @"
                SELECT TOP 1 id_phieu_trans FROM dbo.tbl_phieu_transaction WITH (UPDLOCK, HOLDLOCK)
                WHERE ma_yeucau = @RequestId AND nghiep_vu = N'OUT_CON' AND ISNULL(trang_thai_phieu, N'0') <> N'0'
                ORDER BY id_phieu_trans DESC;";
            await using (var docCmd = new SqlCommand(docSql, connection, tx))
            {
                docCmd.Parameters.AddWithValue("@RequestId", requestId);
                var docObj = await docCmd.ExecuteScalarAsync(token);
                if (docObj != null && docObj != DBNull.Value) issueDocId = Convert.ToInt32(docObj);
            }

            if (issueDocId == 0)
            {
                const string createDocSql = @"
                    INSERT dbo.tbl_phieu_transaction
                        (nghiep_vu, ma_kho_from, ma_kho_to, nguoi_nhan, user_cre, time_cre, trang_thai_phieu, ma_yeucau)
                    SELECT N'OUT_CON', N'20020100', LEFT(ma_bravo_bophan, 20), nguoi_lap_phieu, @User, @Now, N'1', @RequestId
                    FROM dbo.tbl_phieu_yeucau WITH (NOLOCK)
                    WHERE id_phieu_yeucau = @RequestId;
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";
                await using var cDocCmd = new SqlCommand(createDocSql, connection, tx);
                cDocCmd.Parameters.AddWithValue("@User", empCode);
                cDocCmd.Parameters.AddWithValue("@Now", now);
                cDocCmd.Parameters.AddWithValue("@RequestId", requestId);
                var newDocObj = await cDocCmd.ExecuteScalarAsync(token);
                issueDocId = Convert.ToInt32(newDocObj);
            }

            // Update status_soanhang = 1
            const string updReqSql = "UPDATE dbo.tbl_phieu_yeucau SET status_soanhang = N'1' WHERE id_phieu_yeucau = @RequestId AND ISNULL(status_soanhang, N'0') = N'0';";
            await using (var updReqCmd = new SqlCommand(updReqSql, connection, tx))
            {
                updReqCmd.Parameters.AddWithValue("@RequestId", requestId);
                await updReqCmd.ExecuteNonQueryAsync(token);
            }

            // 4. Check & Update Batch Inventory
            const string batchSql = @"
                SELECT so_luong = CAST(ISNULL(so_luong, 0) AS DECIMAL(18,4)), id_vattu, id_bravo, ten_vattu, unit
                FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
                WHERE id_batch = @BatchId;";
            decimal batchQty = 0;
            await using (var bCmd = new SqlCommand(batchSql, connection, tx))
            {
                bCmd.Parameters.AddWithValue("@BatchId", request.BatchId);
                await using var bReader = await bCmd.ExecuteReaderAsync(token);
                if (await bReader.ReadAsync(token))
                {
                    batchQty = bReader.GetDecimal(bReader.GetOrdinal("so_luong"));
                }
            }

            if (request.Quantity > batchQty)
            {
                throw new InvalidOperationException($"Số lượng lấy ({request.Quantity}) vượt quá tồn khả dụng của Lô ({batchQty}).");
            }

            // Deduct batch qty (preserve time_cre)
            const string updBatchSql = @"
                UPDATE dbo.tbl_batch_inv
                SET so_luong = CAST(@Remaining AS FLOAT),
                    user_up = LEFT(@User, 20),
                    time_up = @Now,
                    ma_event_up = N'2'
                WHERE id_batch = @BatchId;";
            await using (var uCmd = new SqlCommand(updBatchSql, connection, tx))
            {
                uCmd.Parameters.AddWithValue("@Remaining", batchQty - request.Quantity);
                uCmd.Parameters.AddWithValue("@User", empCode);
                uCmd.Parameters.AddWithValue("@Now", now);
                uCmd.Parameters.AddWithValue("@BatchId", request.BatchId);
                await uCmd.ExecuteNonQueryAsync(token);
            }

            // 5. Insert Transaction & Map
            const string insTransSql = @"
                INSERT dbo.tbl_transaction
                    (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
                VALUES
                    (@BatchId, @DocId, N'OUT_CON', @MatId, @BravoId, LEFT(@MatName, 100), CAST(@Qty AS FLOAT), @Unit, @Now, N'3');
                SELECT CAST(SCOPE_IDENTITY() AS INT);";
            int transId = 0;
            await using (var tCmd = new SqlCommand(insTransSql, connection, tx))
            {
                tCmd.Parameters.AddWithValue("@BatchId", request.BatchId);
                tCmd.Parameters.AddWithValue("@DocId", issueDocId);
                tCmd.Parameters.AddWithValue("@MatId", matId);
                tCmd.Parameters.AddWithValue("@BravoId", (object)bravoId ?? DBNull.Value);
                tCmd.Parameters.AddWithValue("@MatName", matName);
                tCmd.Parameters.AddWithValue("@Qty", request.Quantity);
                tCmd.Parameters.AddWithValue("@Unit", unit);
                tCmd.Parameters.AddWithValue("@Now", now);
                var tObj = await tCmd.ExecuteScalarAsync(token);
                transId = Convert.ToInt32(tObj);
            }

            const string insMapSql = "INSERT dbo.tbl_map_xuatkho (id_trans, id_chitiet_phieu) VALUES (@TransId, @LineId);";
            await using (var mCmd = new SqlCommand(insMapSql, connection, tx))
            {
                mCmd.Parameters.AddWithValue("@TransId", transId);
                mCmd.Parameters.AddWithValue("@LineId", realLineId);
                await mCmd.ExecuteNonQueryAsync(token);
            }

            // 6. Calculate remaining line quantity
            const string sumIssuedSql = @"
                SELECT SUM(ISNULL(t.so_luong, 0))
                FROM dbo.tbl_map_xuatkho m WITH (NOLOCK)
                INNER JOIN dbo.tbl_transaction t WITH (NOLOCK) ON t.id_trans = m.id_trans
                WHERE m.id_chitiet_phieu = @LineId AND t.id_phieu_trans = @DocId AND t.nghiep_vu = N'OUT_CON';";
            decimal totalIssued = 0;
            await using (var sCmd = new SqlCommand(sumIssuedSql, connection, tx))
            {
                sCmd.Parameters.AddWithValue("@LineId", realLineId);
                sCmd.Parameters.AddWithValue("@DocId", issueDocId);
                var sObj = await sCmd.ExecuteScalarAsync(token);
                if (sObj != null && sObj != DBNull.Value) totalIssued = Convert.ToDecimal(sObj);
            }

            await tx.CommitAsync(token);

            return new PickedBatch(
                requestId,
                realLineId,
                request.BatchId,
                transId,
                issueDocId,
                request.Quantity,
                Math.Max(0, reqQty - totalIssued),
                batchQty - request.Quantity,
                now
            );
        }
        catch
        {
            await tx.RollbackAsync(token);
            throw;
        }
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
