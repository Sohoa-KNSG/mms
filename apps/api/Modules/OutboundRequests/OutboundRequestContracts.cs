namespace Mms.Api.Modules.OutboundRequests;

public sealed record OutboundCatalogItem(int? PlanId, string? PlanningUnit, string MaterialId,
    string? BravoId, string? MaterialName, string? Unit, decimal? LimitQuantity,
    decimal UsedQuantity, decimal? RemainingQuantity, string? PlanMonth, string? PlanYear, string? Note);
public sealed record PlanningUnitOption(string PlanningUnit, string? PlanningUnitName);
public sealed record DestinationOption(string? PlanningUnit, string DestinationBravoCode, string? DestinationName);
public sealed record OutboundCatalog(IReadOnlyList<OutboundCatalogItem> Items,
    IReadOnlyList<PlanningUnitOption> PlanningUnits, IReadOnlyList<DestinationOption> Destinations,
    long TotalCount, int Page, int PageSize);

public sealed record OutboundRequestItemInput(int? PlanId, string MaterialId, string? BravoId,
    string? MaterialName, decimal Quantity, string? Unit, string? Note, string? DestinationBravoCode);
public sealed record CreateOutboundRequest(string PlanningUnit, DateTime NeededAt,
    string? DestinationBravoCode, string? DestinationName, IReadOnlyList<OutboundRequestItemInput> Items);
public sealed record CreatedOutboundRequest(int RequestId, int FlowId, string Classification,
    int ApprovalRunId, int CurrentApprovalStep, int TotalApprovalSteps, DateTime CreatedAt);

public sealed record OutboundRequestHeader(int RequestId, string? DepartmentCode, string? RequesterName,
    DateTime? CreatedAt, DateTime? ChangedAt, int? FlowId, string? Classification,
    string? PlanningUnit, DateTime? NeededAt, string? DestinationBravoCode, string? DestinationName,
    string? RequestStatusCode, string? PickingStatusCode, string ApprovalStatus,
    int? CurrentApprovalStep, int? TotalApprovalSteps, bool CanEdit, bool CanCancel, bool CanApprove);
public sealed record OutboundRequestLine(int LineId, int? PlanId, string? MaterialId, string? BravoId,
    string? MaterialName, decimal Quantity, string? Unit, DateTime? NeededAt, string? Note,
    string? DestinationBravoCode);
public sealed record ApprovalHistory(int ApprovalRunId, int? ApprovalStep, int? TotalApprovalSteps,
    string? ApproverEmployeeCode, string? ApproverName, string? ApproverMail, string? ApproverRank,
    string? Decision, DateTime? DecidedAt, string? Note);
public sealed record OutboundRequestDetail(OutboundRequestHeader Header,
    IReadOnlyList<OutboundRequestLine> Lines, IReadOnlyList<ApprovalHistory> Approvals);

public sealed record SaveOutboundRequest(DateTime NeededAt, string? DestinationBravoCode,
    string? DestinationName, DateTime ExpectedChangedAt, IReadOnlyList<OutboundRequestItemInput> Items);
public sealed record ChangedOutboundRequest(int RequestId, DateTime ChangedAt);
public sealed record OutboundRequestQueueItem(int RequestId, string? DepartmentCode, string? RequesterName,
    DateTime? CreatedAt, DateTime? ChangedAt, int? FlowId, string? Classification,
    string? PlanningUnit, DateTime? NeededAt, string? DestinationBravoCode, string? DestinationName,
    string? RequestStatusCode, string? PickingStatusCode, string ApprovalStatus,
    int? CurrentApprovalStep, int? TotalApprovalSteps, int LineCount, decimal TotalQuantity,
    bool CanEdit, bool CanCancel, bool CanApprove);
public sealed record OutboundRequestQueue(IReadOnlyList<OutboundRequestQueueItem> Items,
    long TotalCount, int Page, int PageSize);
public sealed record DecideOutboundRequest(int ApprovalRunId, string Decision, string? Note);
public sealed record DecidedOutboundRequest(int RequestId, string Decision, int DecidedStep,
    int TotalApprovalSteps, int? NextApprovalRunId, bool IsFinal, DateTime ChangedAt);
public sealed record CancelOutboundRequest(string Reason, DateTime ExpectedChangedAt);
