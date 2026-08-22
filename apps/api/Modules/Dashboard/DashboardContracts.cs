namespace Mms.Api.Modules.Dashboard;

public sealed record InboundLiveSummary(
    int TodayReceipts,
    int PendingQc,
    int PendingPutaway,
    int CompletedToday,
    decimal TotalReceivedQty
);

public sealed record OutboundLiveSummary(
    int TodayRequests,
    int PendingApproval,
    int PickingInProgress,
    int IssuedToday,
    decimal TotalIssuedQty
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
    InboundLiveSummary Inbound,
    OutboundLiveSummary Outbound,
    StorageLiveSummary Storage,
    QualityLiveSummary Quality,
    CycleCountLiveSummary CycleCount,
    IReadOnlyList<HourlyThroughputItem> HourlyThroughput,
    IReadOnlyList<LiveActivityItem> RecentActivities
);
