// TV Dashboard API Client for UC-29 / DASH-01

export interface InboundLiveSummary {
  todayReceipts: number;
  pendingQc: number;
  pendingPutaway: number;
  completedToday: number;
  totalReceivedQty: number;
}

export interface OutboundLiveSummary {
  todayRequests: number;
  pendingApproval: number;
  pickingInProgress: number;
  issuedToday: number;
  totalIssuedQty: number;
}

export interface RackGroupOccupancy {
  groupCode: string;
  groupName: string;
  totalLocations: number;
  occupiedLocations: number;
  occupancyRate: number;
}

export interface StorageLiveSummary {
  totalLocations: number;
  occupiedLocations: number;
  emptyLocations: number;
  occupancyRate: number;
  totalActiveSkus: number;
  totalStockQuantity: number;
  rackGroups: RackGroupOccupancy[];
}

export interface QualityLiveSummary {
  inspectionsToday: number;
  passedCount: number;
  rejectedCount: number;
  passRate: number;
}

export interface CycleCountLiveSummary {
  activePlans: number;
  countedBatchesToday: number;
  accuracyRate: number;
}

export interface HourlyThroughputItem {
  hourLabel: string;
  inboundQty: number;
  outboundQty: number;
}

export interface LiveActivityItem {
  id: number;
  type: 'INBOUND' | 'OUTBOUND' | 'QC' | 'TRANSFER' | 'COUNT';
  title: string;
  description: string;
  badge?: string;
  timeAgo: string;
  actor?: string;
}

export interface TvDashboardOverview {
  serverTime: string;
  shiftName: string;
  inbound: InboundLiveSummary;
  outbound: OutboundLiveSummary;
  storage: StorageLiveSummary;
  quality: QualityLiveSummary;
  cycleCount: CycleCountLiveSummary;
  hourlyThroughput: HourlyThroughputItem[];
  recentActivities: LiveActivityItem[];
}

export const tvDashboardService = {
  async getOverview(): Promise<TvDashboardOverview> {
    const res = await fetch('/api/v1/dashboard/tv-overview', {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải dữ liệu TV Dashboard: HTTP ${res.status}`);
    }

    return await res.json();
  }
};
