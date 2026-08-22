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

public sealed record PendingWorkshopPickingItem(
    string DepartmentCode,
    string DepartmentName,
    int PendingOrders,
    decimal TotalQuantity,
    string EarliestNeededTime,
    string PriorityLevel // "URGENT" | "TODAY" | "NORMAL"
);

public sealed record StaffKpiItem(
    string StaffCode,
    string StaffName,
    string RoleOrDept,
    int CompletedCount,
    decimal TotalQuantity
);

public sealed record CriticalAlertItem(
    string AlertType, // "QC_OVERDUE" | "PUTAWAY_OVERDUE" | "PICK_OVERDUE" | "RECEIVE_OVERDUE" | "QC_REJECT"
    string Severity, // "CRITICAL" | "WARNING"
    string Title,
    string ReferenceCode,
    string DepartmentOrSupplier,
    string TimeOverdue
);

public sealed record RackGroupOccupancy(
    string GroupCode,
    string GroupName,
    int TotalLocations,
    int OccupiedLocations,
    decimal OccupancyRate
);

public sealed record StorageLiveSummary(
    int TotalLocations,
    int OccupiedLocations,
    int EmptyLocations,
    decimal OccupancyRate,
    int TotalActiveSkus,
    decimal TotalStockQuantity,
    IReadOnlyList<RackGroupOccupancy> RackGroups
);

public sealed record QualityLiveSummary(
    int InspectionsToday,
    int PassedCount,
    int RejectedCount,
    decimal PassRate
);

public sealed record CycleCountLiveSummary(
    int ActivePlans,
    int CountedBatchesToday,
    decimal AccuracyRate
);

public sealed record HourlyThroughputItem(
    string HourLabel,
    decimal InboundQty,
    decimal OutboundQty
);

public sealed record LiveActivityItem(
    long Id,
    string Type, // "INBOUND" | "OUTBOUND" | "QC" | "TRANSFER" | "COUNT"
    string Title,
    string Description,
    string? Badge,
    string TimeAgo,
    string? Actor
);

public sealed record TvDashboardOverview(
    DateTime ServerTime,
    string ShiftName,
    InboundLiveDetail Inbound,
    OutboundLiveDetail Outbound,
    StorageLiveSummary Storage,
    QualityLiveSummary Quality,
    CycleCountLiveSummary CycleCount,
    IReadOnlyList<HourlyThroughputItem> HourlyThroughput,
    IReadOnlyList<LiveActivityItem> RecentActivities,
    IReadOnlyList<StaffKpiItem> TopPickers,
    IReadOnlyList<StaffKpiItem> TopReceivers,
    IReadOnlyList<CriticalAlertItem> CriticalAlerts,
    IReadOnlyList<PendingWorkshopPickingItem> PendingWorkshops
);
