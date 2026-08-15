namespace Mms.Api.Modules.LocationOperations;

public sealed record LocationBatch(int BatchId, string? MaterialId, string? MaterialName, decimal Quantity,
    string? Unit, string? WarehouseCode, string? LocationCode, DateTime? ChangedAt);
public sealed record LocationOption(string LocationCode, string? AreaCode, string? ShelfCode,
    int? ColumnNumber, int? FloorNumber, int? PositionNumber, string? Description);
public sealed record LocationWorklist(IReadOnlyList<LocationBatch> Items, IReadOnlyList<LocationOption> Locations,
    long TotalCount, int Page, int PageSize);
public sealed record BatchLocationInput(int BatchId, string? ExpectedLocationCode);
public sealed record BatchLocationRequest(string? TargetLocationCode, IReadOnlyList<BatchLocationInput> Batches);
public sealed record BatchLocationResult(string? LocationCode, int BatchCount, DateTime ChangedAt);

