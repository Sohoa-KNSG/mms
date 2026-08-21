export interface CreateBatchAuditPlanRequest {
  planName: string;
  warehouseCode?: string;
  auditType?: 'BATCH_LIST' | 'LOCATION_RANGE' | 'MATERIAL_GROUP' | 'AGING' | 'ALL';
  batchIds?: number[];
  locationPrefix?: string;
  materialId?: string;
  agingDays?: number;
  note?: string;
}

export interface CreateBatchAuditPlanResult {
  ok: boolean;
  message: string;
  planId?: number;
  planName?: string;
  totalBatches: number;
  totalSnapshotQuantity: number;
  createdAt?: string;
}

export interface BatchAuditPlanSummary {
  planId: number;
  planName: string;
  warehouseCode: string;
  auditType: string;
  statusCode: number; // 1: Đang kiểm, 2: Đã duyệt chốt, 0: Đã hủy
  totalBatches: number;
  countedBatches: number;
  discrepantBatches: number;
  totalSnapshotQuantity: number;
  totalActualQuantity: number;
  totalDifferenceQuantity: number;
  createdBy: string;
  createdAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalNote?: string | null;
  note?: string | null;
}

export interface BatchAuditPlanPage {
  items: BatchAuditPlanSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface BatchAuditDetailItem {
  detailId: number;
  planId: number;
  batchId: number;
  materialId: string;
  bravoId?: string | null;
  materialName?: string | null;
  unit?: string | null;
  locationSnapshot?: string | null;
  locationActual?: string | null;
  currentInventoryQuantity: number;
  currentLocation?: string | null;
  snapshotQuantity: number;
  actualQuantity?: number | null;
  differenceQuantity?: number | null;
  auditStatus: 'CHUA_KIEM' | 'KHOP' | 'LECH_THUA' | 'LECH_THIEU' | 'YEU_CAU_DEM_LAI';
  varianceReason?: string | null;
  lastCountedBy?: string | null;
  lastCountedAt?: string | null;
}

export interface BatchAuditLogItem {
  logId: number;
  detailId: number;
  planId: number;
  batchId: number;
  countedQuantity: number;
  unit?: string | null;
  locationScanned?: string | null;
  note?: string | null;
  countedBy: string;
  countedAt: string;
}

export interface BatchAuditPlanDetailResponse {
  plan: BatchAuditPlanSummary;
  batches: BatchAuditDetailItem[];
  logs: BatchAuditLogItem[];
}

export interface LogBatchCountRequest {
  batchId: number;
  actualQuantity: number;
  locationCode?: string;
  note?: string;
}

export interface LogBatchCountResult {
  ok: boolean;
  message: string;
  planId: number;
  detailId?: number;
  batchId: number;
  actualQuantity: number;
  differenceQuantity: number;
  auditStatus: string;
  countedBy: string;
  countedAt: string;
}

export interface BatchVarianceExplanationItem {
  detailId: number;
  varianceReason: string;
}

export interface ApproveBatchVarianceRequest {
  approvalNote: string;
  varianceExplanations?: BatchVarianceExplanationItem[];
}

export interface ApproveBatchVarianceResult {
  ok: boolean;
  message: string;
  planId: number;
  transactionDocumentId?: number;
  adjustedBatchCount: number;
  approvedBy: string;
  approvedAt: string;
}

const API_BASE = '/api/v1/inventory-operations/batch-audits';

function getAuthHeaders(): HeadersInit {
  let userId = '57';
  try {
    const saved = localStorage.getItem('mms_saved_session') || localStorage.getItem('mms_user') || localStorage.getItem('mms_current_user');
    if (saved) {
      const u = JSON.parse(saved);
      userId = u.userId || u.username || u.id || userId;
    }
  } catch {
    // ignore
  }

  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    'X-Dev-User': userId,
    'Authorization': `Bearer user-${userId}`
  };
}

export interface MaterialOption {
  materialId: string;
  bravoId?: string;
  materialName?: string;
  unit?: string;
  groupName?: string;
  systemQuantity: number;
}

export interface AvailableBatchItem {
  batchId: number;
  materialId: string;
  bravoId?: string;
  materialName?: string;
  quantity: number;
  unit?: string;
  warehouseCode?: string;
  locationCode?: string;
  inventoryStatus?: string;
  createdAt: string;
}

export const batchAuditApi = {
  getPlans: async (params?: { search?: string; statusCode?: number; page?: number; pageSize?: number }): Promise<BatchAuditPlanPage> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.statusCode !== undefined) query.append('statusCode', params.statusCode.toString());
    if (params?.page) query.append('page', params.page.toString());
    if (params?.pageSize) query.append('pageSize', params.pageSize.toString());

    const res = await fetch(`${API_BASE}?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || err.title || 'Lỗi tải danh sách kế hoạch kiểm kê batch.');
    }
    return res.json();
  },

  getPlanDetail: async (planId: number): Promise<BatchAuditPlanDetailResponse> => {
    const res = await fetch(`${API_BASE}/${planId}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || err.title || 'Lỗi tải chi tiết kế hoạch kiểm kê batch.');
    }
    return res.json();
  },

  createPlan: async (request: CreateBatchAuditPlanRequest): Promise<CreateBatchAuditPlanResult> => {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || err.title || 'Lỗi tạo kế hoạch kiểm kê batch.');
    }
    return res.json();
  },

  logCount: async (planId: number, request: LogBatchCountRequest): Promise<LogBatchCountResult> => {
    const res = await fetch(`${API_BASE}/${planId}/count`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || err.title || 'Lỗi ghi nhận số lượng đếm batch.');
    }
    return res.json();
  },

  approveVariance: async (planId: number, request: ApproveBatchVarianceRequest): Promise<ApproveBatchVarianceResult> => {
    const res = await fetch(`${API_BASE}/${planId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || err.message || err.title || 'Lỗi phê duyệt kế hoạch kiểm kê batch.');
    }
    return res.json();
  },

  getMaterials: async (search?: string): Promise<MaterialOption[]> => {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    const res = await fetch(`/api/v1/inventory-operations/cycle-count-materials?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  getBatchesByMaterial: async (materialId: string): Promise<AvailableBatchItem[]> => {
    if (!materialId) return [];
    const query = new URLSearchParams({ search: materialId.trim(), limit: '500' });
    const res = await fetch(`/api/v1/inventory-operations/batches?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const list: AvailableBatchItem[] = await res.json();
    return list.filter(b => b.materialId?.toUpperCase() === materialId.trim().toUpperCase() && b.quantity > 0);
  },
};
