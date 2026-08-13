namespace Mms.Api.Contracts;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, long TotalCount, int Page, int PageSize);

