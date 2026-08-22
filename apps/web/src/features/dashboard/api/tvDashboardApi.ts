// TV Dashboard API Client for UC-29 / DASH-01

export interface InboundLiveDetail {
  totalReceipts: number;
  todayReceipts: number;
  pendingQc: number;
  pendingQcOverdue1Day: number;
  qcPassedPendingPutaway: number;
  putawayOverdue1Day: number;
  batchesNotOnRack: number;
  totalQtyNotOnRack: number;
  qcFailedPendingHandling: number;
  completedReceipts: number;
  totalReceivedQty: number;
}

export interface OutboundLiveDetail {
  totalRequests: number;
  todayRequests: number;
  pendingApproval: number;
  waitingPick: number;
  waitingPickOverdue1Day: number;
  pickingInProgress: number;
  pickedCompleted: number;
  pickedOverdue2Hours: number;
  receivedByWorkshop: number;
  totalIssuedQty: number;
}

export interface PendingWorkshopPickingItem {
  departmentCode: string;
  departmentName: string;
  pendingOrders: number;
  totalQuantity: number;
  earliestNeededTime: string;
  priorityLevel: 'URGENT' | 'TODAY' | 'NORMAL';
}

export interface StaffKpiItem {
  staffCode: string;
  staffName: string;
  roleOrDept: string;
  completedCount: number;
  totalQuantity: number;
}

export interface CriticalAlertItem {
  alertType: string;
  severity: 'CRITICAL' | 'WARNING';
  title: string;
  referenceCode: string;
  departmentOrSupplier: string;
  timeOverdue: string;
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
  inbound: InboundLiveDetail;
  outbound: OutboundLiveDetail;
  storage: StorageLiveSummary;
  quality: QualityLiveSummary;
  cycleCount: CycleCountLiveSummary;
  hourlyThroughput: HourlyThroughputItem[];
  recentActivities: LiveActivityItem[];
  topPickers: StaffKpiItem[];
  topReceivers: StaffKpiItem[];
  criticalAlerts: CriticalAlertItem[];
  pendingWorkshops: PendingWorkshopPickingItem[];
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
