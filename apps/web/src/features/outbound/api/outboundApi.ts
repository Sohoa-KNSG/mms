// Outbound & Issue Request API Service for MMS (UC-09 to UC-13 / OUT-01 to OUT-09)
// Directly maps real database records from dbo.tbl_phieu_yeucau, dbo.tbl_phieu_yeucau_chitiet & dbo.tbl_map_xuatkho

export interface OutboundQueueItem {
  requestId: number;
  departmentCode: string;
  requesterName: string;
  createdAt: string;
  changedAt?: string;
  flowId?: number;
  classification?: string;
  planningUnit?: string;
  neededAt?: string;
  destinationBravoCode?: string;
  destinationName?: string;
  requestStatusCode?: string;
  pickingStatusCode?: string;
  approvalStatus: 'pending' | 'approve' | 'reject' | 'cancelled';
  currentApprovalStep?: number;
  totalApprovalSteps?: number;
  lineCount: number;
  totalQuantity: number;
  canEdit: boolean;
  canCancel: boolean;
  canApprove: boolean;
}

export interface OutboundRequestLine {
  lineId: number;
  planId?: number;
  materialId?: string;
  bravoId?: string;
  materialName?: string;
  quantity: number;
  unit?: string;
  neededAt?: string;
  note?: string;
  destinationBravoCode?: string;
}

export interface OutboundApprovalHistory {
  approvalRunId: number;
  approvalStep?: number;
  totalApprovalSteps?: number;
  approverEmployeeCode?: string;
  approverName?: string;
  approverMail?: string;
  approverRank?: string;
  decision?: string;
  decidedAt?: string;
  note?: string;
}

export interface OutboundRequestDetail {
  header: OutboundQueueItem;
  lines: OutboundRequestLine[];
  approvals: OutboundApprovalHistory[];
}

export interface OutboundQueueResult {
  items: OutboundQueueItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const API_BASE = '/api/v1/outbound-requests';
const PICKING_API_BASE = '/api/v1/outbound-picking';

function getAuthHeaders(): HeadersInit {
  let userId = '57';
  try {
    const saved = localStorage.getItem('mms_saved_session') || localStorage.getItem('mms_warehouse_v1_currentUser') || localStorage.getItem('mms_user') || localStorage.getItem('mms_current_user');
    if (saved) {
      const u = JSON.parse(saved);
      userId = u.userId || u.username || u.id || u.msnv || userId;
    }
  } catch {}

  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    'X-Dev-User': userId,
    'Authorization': `Bearer user-${userId}`
  };
}

export const outboundService = {
  // Lấy danh sách hàng đợi đề nghị xuất kho thực tế (dbo.tbl_phieu_yeucau)
  async getQueue(search?: string, status?: string, fromDate?: string, toDate?: string, page = 1, pageSize = 200): Promise<OutboundQueueResult> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`${API_BASE}?${params.toString()}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi tải danh sách đề nghị xuất kho từ MMS1.');
    }

    return res.json();
  },

  // Lấy chi tiết một phiếu đề nghị xuất kho kèm danh sách vật tư & lịch sử duyệt (Dành cho bộ phận đề nghị/duyệt)
  async getRequestDetail(requestId: number): Promise<OutboundRequestDetail> {
    const res = await fetch(`${API_BASE}/${requestId}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Lỗi tải chi tiết phiếu đề nghị #${requestId}.`);
    }

    return res.json();
  },

  // Lấy chi tiết phiếu soạn hàng xuất kho kèm tồn khả dụng (Dành cho Thủ kho / PDA Outbound Picking OUT-06)
  async getPickingRequest(requestId: number): Promise<OutboundRequestDetail> {
    const res = await fetch(`${PICKING_API_BASE}/requests/${requestId}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      // Fallback sang getRequestDetail nếu có lỗi
      return this.getRequestDetail(requestId);
    }

    const data = await res.json();
    const lines = (data.lines || []).map((ln: any) => ({
      lineId: ln.lineId,
      materialId: ln.materialId,
      bravoId: ln.bravoId,
      materialName: ln.materialName,
      quantity: ln.requestedQuantity ?? ln.quantity ?? 0,
      requestedQuantity: ln.requestedQuantity ?? ln.quantity ?? 0,
      issuedQuantity: ln.issuedQuantity ?? 0,
      remainingQuantity: ln.remainingQuantity ?? 0,
      availableQuantity: ln.availableQuantity ?? 0,
      unit: ln.unit,
      destinationBravoCode: ln.destinationBravoCode,
      note: ln.note
    }));

    return {
      header: data.header,
      lines,
      approvals: []
    };
  },

  // Duyệt phiếu đề nghị xuất kho (Phê duyệt cấp Quản đốc / BGD)
  async decideRequest(requestId: number, approvalRunId: number, decision: 'approve' | 'reject', note?: string) {
    const res = await fetch(`${API_BASE}/${requestId}/decision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ approvalRunId, decision, note })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi xử lý duyệt phiếu xuất kho.');
    }

    return res.json();
  },

  // Hủy phiếu đề nghị xuất kho
  async cancelRequest(requestId: number, note?: string) {
    const res = await fetch(`${API_BASE}/${requestId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ note })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi hủy phiếu xuất kho.');
    }

    return res.json();
  },

  // Bắt đầu soạn hàng (Ghi nhận trạng thái Đang Soạn vào CSDL MMS1)
  async startPicking(requestId: number) {
    const res = await fetch(`${PICKING_API_BASE}/requests/${requestId}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi bắt đầu soạn hàng.');
    }

    return res.json();
  },

  // Lấy danh sách các Lô có thể lấy theo FIFO cho 1 dòng vật tư (OUT-07)
  async getPickableBatches(requestId: number, lineId: number) {
    const res = await fetch(`${PICKING_API_BASE}/requests/${requestId}/lines/${lineId}/batches`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi tải danh sách Lô hàng tồn kho.');
    }

    return res.json();
  },

  // Quét nhặt một Lô hàng (OUT-07)
  async pickBatch(requestId: number, lineId: number, data: { batchId: number; quantity: number; expectedBatchQuantity: number; expectedLocationCode?: string }) {
    const res = await fetch(`${PICKING_API_BASE}/requests/${requestId}/lines/${lineId}/pick`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi ghi nhận nhặt Lô hàng.');
    }

    return res.json();
  },

  // Hoàn tất soạn toàn bộ đơn xuất kho (OUT-08)
  async completeGoodsIssue(requestId: number) {
    const res = await fetch(`${PICKING_API_BASE}/requests/${requestId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi hoàn tất xuất kho.');
    }

    return res.json();
  },

  // Lấy danh sách phiếu xuất kho đã lập (OUT-09)
  async getIssueDocuments(search?: string, page = 1, pageSize = 50) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`${PICKING_API_BASE}/documents?${params.toString()}`, {
      headers: getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi tải danh sách phiếu xuất kho.');
    }

    return res.json();
  }
};
