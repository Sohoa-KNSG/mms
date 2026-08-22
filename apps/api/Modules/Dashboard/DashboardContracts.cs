namespace Mms.Api.Modules.Dashboard;

public sealed record InboundLiveDetail(
    int TotalReceipts,
    int TodayReceipts,
    int PendingQc,
    int PendingQcOverdue1Day,
    int QcPassedPendingPutaway,
    int PutawayOverdue1Day,
    int BatchesNotOnRack,
    decimal TotalQtyNotOnRack,
    int QcFailedPendingHandling,
    int CompletedReceipts,
    decimal TotalReceivedQty
);

public sealed record OutboundLiveDetail(
    int TotalRequests,
    int TodayRequests,
    int PendingApproval,
    int WaitingPick,
    int WaitingPickOverdue1Day,
    int PickingInProgress,
    int PickedCompleted,
    int PickedOverdue2Hours,
    int ReceivedByWorkshop,
    decimal TotalIssuedQty
);

public sealed record WaitingOutboundQueueItem(
    int RequestId,
    string RequestCode,
    string DepartmentName,
    string ReceivedTime,
    string WaitDuration,
    int WaitMinutes,
    string StatusText
);

public sealed record PickedWaitingPickupItem(
    int RequestId,
    string RequestCode,
    string DepartmentName,
    string CompletedTime,
    string WaitDuration,
    int WaitMinutes,
    string PickerName,
    bool IsOverdue2H
);

public sealed record TvDashboardOverview(
    DateTime ServerTime,
    string ShiftName,
    InboundLiveDetail Inbound,
    OutboundLiveDetail Outbound,
    IReadOnlyList<WaitingOutboundQueueItem> WaitingOutboundQueue,
    IReadOnlyList<PickedWaitingPickupItem> PickedWaitingPickupQueue
);
