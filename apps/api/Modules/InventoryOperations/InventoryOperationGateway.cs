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

    // =========================================================================
    // UC-27 (INV-08): Cycle Count Theo Vật Tư
    // =========================================================================
    public async Task<CreateCycleCountPlanResult> CreateCycleCountPlanAsync(string userId, CreateCycleCountPlanRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_kiemke_tao_kehoach");
        command.Parameters.Add("@id_vattu", SqlDbType.NVarChar, 50).Value = request.MaterialId.Trim();
        command.Parameters.Add(Decimal("@soluong_sosach", request.BookQuantity));
        command.Parameters.Add("@time_batdau", SqlDbType.DateTime2).Value = request.StartedAt ?? DateTime.Now;
        command.Parameters.Add("@user_cre", SqlDbType.NVarChar, 50).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            throw new InvalidOperationException("SP sp_kiemke_tao_kehoach không trả kết quả.");

        var ok = reader.GetBoolean(reader.GetOrdinal("ok"));
        var msg = reader.GetRequiredString("msg");
        var planId = reader.GetNullableInt32("id_kh_kiemke");
        var matId = reader.GetNullableString("id_vattu");
        var sysQty = reader.GetNullableDecimal("soluong_hethong");
        var bookQty = reader.GetNullableDecimal("soluong_sosach");
        var batchCount = reader.GetNullableInt32("so_batch");

        return new CreateCycleCountPlanResult(ok, msg, planId, matId, sysQty, bookQty, batchCount);
    }

    public async Task<IReadOnlyList<CycleCountPlanSummary>> GetCycleCountPlansAsync(string userId, string? search, string? statusCode, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_kiemke_danhsach_kh");
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@TrangThai", SqlDbType.NVarChar, 50).Value = DbValue(statusCode);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var list = new List<CycleCountPlanSummary>();
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new CycleCountPlanSummary(
                reader.GetRequiredInt32("id_kh_kiemke"),
                reader.GetRequiredString("id_vattu"),
                reader.GetNullableString("ten_vattu"),
                reader.GetNullableString("unit"),
                reader.GetRequiredDecimal("soluong_hethong"),
                reader.GetRequiredDecimal("soluong_sosach"),
                reader.GetRequiredDecimal("soluong_thucte"),
                reader.GetRequiredDecimal("ChenhLech"),
                reader.GetNullableDateTime("time_batdau"),
                reader.GetNullableDateTime("time_ketthuc"),
                reader.GetNullableString("ghi_chu"),
                reader.GetNullableString("trang_thai"),
                reader.GetNullableString("user_cre"),
                reader.GetDateTime(reader.GetOrdinal("time_cre")),
                reader.GetNullableString("user_duyet"),
                reader.GetRequiredInt32("SoBatch"),
                reader.GetRequiredInt32("SoLuotDem")
            ));
        }
        return list;
    }

    public async Task<CycleCountPlanDetail> GetCycleCountPlanDetailAsync(string userId, int planId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_kiemke_chitiet_kh");
        command.Parameters.Add("@id_kh_kiemke", SqlDbType.Int).Value = planId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        CycleCountPlanSummary? plan = null;
        if (await reader.ReadAsync(cancellationToken))
        {
            plan = new CycleCountPlanSummary(
                reader.GetRequiredInt32("id_kh_kiemke"),
                reader.GetRequiredString("id_vattu"),
                reader.GetNullableString("ten_vattu"),
                reader.GetNullableString("unit"),
                reader.GetRequiredDecimal("soluong_hethong"),
                reader.GetRequiredDecimal("soluong_sosach"),
                reader.GetRequiredDecimal("soluong_thucte"),
                reader.GetRequiredDecimal("soluong_thucte") - reader.GetRequiredDecimal("soluong_hethong"),
                reader.GetNullableDateTime("time_batdau"),
                reader.GetNullableDateTime("time_ketthuc"),
                reader.GetNullableString("ghi_chu"),
                reader.GetNullableString("trang_thai"),
                reader.GetNullableString("user_cre"),
                reader.GetDateTime(reader.GetOrdinal("time_cre")),
                null, 0, 0
            );
        }

        var batches = new List<CycleCountBatchItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                batches.Add(new CycleCountBatchItem(
                    reader.GetRequiredInt32("id_kiemke"),
                    reader.GetRequiredInt32("id_kh_kiemke"),
                    reader.GetRequiredInt32("id_batch"),
                    reader.GetNullableString("id_bravo"),
                    reader.GetRequiredDecimal("soluong_hethong_batch"),
                    reader.GetNullableString("unit"),
                    reader.GetNullableString("vi_tri"),
                    reader.GetNullableDateTime("batch_time_cre"),
                    reader.GetRequiredDecimal("TongThucTeBatch"),
                    reader.GetRequiredInt32("SoLanDem"),
                    reader.GetInt32(reader.GetOrdinal("DaKiem")) == 1
                ));
            }
        }

        var logs = new List<CycleCountLogItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                logs.Add(new CycleCountLogItem(
                    reader.GetRequiredInt32("id_kiem"),
                    reader.GetRequiredInt32("id_kiemke"),
                    reader.GetRequiredInt32("id_batch"),
                    reader.GetRequiredDecimal("so_luong"),
                    reader.GetNullableString("unit"),
                    reader.GetNullableString("vi_tri"),
                    reader.GetRequiredString("user_cre"),
                    reader.GetDateTime(reader.GetOrdinal("time_cre"))
                ));
            }
        }

        return new CycleCountPlanDetail(plan, batches, logs);
    }

    public async Task<LogCycleCountResult> LogCycleCountAsync(string userId, LogCycleCountRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_wms_log_count_and_split");
        command.Parameters.Add("@id_kiemke", SqlDbType.Int).Value = request.DetailId;
        command.Parameters.Add("@batch_id", SqlDbType.Int).Value = request.BatchId;
        command.Parameters.Add("@actual_quantity", SqlDbType.Float).Value = (double)request.ActualQuantity;
        command.Parameters.Add("@unit", SqlDbType.NVarChar, 50).Value = DbValue(request.Unit);
        command.Parameters.Add("@location_code", SqlDbType.NVarChar, 100).Value = DbValue(request.LocationCode);
        command.Parameters.Add("@user", SqlDbType.NVarChar, 100).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            throw new InvalidOperationException("SP sp_wms_log_count_and_split không trả kết quả.");

        var newBatchId = reader.GetInt32(reader.GetOrdinal("NewBatchId"));

        return new LogCycleCountResult(true, "Ghi nhận thành công", request.DetailId, request.BatchId, request.ActualQuantity, newBatchId);
    }

    public async Task<FinishCycleCountResult> FinishCycleCountAsync(string userId, int planId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_wms_finish_cycle_count");
        command.Parameters.Add("@plan_id", SqlDbType.Int).Value = planId;
        command.Parameters.Add("@user", SqlDbType.NVarChar, 100).Value = userId;

        await command.ExecuteNonQueryAsync(cancellationToken);

        return new FinishCycleCountResult(true, "Kế hoạch kiểm kê đã được đóng và xử lý cặn thành công.");
    }

    public async Task<IReadOnlyList<CycleCountMaterialOption>> GetCycleCountMaterialsAsync(string? search, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        const string sql = @"
            SELECT TOP 200
                v.id_vattu AS MaterialId,
                v.id_bravo AS BravoId,
                v.ten_vattu AS MaterialName,
                v.unit AS Unit,
                v.nhom_vattu AS GroupName,
                CAST(ISNULL((
                    SELECT SUM(b.so_luong)
                    FROM dbo.tbl_batch_inv b
                    WHERE b.id_vattu = v.id_vattu
                      AND b.trang_thai_ton <> N'0'
                      AND b.trang_thai_ton <> N'00'
                      AND b.so_luong <> 0
                ), 0) AS DECIMAL(18,4)) AS SystemQuantity
            FROM dbo.tbl_dm_vattu v
            WHERE (@search IS NULL OR @search = ''
                   OR v.id_vattu LIKE N'%' + @search + N'%'
                   OR v.ten_vattu LIKE N'%' + @search + N'%'
                   OR v.id_bravo LIKE N'%' + @search + N'%')
            ORDER BY SystemQuantity DESC, v.id_vattu ASC;";

        await using var command = new SqlCommand(sql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        command.Parameters.AddWithValue("@search", (object?)search?.Trim() ?? DBNull.Value);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var list = new List<CycleCountMaterialOption>();
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new CycleCountMaterialOption(
                reader.GetRequiredString("MaterialId"),
                reader.GetNullableString("BravoId"),
                reader.GetNullableString("MaterialName"),
                reader.GetNullableString("Unit"),
                reader.GetNullableString("GroupName"),
                reader.GetRequiredDecimal("SystemQuantity")
            ));
        }
        return list;
    }
    // =========================================================================
    // UC-10: Tách Batch & Gia Phả (Genealogy)
    // =========================================================================
    public async Task<SplitBatchV2Result> SplitBatchV2Async(string userId, int batchId, SplitBatchV2Request request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_wms_split_batch");
        command.Parameters.Add("@parent_id_batch", SqlDbType.Int).Value = batchId;
        command.Parameters.Add(Decimal("@split_quantity", request.SplitQuantity));
        command.Parameters.Add("@new_location", SqlDbType.NVarChar, 100).Value = DbValue(request.TargetLocation);
        command.Parameters.Add("@user_id", SqlDbType.NVarChar, 50).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
            throw new InvalidOperationException("SP sp_wms_split_batch không trả kết quả.");

        var ok = reader.GetInt32(reader.GetOrdinal("IsSuccess")) == 1;
        var msg = reader.GetRequiredString("Message");
        var newBatchId = reader.GetNullableInt32("NewBatchId");

        return new SplitBatchV2Result(ok, msg, newBatchId);
    }

    public async Task<IReadOnlyList<BatchGenealogyNode>> GetBatchGenealogyAsync(int batchId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_wms_get_batch_genealogy");
        command.Parameters.Add("@batch_id", SqlDbType.Int).Value = batchId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var list = new List<BatchGenealogyNode>();
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new BatchGenealogyNode(
                reader.GetRequiredInt32("id_batch"),
                reader.GetNullableInt32("parent_id_batch"),
                reader.GetNullableString("id_vattu"),
                reader.GetRequiredDecimal("so_luong"),
                reader.GetDateTime(reader.GetOrdinal("time_cre")),
                reader.GetNullableString("location"),
                reader.GetRequiredInt32("Level")
            ));
        }
        return list;
    }

    public async Task<IReadOnlyList<LocationOption>> GetWarehouseLocationsAsync(string? search, string? areaCode, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        var query = @"
            SELECT 
                ma_location AS LocationCode, 
                ma_khu_vuc AS AreaCode, 
                ma_ke AS ShelfCode, 
                ma_cot AS ColumnNumber, 
                ma_tang AS FloorNumber, 
                vi_tri AS PositionNumber, 
                mo_ta AS Description
            FROM dbo.tbl_dm_location
            WHERE (@Search IS NULL OR ma_location LIKE '%' + @Search + '%' OR mo_ta LIKE '%' + @Search + '%')
              AND (@AreaCode IS NULL OR ma_khu_vuc = @AreaCode)
            ORDER BY ma_khu_vuc, ma_ke, ma_cot, ma_tang, vi_tri";

        await using var command = new SqlCommand(query, connection)
        {
            CommandType = CommandType.Text,
            CommandTimeout = options.Value.CommandTimeoutSeconds
        };
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 100).Value = DbValue(search);
        command.Parameters.Add("@AreaCode", SqlDbType.NVarChar, 50).Value = DbValue(areaCode);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var locations = new List<LocationOption>();
        while (await reader.ReadAsync(cancellationToken))
        {
            locations.Add(ReadLocation(reader));
        }
        return locations;
    }

    public async Task<IReadOnlyList<WarehouseTransactionItem>> GetWarehouseTransactionsAsync(
        string? search, string? operationCode, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        const string sql = @"
            SELECT TOP (@PageSize)
                CAST(t.id_trans AS INT) AS TransactionId,
                CONCAT(N'GD-', FORMAT(ISNULL(t.time_cre, GETDATE()), 'yyyyMMdd'), N'-', RIGHT(CONCAT('0000', t.id_trans), 4)) AS TransactionCode,
                CAST(t.id_batch AS INT) AS BatchId,
                CONVERT(NVARCHAR(100), t.id_batch) AS BatchNumber,
                t.nghiep_vu AS OperationCode,
                COALESCE(o.ten_nghiepvu, t.nghiep_vu, N'Giao dịch kho') AS OperationName,
                COALESCE(o.nhom_nghiepvu, N'Nghiệp vụ kho') AS OperationGroup,
                CAST(ISNULL(TRY_CONVERT(INT, o.logic), CASE WHEN t.so_luong < 0 THEN -1 ELSE 1 END) AS INT) AS Logic,
                t.id_vattu AS MaterialId,
                t.id_bravo AS BravoId,
                COALESCE(t.ten_vattu, v.ten_vattu, N'Vật tư') AS MaterialName,
                CAST(ABS(ISNULL(t.so_luong, 0)) AS DECIMAL(18,4)) AS Quantity,
                COALESCE(t.unit, b.unit, v.unit, N'Đơn vị') AS Unit,
                COALESCE(b.location, N'Kho Tổng') AS LocationCode,
                CONVERT(NVARCHAR(100), t.id_phieu_trans) AS ReferenceDoc,
                COALESCE(p.user_cre, N'Hệ Thống') AS Performer,
                COALESCE(t.trang_thai, N'Hoàn tất') AS Note,
                CAST(ISNULL(t.time_cre, GETDATE()) AS DATETIME) AS CreatedAt
            FROM dbo.tbl_transaction t WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_nghiepvu_kho o WITH (NOLOCK) ON o.ma_nghiepvu = t.nghiep_vu
            LEFT JOIN dbo.tbl_batch_inv b WITH (NOLOCK) ON b.id_batch = t.id_batch
            LEFT JOIN dbo.tbl_dm_vattu v WITH (NOLOCK) ON v.id_vattu = t.id_vattu
            LEFT JOIN dbo.tbl_phieu_transaction p WITH (NOLOCK) ON p.id_phieu_trans = t.id_phieu_trans
            WHERE (@Search IS NULL OR @Search = ''
                   OR t.nghiep_vu LIKE N'%' + @Search + N'%'
                   OR t.id_vattu LIKE N'%' + @Search + N'%'
                   OR t.ten_vattu LIKE N'%' + @Search + N'%'
                   OR CONVERT(NVARCHAR(50), t.id_batch) LIKE N'%' + @Search + N'%'
                   OR CONVERT(NVARCHAR(50), t.id_phieu_trans) LIKE N'%' + @Search + N'%')
              AND (@OperationCode IS NULL OR @OperationCode = '' OR @OperationCode = 'ALL'
                   OR t.nghiep_vu = @OperationCode)
            ORDER BY t.time_cre DESC, t.id_trans DESC;";

        await using var command = new SqlCommand(sql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        command.Parameters.AddWithValue("@Search", (object?)search?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@OperationCode", (object?)operationCode?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@PageSize", pageSize > 0 && pageSize <= 500 ? pageSize : 100);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var list = new List<WarehouseTransactionItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            var logicVal = 1;
            var logicObj = reader["Logic"];
            if (logicObj != null && logicObj != DBNull.Value)
            {
                _ = int.TryParse(logicObj.ToString(), out logicVal);
            }

            var qtyVal = 0m;
            var qtyObj = reader["Quantity"];
            if (qtyObj != null && qtyObj != DBNull.Value)
            {
                _ = decimal.TryParse(qtyObj.ToString(), out qtyVal);
            }

            list.Add(new WarehouseTransactionItem(
                reader.GetInt32(reader.GetOrdinal("TransactionId")),
                reader.GetRequiredString("TransactionCode"),
                reader.GetNullableInt32("BatchId"),
                reader.GetNullableString("BatchNumber"),
                reader.GetNullableString("OperationCode"),
                reader.GetNullableString("OperationName"),
                reader.GetNullableString("OperationGroup"),
                logicVal,
                reader.GetNullableString("MaterialId"),
                reader.GetNullableString("BravoId"),
                reader.GetNullableString("MaterialName"),
                qtyVal,
                reader.GetNullableString("Unit"),
                reader.GetNullableString("LocationCode"),
                reader.GetNullableString("ReferenceDoc"),
                reader.GetNullableString("Performer"),
                reader.GetNullableString("Note"),
                reader.GetDateTime(reader.GetOrdinal("CreatedAt"))
            ));
        }
        return list;
    }

    private SqlCommand CreateCommand(SqlConnection connection, string procedure) => new(procedure, connection) { CommandType = CommandType.StoredProcedure, CommandTimeout = options.Value.CommandTimeoutSeconds };
    private static void AddUser(SqlCommand command, string userId) => command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;
    private static object DbValue(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();
    private static object DbValue(int? value) => value.HasValue ? value.Value : DBNull.Value;
    private static SqlParameter Decimal(string name, decimal value) => new(name, SqlDbType.Decimal) { Precision = 19, Scale = 4, Value = value };
    private static DataTable DeclarationTable(IReadOnlyList<InventoryDeclarationInput> items) { var table = new DataTable(); table.Columns.Add("MaterialId", typeof(string)); table.Columns.Add("Quantity", typeof(decimal)); table.Columns.Add("Unit", typeof(string)); table.Columns.Add("LocationCode", typeof(string)); foreach (var item in items) table.Rows.Add(item.MaterialId, item.Quantity, DbValue(item.Unit), DbValue(item.LocationCode)); return table; }
    private static LocationOption ReadLocation(SqlDataReader reader) => new(reader.GetRequiredString("LocationCode"), reader.GetNullableString("AreaCode"), reader.GetNullableString("ShelfCode"), reader.GetNullableInt32("ColumnNumber"), reader.GetNullableInt32("FloorNumber"), reader.GetNullableInt32("PositionNumber"), reader.GetNullableString("Description"));
}

