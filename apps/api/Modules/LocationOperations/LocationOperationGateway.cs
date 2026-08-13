using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.LocationOperations;

public sealed class LocationOperationGateway(ISqlConnectionFactory factory, IOptions<SqlOptions> options)
{
    public Task<LocationWorklist> GetPutAwayAsync(string userId, string? search, int page, int pageSize, CancellationToken token) => Query("api.usp_WMS_LOC02_GetPutAwayWorklist_v1", userId, search, null, page, pageSize, true, token);
    public Task<LocationWorklist> GetRelocationAsync(string userId, string? search, string? location, int page, int pageSize, CancellationToken token) => Query("api.usp_WMS_LOC03_GetRelocationWorklist_v1", userId, search, location, page, pageSize, true, token);
    public Task<LocationWorklist> GetTakeDownAsync(string userId, string? search, string? location, int page, int pageSize, CancellationToken token) => Query("api.usp_WMS_LOC04_GetTakeDownWorklist_v1", userId, search, location, page, pageSize, false, token);
    public Task<BatchLocationResult> PutAwayAsync(string userId, BatchLocationRequest request, CancellationToken token) => Execute("api.usp_WMS_LOC02_PutAwayBatches_v1", userId, "@LocationCode", request.TargetLocationCode, request.Batches, token);
    public Task<BatchLocationResult> RelocateAsync(string userId, BatchLocationRequest request, CancellationToken token) => Execute("api.usp_WMS_LOC03_RelocateBatches_v1", userId, "@TargetLocationCode", request.TargetLocationCode, request.Batches, token);
    public Task<BatchLocationResult> TakeDownAsync(string userId, BatchLocationRequest request, CancellationToken token) => Execute("api.usp_WMS_LOC04_TakeDownBatches_v1", userId, null, null, request.Batches, token);

    private async Task<LocationWorklist> Query(string procedure, string userId, string? search, string? location, int page, int pageSize, bool hasLocations, CancellationToken token)
    {
        await using var connection = await factory.OpenAsync(token); await using var command = Command(connection, procedure); AddUser(command, userId);
        command.Parameters.Add("@Search", SqlDbType.NVarChar, 200).Value = Db(search); if (procedure.Contains("LOC03") || procedure.Contains("LOC04")) command.Parameters.Add("@LocationCode", SqlDbType.NVarChar, 50).Value = Db(location);
        command.Parameters.Add("@Page", SqlDbType.Int).Value = page; command.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize; await using var reader = await command.ExecuteReaderAsync(token);
        var items = new List<LocationBatch>(); while (await reader.ReadAsync(token)) items.Add(new LocationBatch(reader.GetRequiredInt32("BatchId"), reader.GetNullableString("MaterialId"), reader.GetNullableString("MaterialName"),
            reader.GetRequiredDecimal("Quantity"), reader.GetNullableString("Unit"), reader.GetNullableString("WarehouseCode"), reader.GetNullableString("LocationCode"), reader.GetNullableDateTime(procedure.Contains("LOC02") ? "CreatedAt" : "ChangedAt")));
        var locations = new List<LocationOption>(); if (hasLocations && await reader.NextResultAsync(token)) while (await reader.ReadAsync(token)) locations.Add(new LocationOption(reader.GetRequiredString("LocationCode"), reader.GetNullableString("AreaCode"), reader.GetNullableString("ShelfCode"), reader.GetNullableInt32("ColumnNumber"), reader.GetNullableInt32("FloorNumber"), reader.GetNullableInt32("PositionNumber"), reader.GetNullableString("Description")));
        long total = 0; if (await reader.NextResultAsync(token) && await reader.ReadAsync(token)) total = reader.GetRequiredInt64("TotalCount");
        return new LocationWorklist(items, locations, total, page, pageSize);
    }

    private async Task<BatchLocationResult> Execute(string procedure, string userId, string? locationParameter, string? location, IReadOnlyList<BatchLocationInput> batches, CancellationToken token)
    {
        await using var connection = await factory.OpenAsync(token); await using var command = Command(connection, procedure); AddUser(command, userId);
        if (locationParameter is not null) command.Parameters.Add(locationParameter, SqlDbType.NVarChar, 50).Value = Db(location);
        command.Parameters.Add(new SqlParameter("@Batches", SqlDbType.Structured) { TypeName = "api.BatchLocationItem_v1", Value = BatchTable(batches) });
        await using var reader = await command.ExecuteReaderAsync(token); if (!await reader.ReadAsync(token)) throw new InvalidOperationException("SP vị trí không trả kết quả.");
        string? resultLocation = null; if (procedure.Contains("LOC02")) resultLocation = reader.GetNullableString("LocationCode"); else if (procedure.Contains("LOC03")) resultLocation = reader.GetNullableString("TargetLocationCode");
        return new BatchLocationResult(resultLocation, reader.GetRequiredInt32("BatchCount"), reader.GetDateTime(reader.GetOrdinal("ChangedAt")));
    }
    private SqlCommand Command(SqlConnection connection, string name) => new(name, connection) { CommandType = CommandType.StoredProcedure, CommandTimeout = options.Value.CommandTimeoutSeconds };
    private static void AddUser(SqlCommand command, string user) => command.Parameters.Add("@UserId", SqlDbType.NVarChar, 50).Value = user;
    private static object Db(string? value) => string.IsNullOrWhiteSpace(value) ? DBNull.Value : value.Trim();
    private static DataTable BatchTable(IReadOnlyList<BatchLocationInput> batches) { var table = new DataTable(); table.Columns.Add("BatchId", typeof(int)); table.Columns.Add("ExpectedLocationCode", typeof(string)); foreach (var item in batches) table.Rows.Add(item.BatchId, Db(item.ExpectedLocationCode)); return table; }
}

