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

export interface WaitingOutboundQueueItem {
  requestId: number;
  requestCode: string;
  departmentName: string;
  receivedTime: string;
  waitDuration: string;
  waitMinutes: number;
  statusText: string;
}

export interface PickedWaitingPickupItem {
  requestId: number;
  requestCode: string;
  departmentName: string;
  completedTime: string;
  waitDuration: string;
  waitMinutes: number;
  pickerName: string;
  isOverdue2H: boolean;
}

export interface TvDashboardOverview {
  serverTime: string;
  shiftName: string;
  inbound: InboundLiveDetail;
  outbound: OutboundLiveDetail;
  waitingOutboundQueue: WaitingOutboundQueueItem[];
  pickedWaitingPickupQueue: PickedWaitingPickupItem[];
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
