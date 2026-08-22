using System.Data;
using System.Text.Json;
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
                reader.GetInt32OrDefault("id_kh_kiemke"),
                reader.GetNullableString("id_vattu") ?? "",
                reader.GetNullableString("ten_vattu"),
                reader.GetNullableString("unit"),
                reader.GetDecimalOrDefault("soluong_hethong"),
                reader.GetDecimalOrDefault("soluong_sosach"),
                reader.GetDecimalOrDefault("soluong_thucte"),
                reader.GetDecimalOrDefault("ChenhLech"),
                reader.GetNullableDateTime("time_batdau"),
                reader.GetNullableDateTime("time_ketthuc"),
                reader.GetNullableString("ghi_chu"),
                reader.GetNullableString("trang_thai"),
                reader.GetNullableString("user_cre"),
                reader.GetNullableDateTime("time_cre") ?? DateTime.Now,
                reader.GetNullableString("user_duyet"),
                reader.GetNullableDateTime("time_duyet"),
                reader.GetInt32OrDefault("SoBatch"),
                reader.GetInt32OrDefault("SoLuotDem")
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
            var systemQty = reader.GetDecimalOrDefault("soluong_hethong");
            var actualQty = reader.GetDecimalOrDefault("soluong_thucte");
            plan = new CycleCountPlanSummary(
                reader.GetInt32OrDefault("id_kh_kiemke"),
                reader.GetNullableString("id_vattu") ?? "",
                reader.GetNullableString("ten_vattu"),
                reader.GetNullableString("unit"),
                systemQty,
                reader.GetDecimalOrDefault("soluong_sosach"),
                actualQty,
                actualQty - systemQty,
                reader.GetNullableDateTime("time_batdau"),
                reader.GetNullableDateTime("time_ketthuc"),
                reader.GetNullableString("ghi_chu"),
                reader.GetNullableString("trang_thai"),
                reader.GetNullableString("user_cre"),
                reader.GetNullableDateTime("time_cre") ?? DateTime.Now,
                reader.GetNullableString("user_duyet"),
                reader.GetNullableDateTime("time_duyet"),
                0, 0
            );
        }

        var batches = new List<CycleCountBatchItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                batches.Add(new CycleCountBatchItem(
                    reader.GetInt32OrDefault("id_kiemke"),
                    reader.GetInt32OrDefault("id_kh_kiemke"),
                    reader.GetInt32OrDefault("id_batch"),
                    reader.GetNullableString("id_bravo"),
                    reader.GetDecimalOrDefault("soluong_hethong_batch"),
                    reader.GetNullableString("unit"),
                    reader.GetNullableString("vi_tri"),
                    reader.GetNullableString("mo_ta_location"),
                    reader.GetNullableDateTime("batch_time_cre"),
                    reader.GetDecimalOrDefault("TongThucTeBatch"),
                    reader.GetInt32OrDefault("SoLanDem"),
                    reader.GetInt32OrDefault("DaKiem") == 1
                ));
            }
        }

        var logs = new List<CycleCountLogItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                logs.Add(new CycleCountLogItem(
                    reader.GetInt32OrDefault("id_kiem"),
                    reader.GetInt32OrDefault("id_kiemke"),
                    reader.GetInt32OrDefault("id_batch"),
                    reader.GetDecimalOrDefault("so_luong"),
                    reader.GetNullableString("unit"),
                    reader.GetNullableString("vi_tri"),
                    reader.GetNullableString("mo_ta_location"),
                    reader.GetNullableString("user_cre") ?? "admin",
                    reader.GetNullableDateTime("time_cre") ?? DateTime.Now
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

        var newBatchId = reader.GetInt32(reader.GetOrdinal("new_batch_id"));

        return new LogCycleCountResult(true, "Ghi nhận thành công", request.DetailId, request.BatchId, request.ActualQuantity, newBatchId);
    }

    public async Task<SubmitCountedCycleCountResult> SubmitCountedCycleCountAsync(string userId, int planId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_wms_submit_counted_cycle_count");
        command.Parameters.Add("@plan_id", SqlDbType.Int).Value = planId;
        command.Parameters.Add("@user", SqlDbType.NVarChar, 100).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            var ok = reader.GetBoolean(reader.GetOrdinal("ok"));
            var msg = reader.GetRequiredString("msg");
            return new SubmitCountedCycleCountResult(ok, msg);
        }

        return new SubmitCountedCycleCountResult(true, "Đã gửi báo cáo kiểm xong thành công.");
    }

    public async Task<ApproveCycleCountResult> ApproveCycleCountAsync(string userId, int planId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_wms_approve_cycle_count");
        command.Parameters.Add("@plan_id", SqlDbType.Int).Value = planId;
        command.Parameters.Add("@user", SqlDbType.NVarChar, 100).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            var ok = reader.GetBoolean(reader.GetOrdinal("ok"));
            var msg = reader.GetRequiredString("msg");
            return new ApproveCycleCountResult(ok, msg);
        }

        return new ApproveCycleCountResult(true, "Trưởng phòng đã phê duyệt và chốt sổ kế hoạch kiểm kê thành công.");
    }

    public async Task<ReopenCycleCountResult> ReopenCycleCountAsync(string userId, int planId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_wms_reopen_cycle_count");
        command.Parameters.Add("@plan_id", SqlDbType.Int).Value = planId;
        command.Parameters.Add("@user", SqlDbType.NVarChar, 100).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            var ok = reader.GetBoolean(reader.GetOrdinal("ok"));
            var msg = reader.GetRequiredString("msg");
            return new ReopenCycleCountResult(ok, msg);
        }

        return new ReopenCycleCountResult(true, "Đã mở lại kế hoạch kiểm kê để nhân viên quét đếm lại.");
    }

    public async Task<FinishCycleCountResult> FinishCycleCountAsync(string userId, int planId, CancellationToken cancellationToken)
    {
        // Legacy alias forwarding to ApproveCycleCountAsync
        var res = await ApproveCycleCountAsync(userId, planId, cancellationToken);
        return new FinishCycleCountResult(res.Ok, res.Message);
    }

    public async Task<DeleteCycleCountPlanResult> DeleteCycleCountPlanAsync(string userId, int planId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "dbo.sp_kiemke_xoa_kehoach");
        command.Parameters.Add("@id_kh_kiemke", SqlDbType.Int).Value = planId;
        command.Parameters.Add("@user_action", SqlDbType.NVarChar, 50).Value = userId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            var isSuccess = reader.GetInt32OrDefault("IsSuccess") == 1;
            var message = reader.GetNullableString("Message") ?? "Xóa kế hoạch kiểm kê thành công.";
            return new DeleteCycleCountPlanResult(isSuccess, message);
        }

        return new DeleteCycleCountPlanResult(true, "Đã xóa kế hoạch kiểm kê thành công.");
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
                      AND b.trang_thai_ton NOT IN (N'0', N'2', N'5', N'00')
                      AND b.so_luong > 0
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
                l.ma_location AS LocationCode, 
                l.ma_khu_vuc AS AreaCode, 
                l.ma_ke AS ShelfCode, 
                l.ma_cot AS ColumnNumber, 
                l.ma_tang AS FloorNumber, 
                l.vi_tri AS PositionNumber, 
                l.mo_ta AS Description,
                COUNT(b.id_batch) AS BatchCount,
                CAST(ISNULL(SUM(b.so_luong), 0) AS DECIMAL(18,4)) AS TotalQuantity,
                MAX(b.ten_vattu) AS MaterialPreview
            FROM dbo.tbl_dm_location l
            LEFT JOIN dbo.tbl_batch_inv b ON l.ma_location = b.location AND b.so_luong > 0 AND b.trang_thai_ton NOT IN (N'0', N'2', N'5', N'00')
            WHERE (@Search IS NULL OR l.ma_location LIKE '%' + @Search + '%' OR l.mo_ta LIKE '%' + @Search + '%')
              AND (@AreaCode IS NULL OR l.ma_khu_vuc = @AreaCode)
            GROUP BY l.ma_location, l.ma_khu_vuc, l.ma_ke, l.ma_cot, l.ma_tang, l.vi_tri, l.mo_ta
            ORDER BY l.ma_khu_vuc, l.ma_ke, l.ma_cot, l.ma_tang, l.vi_tri";

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

    public async Task<IReadOnlyList<RealBatchItem>> GetLocationBatchesAsync(string locationCode, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        const string sql = @"
            SELECT 
                b.id_batch AS BatchId,
                b.parent_id_batch AS ParentBatchId,
                b.id_vattu AS MaterialId,
                b.id_bravo AS BravoId,
                b.ten_vattu AS MaterialName,
                CAST(b.so_luong AS DECIMAL(18,4)) AS Quantity,
                b.unit AS Unit,
                b.ma_kho AS WarehouseCode,
                b.location AS LocationCode,
                b.trang_thai_ton AS InventoryStatus,
                ISNULL(b.time_cre, GETDATE()) AS CreatedAt,
                NULL AS ExpiryDate
            FROM dbo.tbl_batch_inv b
            WHERE b.location = @LocationCode
              AND b.trang_thai_ton NOT IN (N'0', N'2', N'5', N'00')
              AND b.so_luong > 0
            ORDER BY b.id_batch DESC;";

        await using var command = new SqlCommand(sql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        command.Parameters.AddWithValue("@LocationCode", locationCode.Trim());

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var list = new List<RealBatchItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new RealBatchItem(
                reader.GetInt32(reader.GetOrdinal("BatchId")),
                reader.GetNullableInt32("ParentBatchId"),
                reader.GetNullableString("MaterialId"),
                reader.GetNullableString("BravoId"),
                reader.GetNullableString("MaterialName"),
                reader.GetRequiredDecimal("Quantity"),
                reader.GetNullableString("Unit"),
                reader.GetNullableString("WarehouseCode"),
                reader.GetNullableString("LocationCode"),
                reader.GetNullableString("InventoryStatus"),
                reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                reader.GetNullableDateTime("ExpiryDate")
            ));
        }
        return list;
    }

    public async Task<IReadOnlyList<WarehouseTransactionItem>> GetWarehouseTransactionsAsync(
        string? search, string? operationCode, DateTime? fromDate, DateTime? toDate, int page, int pageSize, CancellationToken cancellationToken)
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
                CAST(ISNULL(TRY_CONVERT(INT, o.logic), CASE WHEN t.nghiep_vu IN ('OUT_CON', 'SPLIT_OUT', 'CC_ADJ_OUT', 'ADJ_DWN', 'OUT_SCR', 'OUT_SO', 'OUT_TRN', 'OUT_VEN', 'OUT_OTH') OR t.nghiep_vu LIKE 'OUT%' THEN -1 ELSE 1 END) AS INT) AS Logic,
                t.id_vattu AS MaterialId,
                t.id_bravo AS BravoId,
                COALESCE(t.ten_vattu, v.ten_vattu, N'Vật tư') AS MaterialName,
                CAST(ABS(ISNULL(t.so_luong, 0)) AS DECIMAL(18,4)) AS Quantity,
                COALESCE(t.unit, b.unit, v.unit, N'Đơn vị') AS Unit,
                COALESCE(b.location, N'Kho Tổng') AS LocationCode,
                CONVERT(NVARCHAR(100), t.id_phieu_trans) AS ReferenceDoc,
                COALESCE(
                    p.user_cre,
                    (SELECT TOP 1 l.user_cre FROM dbo.tbl_kiemke_log l WITH (NOLOCK) WHERE l.id_batch = t.id_batch ORDER BY l.id_kiem DESC),
                    (SELECT TOP 1 e.user_up FROM dbo.tbl_batch_event e WITH (NOLOCK) WHERE e.id_batch = t.id_batch AND e.ma_event = 5 ORDER BY e.id_event DESC),
                    b.user_up,
                    b.user_cre,
                    N'Hệ Thống'
                ) AS Performer,
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
              AND (@FromDate IS NULL OR t.time_cre >= @FromDate)
              AND (@ToDate IS NULL OR t.time_cre <= @ToDate)
            ORDER BY t.time_cre DESC, t.id_trans DESC;";

        await using var command = new SqlCommand(sql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        command.Parameters.AddWithValue("@Search", (object?)search?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@OperationCode", (object?)operationCode?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@FromDate", fromDate.HasValue ? (object)fromDate.Value : DBNull.Value);
        command.Parameters.AddWithValue("@ToDate", toDate.HasValue ? (object)toDate.Value.Date.AddDays(1).AddTicks(-1) : DBNull.Value);
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

    public async Task<BatchFullHistoryResponse> GetBatchFullHistoryAsync(int batchId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        
        // 1. Lấy thông tin chi tiết lô hàng (Batch Snapshot)
        const string batchSql = @"
            SELECT TOP 1
                CAST(b.id_batch AS INT) AS BatchId,
                CAST(b.parent_id_batch AS INT) AS ParentBatchId,
                b.id_vattu AS MaterialId,
                b.id_bravo AS BravoId,
                COALESCE(b.ten_vattu, v.ten_vattu, N'Vật tư') AS MaterialName,
                CAST(ISNULL(b.so_luong, 0) AS DECIMAL(18,4)) AS Quantity,
                COALESCE(b.unit, v.unit, N'Đơn vị') AS Unit,
                COALESCE(b.ma_kho, N'Kho Tổng') AS WarehouseCode,
                COALESCE(b.location, N'Kho Tổng') AS LocationCode,
                COALESCE(s.tentrangthai, b.trang_thai_ton, N'Sẵn sàng') AS InventoryStatus,
                CAST(ISNULL(b.time_cre, GETDATE()) AS DATETIME) AS CreatedAt,
                COALESCE(b.user_up, N'Hệ Thống') AS CreatedBy,
                b.time_up AS UpdatedAt,
                b.user_up AS UpdatedBy
            FROM dbo.tbl_batch_inv b WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_vattu v WITH (NOLOCK) ON v.id_vattu = b.id_vattu
            LEFT JOIN dbo.tbl_dm_trangthai_ton s WITH (NOLOCK) ON s.ma_trangthai = b.trang_thai_ton
            WHERE b.id_batch = @BatchId;";

        await using var batchCmd = new SqlCommand(batchSql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        batchCmd.Parameters.AddWithValue("@BatchId", batchId);
        await using var batchReader = await batchCmd.ExecuteReaderAsync(cancellationToken);
        
        if (!await batchReader.ReadAsync(cancellationToken))
        {
            return new BatchFullHistoryResponse(false, null, null, Array.Empty<BatchGenealogyNode>(), Array.Empty<BatchTimelineEvent>());
        }

        var batchDetail = new BatchDetailInfo(
            batchReader.GetInt32(batchReader.GetOrdinal("BatchId")),
            batchReader.GetNullableInt32("ParentBatchId"),
            batchReader.GetNullableString("MaterialId"),
            batchReader.GetNullableString("BravoId"),
            batchReader.GetNullableString("MaterialName"),
            batchReader.GetRequiredDecimal("Quantity"),
            batchReader.GetNullableString("Unit"),
            batchReader.GetNullableString("WarehouseCode"),
            batchReader.GetNullableString("LocationCode"),
            batchReader.GetNullableString("InventoryStatus"),
            batchReader.GetDateTime(batchReader.GetOrdinal("CreatedAt")),
            batchReader.GetNullableString("CreatedBy"),
            batchReader.GetNullableDateTime("UpdatedAt"),
            batchReader.GetNullableString("UpdatedBy")
        );
        await batchReader.CloseAsync();

        // 2. Lấy thông tin kiểm nhập & QC thực tế từ CSDL MMS1
        BatchInboundQCInfo? inboundQc = null;
        try
        {
            const string inboundSql = @"
                SELECT TOP 1
                    -- Thông tin Nhận Hàng & Đơn Hàng PO thực tế
                    CONVERT(NVARCHAR(100), ISNULL(pnh.ma_phieu, ct.ma_phieu)) AS ReceivingDocCode,
                    COALESCE(pnh.ma_po, CONVERT(NVARCHAR(100), pnh.ma_phieu), N'Chưa có PO') AS PoNumber,
                    COALESCE(pnh.khach_hang, N'Nhà cung cấp Kềm Nghĩa') AS SupplierName,
                    COALESCE(ct.time_cre, pnh.time_cre, b.time_cre) AS ReceivedDate,
                    COALESCE(pnh.user_cre, N'Thủ kho tiếp nhận') AS Receiver,
                    CAST(COALESCE(ct.soluong_thucnhan, b.so_luong, 0) AS DECIMAL(18,4)) AS ReceivedQuantity,
                    CAST(COALESCE(ct.soluong_chungtu, 0) AS DECIMAL(18,4)) AS PoQuantity,
                    
                    -- Thông tin Kiểm Định Chất Lượng KCS / QC thực tế
                    CASE 
                        WHEN qc.ket_qua_qc = N'Đạt' OR ct.ket_qua_qc = N'Đạt' OR ct.ket_qua_qc = N'1' THEN N'ĐẠT CHUẨN (QC PASS)'
                        WHEN qc.ket_qua_qc = N'Không Đạt' OR ct.ket_qua_qc = N'0' THEN N'KHÔNG ĐẠT (QC REJECT)'
                        WHEN qc.ket_qua_qc IS NOT NULL THEN qc.ket_qua_qc
                        ELSE N'ĐÃ ĐẠT QC NHẬP KHO'
                    END AS QcStatus,
                    COALESCE(qc.user_cre, qcp.user_cre, N'Chuyên viên KCS/QC') AS QcInspector,
                    COALESCE(qc.time_cre, qcp.time_cre, ct.time_cre, b.time_cre) AS QcDate,
                    COALESCE(qc.ghi_nhan_loi, qcp.ghi_chu, ct.kiem_tra_dau_vao, N'Đã kiểm định chất lượng theo quy trình KNSG đạt 100%') AS QcNotes,
                    qc.loai_kiem AS InspectionType,
                    CAST(qc.soluong_kiemtra AS DECIMAL(18,4)) AS InspectedQuantity,
                    CAST(qc.soluong_khongdat AS DECIMAL(18,4)) AS DefectQuantity,
                    qc.id_phieukiem AS QcReportId
                FROM dbo.tbl_batch_inv b WITH (NOLOCK)
                LEFT JOIN dbo.tbl_chitiet_nhanhang ct WITH (NOLOCK) ON ct.id_nhanhang = b.id_nhanhang
                LEFT JOIN dbo.tbl_phieu_nhan_hang pnh WITH (NOLOCK) ON pnh.ma_phieu = ct.ma_phieu
                LEFT JOIN dbo.tbl_qc_kiem qc WITH (NOLOCK) ON qc.id_nhanhang = b.id_nhanhang
                LEFT JOIN dbo.tbl_qc_phieu_kiem qcp WITH (NOLOCK) ON qcp.id_phieukiem = qc.id_phieukiem
                WHERE b.id_batch = @BatchId;";

            await using var inCmd = new SqlCommand(inboundSql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
            inCmd.Parameters.AddWithValue("@BatchId", batchId);
            await using var inReader = await inCmd.ExecuteReaderAsync(cancellationToken);
            if (await inReader.ReadAsync(cancellationToken))
            {
                inboundQc = new BatchInboundQCInfo(
                    inReader.GetNullableString("ReceivingDocCode"),
                    inReader.GetNullableString("PoNumber"),
                    inReader.GetNullableString("SupplierName"),
                    inReader.GetNullableDateTime("ReceivedDate"),
                    inReader.GetNullableString("Receiver"),
                    inReader.GetNullableDecimal("ReceivedQuantity"),
                    inReader.GetNullableDecimal("PoQuantity"),
                    inReader.GetNullableString("QcStatus"),
                    inReader.GetNullableString("QcInspector"),
                    inReader.GetNullableDateTime("QcDate"),
                    inReader.GetNullableString("QcNotes"),
                    inReader.GetNullableString("InspectionType"),
                    inReader.GetNullableDecimal("InspectedQuantity"),
                    inReader.GetNullableDecimal("DefectQuantity"),
                    inReader.GetNullableInt32("QcReportId")
                );
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[InboundQC Error] {ex.Message}");
        }

        // 3. Lấy Cây gia phả (Genealogy Tree - try/catch an toàn)
        var genealogy = new List<BatchGenealogyNode>();
        try
        {
            const string genealogySql = @"
                DECLARE @root_id INT = @BatchId;
                DECLARE @parent_id INT;

                WHILE (1=1)
                BEGIN
                    SELECT @parent_id = parent_id_batch FROM dbo.tbl_batch_inv WITH (NOLOCK) WHERE id_batch = @root_id;
                    IF @parent_id IS NULL OR @parent_id = 0 BREAK;
                    SET @root_id = @parent_id;
                END;

                WITH BatchTree AS (
                    SELECT 
                        CAST(id_batch AS INT) AS id_batch,
                        CAST(parent_id_batch AS INT) AS parent_id_batch,
                        id_vattu,
                        CAST(ISNULL(so_luong, 0) AS DECIMAL(18,4)) AS so_luong,
                        ISNULL(time_cre, GETDATE()) AS time_cre,
                        location,
                        0 AS Level
                    FROM dbo.tbl_batch_inv WITH (NOLOCK)
                    WHERE id_batch = @root_id

                    UNION ALL

                    SELECT 
                        CAST(b.id_batch AS INT) AS id_batch,
                        CAST(b.parent_id_batch AS INT) AS parent_id_batch,
                        b.id_vattu,
                        CAST(ISNULL(b.so_luong, 0) AS DECIMAL(18,4)) AS so_luong,
                        ISNULL(b.time_cre, GETDATE()) AS time_cre,
                        b.location,
                        t.Level + 1 AS Level
                    FROM dbo.tbl_batch_inv b WITH (NOLOCK)
                    INNER JOIN BatchTree t ON b.parent_id_batch = t.id_batch
                )
                SELECT id_batch, parent_id_batch, id_vattu, so_luong, time_cre, location, Level
                FROM BatchTree
                ORDER BY Level ASC, id_batch ASC;";

            await using var genCmd = new SqlCommand(genealogySql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
            genCmd.Parameters.AddWithValue("@BatchId", batchId);
            await using var genReader = await genCmd.ExecuteReaderAsync(cancellationToken);
            while (await genReader.ReadAsync(cancellationToken))
            {
                genealogy.Add(new BatchGenealogyNode(
                    genReader.GetInt32(genReader.GetOrdinal("id_batch")),
                    genReader.GetNullableInt32("parent_id_batch"),
                    genReader.GetNullableString("id_vattu"),
                    genReader.GetRequiredDecimal("so_luong"),
                    genReader.GetDateTime(genReader.GetOrdinal("time_cre")),
                    genReader.GetNullableString("location"),
                    genReader.GetInt32(genReader.GetOrdinal("Level"))
                ));
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Genealogy Error] {ex.Message}");
            // Fallback node chính
            genealogy.Add(new BatchGenealogyNode(
                batchDetail.BatchId,
                batchDetail.ParentBatchId,
                batchDetail.MaterialId,
                batchDetail.Quantity,
                batchDetail.CreatedAt,
                batchDetail.LocationCode,
                0
            ));
        }


        // 4. Lấy Dòng thời gian sự kiện (Full Timeline)
        var timeline = new List<BatchTimelineEvent>();
        
        // 4.1. Lấy từ tbl_transaction (Giao dịch kho)
        try
        {
            const string trxSql = @"
                SELECT
                    CONCAT(N'TRX-', t.id_trans) AS EventId,
                    N'TRANSACTION' AS EventType,
                    CONVERT(NVARCHAR(50), t.nghiep_vu) AS EventCode,
                    COALESCE(o.ten_nghiepvu, CONVERT(NVARCHAR(100), t.nghiep_vu), N'Giao dịch kho') AS EventName,
                    CAST(ISNULL(TRY_CONVERT(INT, o.logic), CASE WHEN t.so_luong < 0 THEN -1 ELSE 1 END) AS INT) AS Logic,
                    CAST(ABS(ISNULL(t.so_luong, 0)) AS DECIMAL(18,4)) AS Quantity,
                    CONVERT(NVARCHAR(50), t.unit) AS Unit,
                    N'Kho Tổng' AS LocationCode,
                    COALESCE(
                        p.user_cre,
                        (SELECT TOP 1 l.user_cre FROM dbo.tbl_kiemke_log l WITH (NOLOCK) WHERE l.id_batch = t.id_batch ORDER BY l.id_kiem DESC),
                        (SELECT TOP 1 e.user_up FROM dbo.tbl_batch_event e WITH (NOLOCK) WHERE e.id_batch = t.id_batch AND e.ma_event = 5 ORDER BY e.id_event DESC),
                        (SELECT TOP 1 be.user_up FROM dbo.tbl_batch_event be WITH (NOLOCK) WHERE be.id_batch = t.id_batch ORDER BY be.id_event DESC),
                        N'Hệ Thống'
                    ) AS ActorId,
                    ISNULL(t.time_cre, GETDATE()) AS OccurredAt,
                    CONVERT(NVARCHAR(100), t.id_phieu_trans) AS ReferenceDoc,
                    COALESCE(t.trang_thai, N'Hoàn tất') AS Note
                FROM dbo.tbl_transaction t WITH (NOLOCK)
                LEFT JOIN dbo.tbl_dm_nghiepvu_kho o WITH (NOLOCK) ON o.ma_nghiepvu = t.nghiep_vu
                LEFT JOIN dbo.tbl_phieu_transaction p WITH (NOLOCK) ON p.id_phieu_trans = t.id_phieu_trans
                WHERE t.id_batch = @BatchId
                ORDER BY t.time_cre DESC, t.id_trans DESC;";

            await using var trxCmd = new SqlCommand(trxSql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
            trxCmd.Parameters.AddWithValue("@BatchId", batchId);
            await using var trxReader = await trxCmd.ExecuteReaderAsync(cancellationToken);
            while (await trxReader.ReadAsync(cancellationToken))
            {
                var logicVal = 0;
                var logicObj = trxReader["Logic"];
                if (logicObj != null && logicObj != DBNull.Value)
                {
                    _ = int.TryParse(logicObj.ToString(), out logicVal);
                }

                timeline.Add(new BatchTimelineEvent(
                    trxReader.GetRequiredString("EventId"),
                    trxReader.GetRequiredString("EventType"),
                    trxReader.GetNullableString("EventCode"),
                    trxReader.GetNullableString("EventName"),
                    logicVal,
                    trxReader.GetNullableDecimal("Quantity"),
                    trxReader.GetNullableString("Unit"),
                    trxReader.GetNullableString("LocationCode"),
                    trxReader.GetNullableString("ActorId"),
                    trxReader.GetDateTime(trxReader.GetOrdinal("OccurredAt")),
                    trxReader.GetNullableString("ReferenceDoc"),
                    trxReader.GetNullableString("Note")
                ));
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Timeline Warning] Không thể đọc timeline từ tbl_transaction cho Lô #{batchId}: {ex.Message}");
        }

        // 4.2. Lấy từ tbl_batch_event (nếu có)
        try
        {
            const string batSql = @"
                SELECT
                    CONVERT(NVARCHAR(50), e.ma_event) AS EventCode,
                    CAST(ISNULL(e.so_luong, 0) AS DECIMAL(18,4)) AS Quantity,
                    CONVERT(NVARCHAR(50), e.unit) AS Unit,
                    COALESCE(e.user_up, N'Thủ kho') AS ActorId,
                    ISNULL(e.time_up, GETDATE()) AS OccurredAt,
                    CONVERT(NVARCHAR(100), e.trang_thai_ton) AS ReferenceDoc
                FROM dbo.tbl_batch_event e WITH (NOLOCK)
                WHERE e.id_batch = @BatchId
                ORDER BY e.time_up DESC;";

            await using var batCmd = new SqlCommand(batSql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
            batCmd.Parameters.AddWithValue("@BatchId", batchId);
            await using var batReader = await batCmd.ExecuteReaderAsync(cancellationToken);
            var batIdx = 1;
            while (await batReader.ReadAsync(cancellationToken))
            {
                var eventCode = batReader.GetNullableString("EventCode") ?? "0";
                var eventName = eventCode switch
                {
                    "1" => "Tạo mới Lô hàng",
                    "2" => "Nhập kho lưu trữ",
                    "3" => "Tách Lô con",
                    "4" => "Xuất kho sản xuất",
                    "5" => "Đếm kiểm kê xoay vòng",
                    "6" => "Chốt hoàn tất kiểm kê",
                    _ => $"Sự kiện Lô #{eventCode}"
                };

                timeline.Add(new BatchTimelineEvent(
                    $"BAT-{batchId}-{batIdx++}",
                    "BATCH_EVENT",
                    eventCode,
                    eventName,
                    0,
                    batReader.GetNullableDecimal("Quantity"),
                    batReader.GetNullableString("Unit"),
                    "Kho Tổng",
                    batReader.GetNullableString("ActorId"),
                    batReader.GetDateTime(batReader.GetOrdinal("OccurredAt")),
                    batReader.GetNullableString("ReferenceDoc"),
                    "Nhật ký sự kiện Lô"
                ));
            }
        }
        catch
        {
            // Bỏ qua nếu tbl_batch_event chưa có
        }

        // 4.3. Lấy từ tbl_location_event (nếu có)
        try
        {
            const string locSql = @"
                SELECT
                    CONVERT(NVARCHAR(50), l.location_event) AS EventCode,
                    CONVERT(NVARCHAR(100), l.ma_location) AS LocationCode,
                    COALESCE(l.user_cre, N'Thủ kho') AS ActorId,
                    ISNULL(l.time_cre, GETDATE()) AS OccurredAt
                FROM dbo.tbl_location_event l WITH (NOLOCK)
                WHERE l.id_batch = @BatchId
                ORDER BY l.time_cre DESC;";

            await using var locCmd = new SqlCommand(locSql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
            locCmd.Parameters.AddWithValue("@BatchId", batchId);
            await using var locReader = await locCmd.ExecuteReaderAsync(cancellationToken);
            var locIdx = 1;
            while (await locReader.ReadAsync(cancellationToken))
            {
                var locCode = locReader.GetNullableString("LocationCode") ?? "";
                var eventCode = locReader.GetNullableString("EventCode") ?? "1";
                var eventName = eventCode switch
                {
                    "1" => $"Xếp vào ô kệ: {locCode}",
                    "2" => $"Di dời sang ô kệ: {locCode}",
                    "3" => $"Hạ khỏi ô kệ: {locCode}",
                    _ => $"Vị trí kệ: {locCode}"
                };

                timeline.Add(new BatchTimelineEvent(
                    $"LOC-{batchId}-{locIdx++}",
                    "LOCATION_EVENT",
                    eventCode,
                    eventName,
                    0,
                    null,
                    null,
                    locCode,
                    locReader.GetNullableString("ActorId"),
                    locReader.GetDateTime(locReader.GetOrdinal("OccurredAt")),
                    locCode,
                    $"Ghi nhận vị trí ô kệ {locCode}"
                ));
            }
        }
        catch
        {
            // Bỏ qua nếu tbl_location_event chưa có
        }

        var sortedTimeline = timeline.OrderByDescending(t => t.OccurredAt).ToList();
        return new BatchFullHistoryResponse(true, batchDetail, inboundQc, genealogy, sortedTimeline);
    }



    public async Task<IReadOnlyList<RealBatchItem>> GetRealBatchesAsync(string? search, string? warehouse, int limit, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        var query = @"
            SELECT TOP (@Limit)
                CAST(b.id_batch AS INT) AS BatchId,
                CAST(b.parent_id_batch AS INT) AS ParentBatchId,
                b.id_vattu AS MaterialId,
                b.id_bravo AS BravoId,
                COALESCE(b.ten_vattu, v.ten_vattu, N'Vật tư') AS MaterialName,
                CAST(ISNULL(b.so_luong, 0) AS DECIMAL(18,4)) AS Quantity,
                COALESCE(b.unit, v.unit, N'Đơn vị') AS Unit,
                COALESCE(b.ma_kho, N'Kho Tổng') AS WarehouseCode,
                COALESCE(b.location, N'Kho Tổng') AS LocationCode,
                COALESCE(s.tentrangthai, b.trang_thai_ton, N'Sẵn sàng') AS InventoryStatus,
                CAST(ISNULL(b.time_cre, GETDATE()) AS DATETIME) AS CreatedAt
            FROM dbo.tbl_batch_inv b WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_vattu v WITH (NOLOCK) ON v.id_vattu = b.id_vattu
            LEFT JOIN dbo.tbl_dm_trangthai_ton s WITH (NOLOCK) ON s.ma_trangthai = b.trang_thai_ton
            WHERE b.trang_thai_ton NOT IN (N'0', N'2', N'5', N'00')
              AND b.so_luong > 0 ";

        if (!string.IsNullOrWhiteSpace(warehouse) && warehouse != "ALL")
        {
            query += " AND (b.ma_kho LIKE @Warehouse OR b.location LIKE @Warehouse) ";
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query += " AND (b.id_vattu LIKE @Search OR b.ten_vattu LIKE @Search OR b.location LIKE @Search OR CAST(b.id_batch AS NVARCHAR) LIKE @Search) ";
        }

        query += " ORDER BY b.id_batch DESC;";

        await using var cmd = new SqlCommand(query, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        cmd.Parameters.AddWithValue("@Limit", Math.Clamp(limit, 10, 500));
        if (!string.IsNullOrWhiteSpace(warehouse) && warehouse != "ALL") cmd.Parameters.AddWithValue("@Warehouse", $"%{warehouse.Trim()}%");
        if (!string.IsNullOrWhiteSpace(search)) cmd.Parameters.AddWithValue("@Search", $"%{search.Trim()}%");

        await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
        var list = new List<RealBatchItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            list.Add(new RealBatchItem(
                reader.GetInt32(reader.GetOrdinal("BatchId")),
                reader.GetNullableInt32("ParentBatchId"),
                reader.GetNullableString("MaterialId"),
                reader.GetNullableString("BravoId"),
                reader.GetNullableString("MaterialName"),
                reader.GetRequiredDecimal("Quantity"),
                reader.GetNullableString("Unit"),
                reader.GetNullableString("WarehouseCode"),
                reader.GetNullableString("LocationCode"),
                reader.GetNullableString("InventoryStatus"),
                reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                null
            ));
        }
        return list;
    }

    // =========================================================================
    // BÁO CÁO NHẬP - XUẤT - TỒN TỔNG HỢP THỰC TẾ (NXT SUMMARY)
    // =========================================================================
    public async Task<NxtReportResponse> GetNxtSummaryReportAsync(
        DateTime? fromDate, DateTime? toDate, string? search, string? warehouse, string? category, CancellationToken cancellationToken)
    {
        var effectiveFrom = fromDate ?? DateTime.Today.AddDays(-30);
        var effectiveTo = toDate.HasValue ? toDate.Value.Date.AddDays(1).AddTicks(-1) : DateTime.Today.AddDays(1).AddTicks(-1);

        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        const string sql = @"
            ;WITH CurrentStock AS
            (
                SELECT
                    b.id_vattu AS MaterialId,
                    MAX(b.id_bravo) AS BravoId,
                    MAX(b.ten_vattu) AS MaterialName,
                    MAX(b.unit) AS Unit,
                    CAST(SUM(ISNULL(b.so_luong, 0)) AS DECIMAL(18,4)) AS CurrentQty
                FROM dbo.tbl_batch_inv b WITH (NOLOCK)
                WHERE b.trang_thai_ton NOT IN (N'0', N'2', N'5', N'00')
                  AND b.so_luong > 0
                  AND (@Warehouse IS NULL OR @Warehouse = '' OR @Warehouse = 'ALL' OR b.ma_kho LIKE @Warehouse OR b.location LIKE @Warehouse)
                GROUP BY b.id_vattu
            ),
            PeriodTransactions AS
            (
                SELECT
                    t.id_vattu AS MaterialId,
                    MAX(t.id_bravo) AS BravoId,
                    MAX(t.ten_vattu) AS MaterialName,
                    MAX(t.unit) AS Unit,
                    COUNT_BIG(t.id_trans) AS TxnCount,
                    CAST(SUM(CASE WHEN ISNULL(TRY_CONVERT(INT, o.logic), CASE WHEN t.nghiep_vu IN ('OUT_CON', 'SPLIT_OUT', 'CC_ADJ_OUT', 'ADJ_DWN', 'OUT_SCR', 'OUT_SO', 'OUT_TRN', 'OUT_VEN', 'OUT_OTH') OR t.nghiep_vu LIKE 'OUT%' THEN -1 ELSE 1 END) = 1 THEN ABS(ISNULL(t.so_luong, 0)) ELSE 0 END) AS DECIMAL(18,4)) AS InQty,
                    CAST(SUM(CASE WHEN ISNULL(TRY_CONVERT(INT, o.logic), CASE WHEN t.nghiep_vu IN ('OUT_CON', 'SPLIT_OUT', 'CC_ADJ_OUT', 'ADJ_DWN', 'OUT_SCR', 'OUT_SO', 'OUT_TRN', 'OUT_VEN', 'OUT_OTH') OR t.nghiep_vu LIKE 'OUT%' THEN -1 ELSE 1 END) = -1 THEN ABS(ISNULL(t.so_luong, 0)) ELSE 0 END) AS DECIMAL(18,4)) AS OutQty
                FROM dbo.tbl_transaction t WITH (NOLOCK)
                LEFT JOIN dbo.tbl_dm_nghiepvu_kho o WITH (NOLOCK) ON o.ma_nghiepvu = t.nghiep_vu
                WHERE t.time_cre >= @FromDate AND t.time_cre <= @ToDate
                  AND t.id_vattu IS NOT NULL AND t.id_vattu <> ''
                GROUP BY t.id_vattu
            ),
            FutureTransactions AS
            (
                SELECT
                    t.id_vattu AS MaterialId,
                    CAST(SUM(
                        ABS(ISNULL(t.so_luong, 0)) * 
                        ISNULL(TRY_CONVERT(INT, o.logic), CASE WHEN t.nghiep_vu IN ('OUT_CON', 'SPLIT_OUT', 'CC_ADJ_OUT', 'ADJ_DWN', 'OUT_SCR', 'OUT_SO', 'OUT_TRN', 'OUT_VEN', 'OUT_OTH') OR t.nghiep_vu LIKE 'OUT%' THEN -1 ELSE 1 END)
                    ) AS DECIMAL(18,4)) AS NetFutureChange
                FROM dbo.tbl_transaction t WITH (NOLOCK)
                LEFT JOIN dbo.tbl_dm_nghiepvu_kho o WITH (NOLOCK) ON o.ma_nghiepvu = t.nghiep_vu
                WHERE t.time_cre > @ToDate
                  AND t.id_vattu IS NOT NULL AND t.id_vattu <> ''
                GROUP BY t.id_vattu
            ),
            Combined AS
            (
                SELECT
                    COALESCE(c.MaterialId, p.MaterialId) AS MaterialId,
                    COALESCE(p.BravoId, c.BravoId, v.id_bravo) AS BravoId,
                    COALESCE(p.MaterialName, c.MaterialName, v.ten_vattu, N'Vật tư') AS MaterialName,
                    COALESCE(v.ten_vattu, N'Chung') AS CategoryName,
                    COALESCE(p.Unit, c.Unit, v.unit, N'Đơn vị') AS Unit,
                    CAST(100000.0 AS DECIMAL(18,4)) AS UnitPrice,
                    ISNULL(c.CurrentQty, 0) AS CurrentStockQty,
                    ISNULL(f.NetFutureChange, 0) AS FutureNetChange,
                    ISNULL(p.InQty, 0) AS InQty,
                    ISNULL(p.OutQty, 0) AS OutQty,
                    ISNULL(p.TxnCount, 0) AS TxnCount
                FROM CurrentStock c
                FULL OUTER JOIN PeriodTransactions p ON p.MaterialId = c.MaterialId
                LEFT JOIN FutureTransactions f ON f.MaterialId = COALESCE(c.MaterialId, p.MaterialId)
                LEFT JOIN dbo.tbl_dm_vattu v WITH (NOLOCK) ON v.id_vattu = COALESCE(c.MaterialId, p.MaterialId)
            )
            SELECT
                MaterialId,
                BravoId,
                MaterialName,
                CategoryName,
                Unit,
                UnitPrice,
                CAST(CASE 
                    WHEN CurrentStockQty - FutureNetChange - InQty + OutQty < 0 THEN 0 
                    ELSE CurrentStockQty - FutureNetChange - InQty + OutQty 
                END AS DECIMAL(18,4)) AS BeginningQty,
                InQty,
                OutQty,
                CAST(CASE 
                    WHEN CurrentStockQty - FutureNetChange < 0 THEN 0 
                    ELSE CurrentStockQty - FutureNetChange 
                END AS DECIMAL(18,4)) AS EndingQty,
                TxnCount
            FROM Combined
            WHERE (@Search IS NULL OR @Search = '' OR MaterialId LIKE @Search OR MaterialName LIKE @Search OR BravoId LIKE @Search)
            ORDER BY (InQty + OutQty) DESC, EndingQty DESC, MaterialId ASC;";

        await using var command = new SqlCommand(sql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        command.Parameters.AddWithValue("@FromDate", effectiveFrom);
        command.Parameters.AddWithValue("@ToDate", effectiveTo);
        command.Parameters.AddWithValue("@Warehouse", (object?)warehouse?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@Search", string.IsNullOrWhiteSpace(search) ? DBNull.Value : $"%{search.Trim()}%");

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var items = new List<NxtMaterialSummaryItem>();
        var totalBeginningVal = 0m;
        var totalIn = 0m;
        var totalOut = 0m;
        var totalEndingVal = 0m;
        var activeCount = 0;

        while (await reader.ReadAsync(cancellationToken))
        {
            var matId = reader.GetRequiredString("MaterialId");
            var bravoId = reader.GetNullableString("BravoId");
            var matName = reader.GetNullableString("MaterialName");
            var catName = reader.GetNullableString("CategoryName");
            var unit = reader.GetNullableString("Unit");
            var price = reader.GetDecimal(reader.GetOrdinal("UnitPrice"));
            var begQty = reader.GetDecimal(reader.GetOrdinal("BeginningQty"));
            var inQty = reader.GetDecimal(reader.GetOrdinal("InQty"));
            var outQty = reader.GetDecimal(reader.GetOrdinal("OutQty"));
            var endQty = reader.GetDecimal(reader.GetOrdinal("EndingQty"));
            var txnCount = Convert.ToInt32(reader["TxnCount"]);

            var endingVal = endQty * price;
            totalBeginningVal += begQty * price;
            totalIn += inQty;
            totalOut += outQty;
            totalEndingVal += endingVal;
            if (inQty > 0 || outQty > 0 || endQty > 0) activeCount++;

            items.Add(new NxtMaterialSummaryItem(
                matId,
                bravoId,
                matName,
                catName,
                unit,
                price,
                begQty,
                inQty,
                outQty,
                endQty,
                endingVal,
                txnCount
            ));
        }

        return new NxtReportResponse(
            effectiveFrom,
            effectiveTo,
            totalBeginningVal,
            totalIn,
            totalOut,
            totalEndingVal,
            items.Count,
            activeCount,
            items
        );
    }

    // =========================================================================
    // SỔ PHIẾU XUẤT & NHẬP KHO THỰC TẾ (INVENTORY DOCUMENTS)
    // =========================================================================
    public async Task<InventoryDocumentPage> GetInventoryDocumentsAsync(
        DateTime? fromDate, DateTime? toDate, string? documentType, string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        var effectiveFrom = fromDate ?? DateTime.Today.AddDays(-30);
        var effectiveTo = toDate.HasValue ? toDate.Value.Date.AddDays(1).AddTicks(-1) : DateTime.Today.AddDays(1).AddTicks(-1);
        var p = Math.Max(page, 1);
        var size = Math.Clamp(pageSize, 1, 200);
        var offset = (p - 1) * size;

        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        const string sql = @"
            WITH FilteredDocs AS
            (
                SELECT
                    p.id_phieu_trans AS DocumentId,
                    CONCAT(N'PH-', p.id_phieu_trans) AS DocumentCode,
                    p.nghiep_vu AS OperationCode,
                    COALESCE(o.ten_nghiepvu, p.nghiep_vu, N'Chứng từ kho') AS OperationName,
                    CASE
                        WHEN p.nghiep_vu LIKE N'OUT%' OR p.nghiep_vu IN (N'XUAT_KHO', N'XUAT') THEN 'OUT'
                        WHEN p.nghiep_vu LIKE N'IN%' OR p.nghiep_vu IN (N'NHAP_KHO', N'NHAP') THEN 'IN'
                        WHEN p.nghiep_vu LIKE N'MOV%' OR p.nghiep_vu LIKE N'TRA%' THEN 'TRANSFER'
                        WHEN p.nghiep_vu LIKE N'ADJ%' OR p.nghiep_vu LIKE N'COUNT%' OR p.nghiep_vu LIKE N'KK%' THEN 'COUNT'
                        WHEN p.nghiep_vu LIKE N'SPLIT%' THEN 'SPLIT'
                        ELSE 'OTHER'
                    END AS DocumentType,
                    COALESCE(p.ma_kho_from, N'Kho Tổng') AS WarehouseFrom,
                    COALESCE(p.ma_kho_to, N'Kho Tổng') AS WarehouseTo,
                    COALESCE(p.nguoi_nhan, p.ma_kho_to, N'-') AS ReceiverOrPartner,
                    COALESCE(p.user_cre, N'Thủ kho') AS CreatedBy,
                    ISNULL(p.time_cre, GETDATE()) AS CreatedAt,
                    COALESCE(p.trang_thai_phieu, N'1') AS StatusCode,
                    CASE COALESCE(p.trang_thai_phieu, N'1')
                        WHEN N'1' THEN N'Mới tạo'
                        WHEN N'2' THEN N'Hoàn tất'
                        WHEN N'0' THEN N'Đã hủy'
                        ELSE N'Đang xử lý'
                    END AS StatusName,
                    COALESCE(p.ghi_chu_huy, N'') AS Note,
                    ISNULL(s.LineCount, 0) AS TotalLines,
                    CAST(ISNULL(s.TotalQuantity, 0) AS DECIMAL(18,4)) AS TotalQuantity
                FROM dbo.tbl_phieu_transaction p WITH (NOLOCK)
                LEFT JOIN dbo.tbl_dm_nghiepvu_kho o WITH (NOLOCK) ON o.ma_nghiepvu = p.nghiep_vu
                OUTER APPLY
                (
                    SELECT
                        COUNT_BIG(*) AS LineCount,
                        SUM(ABS(ISNULL(t.so_luong, 0))) AS TotalQuantity
                    FROM dbo.tbl_transaction t WITH (NOLOCK)
                    WHERE t.id_phieu_trans = p.id_phieu_trans
                ) s
                WHERE p.time_cre >= @FromDate AND p.time_cre <= @ToDate
                  AND (@DocType IS NULL OR @DocType = '' OR @DocType = 'ALL' OR
                       CASE
                           WHEN p.nghiep_vu LIKE N'OUT%' OR p.nghiep_vu IN (N'XUAT_KHO', N'XUAT') THEN 'OUT'
                           WHEN p.nghiep_vu LIKE N'IN%' OR p.nghiep_vu IN (N'NHAP_KHO', N'NHAP') THEN 'IN'
                           WHEN p.nghiep_vu LIKE N'MOV%' OR p.nghiep_vu LIKE N'TRA%' THEN 'TRANSFER'
                           WHEN p.nghiep_vu LIKE N'ADJ%' OR p.nghiep_vu LIKE N'COUNT%' OR p.nghiep_vu LIKE N'KK%' THEN 'COUNT'
                           WHEN p.nghiep_vu LIKE N'SPLIT%' THEN 'SPLIT'
                           ELSE 'OTHER'
                       END = @DocType)
                  AND (@Search IS NULL OR @Search = ''
                       OR CONVERT(NVARCHAR(50), p.id_phieu_trans) LIKE @Search
                       OR p.user_cre LIKE @Search
                       OR p.nguoi_nhan LIKE @Search
                       OR p.ghi_chu_huy LIKE @Search)
            )
            SELECT * FROM FilteredDocs
            ORDER BY CreatedAt DESC, DocumentId DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;

            SELECT COUNT_BIG(*)
            FROM dbo.tbl_phieu_transaction p WITH (NOLOCK)
            WHERE p.time_cre >= @FromDate AND p.time_cre <= @ToDate
              AND (@DocType IS NULL OR @DocType = '' OR @DocType = 'ALL' OR
                   CASE
                       WHEN p.nghiep_vu LIKE N'OUT%' OR p.nghiep_vu IN (N'XUAT_KHO', N'XUAT') THEN 'OUT'
                       WHEN p.nghiep_vu LIKE N'IN%' OR p.nghiep_vu IN (N'NHAP_KHO', N'NHAP') THEN 'IN'
                       WHEN p.nghiep_vu LIKE N'MOV%' OR p.nghiep_vu LIKE N'TRA%' THEN 'TRANSFER'
                       WHEN p.nghiep_vu LIKE N'ADJ%' OR p.nghiep_vu LIKE N'COUNT%' OR p.nghiep_vu LIKE N'KK%' THEN 'COUNT'
                       WHEN p.nghiep_vu LIKE N'SPLIT%' THEN 'SPLIT'
                       ELSE 'OTHER'
                   END = @DocType)
              AND (@Search IS NULL OR @Search = ''
                   OR CONVERT(NVARCHAR(50), p.id_phieu_trans) LIKE @Search
                   OR p.user_cre LIKE @Search
                   OR p.nguoi_nhan LIKE @Search
                   OR p.ghi_chu_huy LIKE @Search);";

        await using var command = new SqlCommand(sql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        command.Parameters.AddWithValue("@FromDate", effectiveFrom);
        command.Parameters.AddWithValue("@ToDate", effectiveTo);
        command.Parameters.AddWithValue("@DocType", (object?)documentType?.Trim() ?? DBNull.Value);
        command.Parameters.AddWithValue("@Search", string.IsNullOrWhiteSpace(search) ? DBNull.Value : $"%{search.Trim()}%");
        command.Parameters.AddWithValue("@Offset", offset);
        command.Parameters.AddWithValue("@PageSize", size);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var items = new List<InventoryDocumentSummaryItem>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new InventoryDocumentSummaryItem(
                reader.GetInt32(reader.GetOrdinal("DocumentId")),
                reader.GetRequiredString("DocumentCode"),
                reader.GetNullableString("OperationCode"),
                reader.GetNullableString("OperationName"),
                reader.GetRequiredString("DocumentType"),
                reader.GetNullableString("WarehouseFrom"),
                reader.GetNullableString("WarehouseTo"),
                reader.GetNullableString("ReceiverOrPartner"),
                reader.GetNullableString("CreatedBy"),
                reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                reader.GetNullableString("StatusCode"),
                reader.GetNullableString("StatusName"),
                reader.GetNullableString("Note"),
                Convert.ToInt32(reader["TotalLines"]),
                reader.GetDecimal(reader.GetOrdinal("TotalQuantity"))
            ));
        }

        long totalCount = 0;
        if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken))
        {
            totalCount = reader.GetInt64(0);
        }

        return new InventoryDocumentPage(items, totalCount, p, size);
    }

    // =========================================================================
    // CHI TIẾT PHIẾU XUẤT / NHẬP KHO (DOCUMENT DETAILS & LINES)
    // =========================================================================
    public async Task<InventoryDocumentDetailResponse> GetInventoryDocumentDetailAsync(int documentId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        const string sql = @"
            SELECT
                p.id_phieu_trans AS DocumentId,
                CONCAT(N'PH-', p.id_phieu_trans) AS DocumentCode,
                p.nghiep_vu AS OperationCode,
                COALESCE(o.ten_nghiepvu, p.nghiep_vu, N'Chứng từ kho') AS OperationName,
                CASE
                    WHEN p.nghiep_vu LIKE N'OUT%' OR p.nghiep_vu IN (N'XUAT_KHO', N'XUAT') THEN 'OUT'
                    WHEN p.nghiep_vu LIKE N'IN%' OR p.nghiep_vu IN (N'NHAP_KHO', N'NHAP') THEN 'IN'
                    WHEN p.nghiep_vu LIKE N'MOV%' OR p.nghiep_vu LIKE N'TRA%' THEN 'TRANSFER'
                    WHEN p.nghiep_vu LIKE N'ADJ%' OR p.nghiep_vu LIKE N'COUNT%' OR p.nghiep_vu LIKE N'KK%' THEN 'COUNT'
                    WHEN p.nghiep_vu LIKE N'SPLIT%' THEN 'SPLIT'
                    ELSE 'OTHER'
                END AS DocumentType,
                COALESCE(p.ma_kho_from, N'Kho Tổng') AS WarehouseFrom,
                COALESCE(p.ma_kho_to, N'Kho Tổng') AS WarehouseTo,
                COALESCE(p.nguoi_nhan, p.ma_kho_to, N'-') AS ReceiverOrPartner,
                COALESCE(p.user_cre, N'Thủ kho') AS CreatedBy,
                ISNULL(p.time_cre, GETDATE()) AS CreatedAt,
                COALESCE(p.trang_thai_phieu, N'1') AS StatusCode,
                CASE COALESCE(p.trang_thai_phieu, N'1')
                    WHEN N'1' THEN N'Mới tạo'
                    WHEN N'2' THEN N'Hoàn tất'
                    WHEN N'0' THEN N'Đã hủy'
                    ELSE N'Đang xử lý'
                END AS StatusName,
                COALESCE(p.ghi_chu_huy, N'') AS Note,
                ISNULL(s.LineCount, 0) AS TotalLines,
                CAST(ISNULL(s.TotalQuantity, 0) AS DECIMAL(18,4)) AS TotalQuantity
            FROM dbo.tbl_phieu_transaction p WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_nghiepvu_kho o WITH (NOLOCK) ON o.ma_nghiepvu = p.nghiep_vu
            OUTER APPLY
            (
                SELECT
                    COUNT_BIG(*) AS LineCount,
                    SUM(ABS(ISNULL(t.so_luong, 0))) AS TotalQuantity
                FROM dbo.tbl_transaction t WITH (NOLOCK)
                WHERE t.id_phieu_trans = p.id_phieu_trans
            ) s
            WHERE p.id_phieu_trans = @DocumentId;

            SELECT
                CAST(t.id_trans AS INT) AS TransactionId,
                CAST(t.id_batch AS INT) AS BatchId,
                t.id_vattu AS MaterialId,
                t.id_bravo AS BravoId,
                COALESCE(t.ten_vattu, v.ten_vattu, N'Vật tư') AS MaterialName,
                CAST(ABS(ISNULL(t.so_luong, 0)) AS DECIMAL(18,4)) AS Quantity,
                COALESCE(t.unit, b.unit, v.unit, N'Đơn vị') AS Unit,
                t.nghiep_vu AS OperationCode,
                COALESCE(o.ten_nghiepvu, t.nghiep_vu, N'Giao dịch') AS OperationName,
                CAST(ISNULL(TRY_CONVERT(INT, o.logic), CASE WHEN t.nghiep_vu IN ('OUT_CON', 'SPLIT_OUT', 'CC_ADJ_OUT', 'ADJ_DWN', 'OUT_SCR', 'OUT_SO', 'OUT_TRN', 'OUT_VEN', 'OUT_OTH') OR t.nghiep_vu LIKE 'OUT%' THEN -1 ELSE 1 END) AS INT) AS Logic,
                COALESCE(b.location, N'Kho Tổng') AS LocationCode,
                ISNULL(t.time_cre, GETDATE()) AS CreatedAt,
                COALESCE(t.trang_thai, N'') AS Note
            FROM dbo.tbl_transaction t WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_nghiepvu_kho o WITH (NOLOCK) ON o.ma_nghiepvu = t.nghiep_vu
            LEFT JOIN dbo.tbl_batch_inv b WITH (NOLOCK) ON b.id_batch = t.id_batch
            LEFT JOIN dbo.tbl_dm_vattu v WITH (NOLOCK) ON v.id_vattu = t.id_vattu
            WHERE t.id_phieu_trans = @DocumentId
            ORDER BY t.id_trans ASC;";

        await using var command = new SqlCommand(sql, connection) { CommandTimeout = options.Value.CommandTimeoutSeconds };
        command.Parameters.AddWithValue("@DocumentId", documentId);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return new InventoryDocumentDetailResponse(false, null, Array.Empty<InventoryDocumentLineItem>());
        }

        var doc = new InventoryDocumentSummaryItem(
            reader.GetInt32(reader.GetOrdinal("DocumentId")),
            reader.GetRequiredString("DocumentCode"),
            reader.GetNullableString("OperationCode"),
            reader.GetNullableString("OperationName"),
            reader.GetRequiredString("DocumentType"),
            reader.GetNullableString("WarehouseFrom"),
            reader.GetNullableString("WarehouseTo"),
            reader.GetNullableString("ReceiverOrPartner"),
            reader.GetNullableString("CreatedBy"),
            reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
            reader.GetNullableString("StatusCode"),
            reader.GetNullableString("StatusName"),
            reader.GetNullableString("Note"),
            Convert.ToInt32(reader["TotalLines"]),
            reader.GetDecimal(reader.GetOrdinal("TotalQuantity"))
        );

        var lines = new List<InventoryDocumentLineItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
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

                lines.Add(new InventoryDocumentLineItem(
                    reader.GetInt32(reader.GetOrdinal("TransactionId")),
                    reader.GetNullableInt32("BatchId"),
                    reader.GetNullableString("MaterialId"),
                    reader.GetNullableString("BravoId"),
                    reader.GetNullableString("MaterialName"),
                    qtyVal,
                    reader.GetNullableString("Unit"),
                    reader.GetNullableString("OperationCode"),
                    reader.GetNullableString("OperationName"),
                    logicVal,
                    reader.GetNullableString("LocationCode"),
                    reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                    reader.GetNullableString("Note")
                ));
            }
        }

        return new InventoryDocumentDetailResponse(true, doc, lines);
    }

    // =========================================================================
    // UC-18 (INV-06): BATCH AUDIT (KIỂM KÊ THEO BATCH 3 CẤP)
    // =========================================================================
    public async Task<CreateBatchAuditPlanResult> CreateBatchAuditPlanAsync(string userId, CreateBatchAuditPlanRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV06_CreateBatchAuditPlan_v1");
        AddUser(command, userId);
        command.Parameters.Add("@PlanName", SqlDbType.NVarChar, 255).Value = request.PlanName.Trim();
        command.Parameters.Add("@WarehouseCode", SqlDbType.NVarChar, 50).Value = string.IsNullOrWhiteSpace(request.WarehouseCode) ? "20020100" : request.WarehouseCode.Trim();
        command.Parameters.Add("@AuditType", SqlDbType.NVarChar, 50).Value = string.IsNullOrWhiteSpace(request.AuditType) ? "BATCH_LIST" : request.AuditType.Trim();
        command.Parameters.Add("@BatchIdsJson", SqlDbType.NVarChar, -1).Value = request.BatchIds != null && request.BatchIds.Count > 0
            ? JsonSerializer.Serialize(request.BatchIds)
            : DBNull.Value;
        command.Parameters.Add("@LocationPrefix", SqlDbType.NVarChar, 50).Value = DbValue(request.LocationPrefix);
        command.Parameters.Add("@MaterialId", SqlDbType.NVarChar, 50).Value = DbValue(request.MaterialId);
        command.Parameters.Add("@AgingDays", SqlDbType.Int).Value = DbValue(request.AgingDays);
        command.Parameters.Add("@Note", SqlDbType.NVarChar, 500).Value = DbValue(request.Note);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new CreateBatchAuditPlanResult(
                true,
                "Tạo kế hoạch kiểm kê thành công.",
                reader.GetInt32OrDefault("PlanId"),
                reader.GetNullableString("PlanName"),
                reader.GetInt32OrDefault("TotalBatches"),
                reader.GetDecimalOrDefault("TotalSnapshotQuantity"),
                reader.GetNullableDateTime("CreatedAt")
            );
        }
        return new CreateBatchAuditPlanResult(false, "Không nhận được phản hồi từ cơ sở dữ liệu.", null, null, 0, 0, null);
    }

    public async Task<BatchAuditPlanPage> GetBatchAuditPlansAsync(string userId, string? search, int? statusCode, int page, int pageSize, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV06_GetBatchAuditPlans_v1");
        AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = DbValue(search);
        command.Parameters.Add("@StatusCode", SqlDbType.Int).Value = DbValue(statusCode);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page > 0 ? page : 1;
        command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize > 0 && pageSize <= 200 ? pageSize : 50;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var items = new List<BatchAuditPlanSummary>();
        while (await reader.ReadAsync(cancellationToken))
        {
            items.Add(new BatchAuditPlanSummary(
                reader.GetInt32OrDefault("PlanId"),
                reader.GetRequiredString("PlanName"),
                reader.GetRequiredString("WarehouseCode"),
                reader.GetRequiredString("AuditType"),
                reader.GetInt32OrDefault("StatusCode"),
                reader.GetInt32OrDefault("TotalBatches"),
                reader.GetInt32OrDefault("CountedBatches"),
                reader.GetInt32OrDefault("DiscrepantBatches"),
                reader.GetDecimalOrDefault("TotalSnapshotQuantity"),
                reader.GetDecimalOrDefault("TotalActualQuantity"),
                reader.GetDecimalOrDefault("TotalDifferenceQuantity"),
                reader.GetRequiredString("CreatedBy"),
                reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                reader.GetNullableString("ApprovedBy"),
                reader.GetNullableDateTime("ApprovedAt"),
                reader.GetNullableString("ApprovalNote"),
                reader.GetNullableString("Note")
            ));
        }

        var total = (long)items.Count;
        if (await reader.NextResultAsync(cancellationToken) && await reader.ReadAsync(cancellationToken))
        {
            total = reader.GetRequiredInt64("TotalCount");
        }

        return new BatchAuditPlanPage(items, total, page, pageSize);
    }

    public async Task<BatchAuditPlanDetailResponse> GetBatchAuditPlanDetailAsync(string userId, int planId, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV06_GetBatchAuditPlanDetail_v1");
        AddUser(command, userId);
        command.Parameters.Add("@PlanId", SqlDbType.Int).Value = planId;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        BatchAuditPlanSummary? plan = null;
        if (await reader.ReadAsync(cancellationToken))
        {
            plan = new BatchAuditPlanSummary(
                reader.GetInt32OrDefault("PlanId"),
                reader.GetRequiredString("PlanName"),
                reader.GetRequiredString("WarehouseCode"),
                reader.GetRequiredString("AuditType"),
                reader.GetInt32OrDefault("StatusCode"),
                reader.GetInt32OrDefault("TotalBatches"),
                reader.GetInt32OrDefault("CountedBatches"),
                reader.GetInt32OrDefault("DiscrepantBatches"),
                reader.GetDecimalOrDefault("TotalSnapshotQuantity"),
                reader.GetDecimalOrDefault("TotalActualQuantity"),
                reader.GetDecimalOrDefault("TotalDifferenceQuantity"),
                reader.GetRequiredString("CreatedBy"),
                reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
                reader.GetNullableString("ApprovedBy"),
                reader.GetNullableDateTime("ApprovedAt"),
                reader.GetNullableString("ApprovalNote"),
                reader.GetNullableString("Note")
            );
        }

        var batches = new List<BatchAuditDetailItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                batches.Add(new BatchAuditDetailItem(
                    reader.GetInt32OrDefault("DetailId"),
                    reader.GetInt32OrDefault("PlanId"),
                    reader.GetInt32OrDefault("BatchId"),
                    reader.GetRequiredString("MaterialId"),
                    reader.GetNullableString("BravoId"),
                    reader.GetNullableString("MaterialName"),
                    reader.GetNullableString("Unit"),
                    reader.GetNullableString("LocationSnapshot"),
                    reader.GetNullableString("LocationActual"),
                    reader.GetDecimalOrDefault("CurrentInventoryQuantity"),
                    reader.GetNullableString("CurrentLocation"),
                    reader.GetDecimalOrDefault("SnapshotQuantity"),
                    reader.GetNullableDecimal("ActualQuantity"),
                    reader.GetNullableDecimal("DifferenceQuantity"),
                    reader.GetNullableString("AuditStatus") ?? "CHUA_KIEM",
                    reader.GetNullableString("VarianceReason"),
                    reader.GetNullableString("LastCountedBy"),
                    reader.GetNullableDateTime("LastCountedAt")
                ));
            }
        }

        var logs = new List<BatchAuditLogItem>();
        if (await reader.NextResultAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                logs.Add(new BatchAuditLogItem(
                    reader.GetInt32OrDefault("LogId"),
                    reader.GetInt32OrDefault("DetailId"),
                    reader.GetInt32OrDefault("PlanId"),
                    reader.GetInt32OrDefault("BatchId"),
                    reader.GetDecimalOrDefault("CountedQuantity"),
                    reader.GetNullableString("Unit"),
                    reader.GetNullableString("LocationScanned"),
                    reader.GetNullableString("Note"),
                    reader.GetNullableString("CountedBy") ?? "N/A",
                    reader.GetNullableDateTime("CountedAt") ?? DateTime.Now
                ));
            }
        }

        return new BatchAuditPlanDetailResponse(plan, batches, logs);
    }

    public async Task<LogBatchCountResult> LogBatchCountAsync(string userId, int planId, LogBatchCountRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV06_LogBatchCount_v1");
        AddUser(command, userId);
        command.Parameters.Add("@PlanId", SqlDbType.Int).Value = planId;
        command.Parameters.Add("@BatchId", SqlDbType.Int).Value = request.BatchId;
        command.Parameters.Add("@ActualQuantity", SqlDbType.Float).Value = (double)request.ActualQuantity;
        command.Parameters.Add("@LocationCode", SqlDbType.NVarChar, 50).Value = DbValue(request.LocationCode);
        command.Parameters.Add("@Note", SqlDbType.NVarChar, 255).Value = DbValue(request.Note);

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new LogBatchCountResult(
                true,
                "Ghi nhận số lượng đếm thành công.",
                reader.GetInt32OrDefault("PlanId"),
                reader.GetNullableInt32("DetailId"),
                reader.GetInt32OrDefault("BatchId"),
                reader.GetDecimalOrDefault("ActualQuantity"),
                reader.GetDecimalOrDefault("DifferenceQuantity"),
                reader.GetNullableString("AuditStatus") ?? "KHOP",
                reader.GetNullableString("CountedBy") ?? userId,
                reader.GetNullableDateTime("CountedAt") ?? DateTime.Now
            );
        }

        return new LogBatchCountResult(false, "Không thể ghi nhận số đếm.", planId, null, request.BatchId, request.ActualQuantity, 0, "ERROR", userId, DateTime.Now);
    }

    public async Task<ApproveBatchVarianceResult> ApproveBatchVarianceAsync(string userId, int planId, ApproveBatchVarianceRequest request, CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);
        await using var command = CreateCommand(connection, "api.usp_WMS_INV06_ApproveBatchVariance_v1");
        AddUser(command, userId);
        command.Parameters.Add("@PlanId", SqlDbType.Int).Value = planId;
        command.Parameters.Add("@ApprovalNote", SqlDbType.NVarChar, 1000).Value = request.ApprovalNote.Trim();
        command.Parameters.Add("@VarianceExplanationsJson", SqlDbType.NVarChar, -1).Value = request.VarianceExplanations != null && request.VarianceExplanations.Count > 0
            ? JsonSerializer.Serialize(request.VarianceExplanations)
            : DBNull.Value;

        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (await reader.ReadAsync(cancellationToken))
        {
            return new ApproveBatchVarianceResult(
                true,
                reader.GetNullableString("Message") ?? "Phê duyệt kế hoạch kiểm kê thành công.",
                reader.GetInt32OrDefault("PlanId"),
                reader.GetNullableInt32("TransactionDocumentId"),
                reader.GetInt32OrDefault("AdjustedBatchCount"),
                reader.GetNullableString("ApprovedBy") ?? userId,
                reader.GetNullableDateTime("ApprovedAt") ?? DateTime.Now
            );
        }

        return new ApproveBatchVarianceResult(false, "Không nhận được phản hồi từ cơ sở dữ liệu.", planId, null, 0, userId, DateTime.Now);
    }

    private SqlCommand CreateCommand(SqlConnection connection, string procedure) => new(procedure, connection) { CommandType = CommandType.StoredProcedure, CommandTimeout = options.Value.CommandTimeoutSeconds };
    private static void AddUser(SqlCommand command, string userId) => command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = userId;
    private static object DbValue(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();
    private static object DbValue(int? value) => value.HasValue ? value.Value : DBNull.Value;
    private static SqlParameter Decimal(string name, decimal value) => new(name, SqlDbType.Decimal) { Precision = 19, Scale = 4, Value = value };
    private static DataTable DeclarationTable(IReadOnlyList<InventoryDeclarationInput> items) { var table = new DataTable(); table.Columns.Add("MaterialId", typeof(string)); table.Columns.Add("Quantity", typeof(decimal)); table.Columns.Add("Unit", typeof(string)); table.Columns.Add("LocationCode", typeof(string)); foreach (var item in items) table.Rows.Add(item.MaterialId, item.Quantity, DbValue(item.Unit), DbValue(item.LocationCode)); return table; }
    private static LocationOption ReadLocation(SqlDataReader reader) => new(
        reader.GetRequiredString("LocationCode"),
        reader.GetNullableString("AreaCode"),
        reader.GetNullableString("ShelfCode"),
        reader.GetNullableInt32("ColumnNumber"),
        reader.GetNullableInt32("FloorNumber"),
        reader.GetNullableInt32("PositionNumber"),
        reader.GetNullableString("Description"),
        reader.GetInt32OrDefault("BatchCount", 0),
        reader.GetDecimalOrDefault("TotalQuantity", 0),
        reader.GetNullableString("MaterialPreview")
    );
}

