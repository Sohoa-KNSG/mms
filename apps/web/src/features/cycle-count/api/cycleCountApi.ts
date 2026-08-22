export interface CycleCountPlanSummary {
  planId: number;
  materialId: string;
  materialName?: string;
  unit?: string;
  systemQuantity: number;
  bookQuantity: number;
  actualQuantity: number;
  differenceQuantity: number;
  startedAt?: string;
  finishedAt?: string;
  note?: string;
  statusCode?: string;
  createdBy?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  batchCount: number;
  countLogCount: number;
}

export interface CycleCountBatchItem {
  detailId: number;
  planId: number;
  batchId: number;
  bravoId?: string;
  systemQuantity: number;
  unit?: string;
  locationCode?: string;
  locationName?: string;
  batchCreatedAt?: string;
  actualQuantity: number;
  countTimes: number;
  isCounted: boolean;
}

export interface CycleCountLogItem {
  logId: number;
  detailId: number;
  batchId: number;
  quantity: number;
  unit?: string;
  locationCode?: string;
  locationName?: string;
  createdBy: string;
  createdAt: string;
}

export interface CycleCountPlanDetail {
  plan: CycleCountPlanSummary | null;
  batches: CycleCountBatchItem[];
  logs: CycleCountLogItem[];
}

export interface CreateCycleCountPlanInput {
  materialId: string;
  bookQuantity: number;
  startedAt?: string;
}

export interface CreateCycleCountPlanResult {
  ok: boolean;
  message: string;
  planId?: number;
  materialId?: string;
  systemQuantity?: number;
  bookQuantity?: number;
  batchCount?: number;
}

export interface LogCycleCountInput {
  detailId: number;
  batchId: number;
  actualQuantity: number;
  unit?: string;
  locationCode?: string;
}

export interface LogCycleCountResult {
  ok: boolean;
  message: string;
  detailId: number;
  batchId: number;
  actualQuantity: number;
  newBatchId?: number;
}

export interface FinishCycleCountResult {
  ok: boolean;
  message: string;
}

const API_BASE = '/api/v1/inventory-operations';

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

export interface WarehouseLocationOption {
  locationCode: string;
  areaCode?: string | null;
  shelfCode?: string | null;
  columnNumber?: number | null;
  floorNumber?: number | null;
  positionNumber?: number | null;
  description?: string | null;
  batchCount?: number;
  totalQuantity?: number;
  materialPreview?: string | null;
}

export interface CycleCountMaterialOption {
  materialId: string;
  bravoId?: string;
  materialName?: string;
  unit?: string;
  groupName?: string;
  systemQuantity: number;
  batchCount?: number;
}

export const cycleCountService = {
  // Lấy danh mục ô kệ thực tế từ tbl_dm_location
  async getLocations(search?: string, areaCode?: string): Promise<WarehouseLocationOption[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (areaCode) params.append('areaCode', areaCode);

    const url = `${API_BASE}/locations?${params.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi tải danh mục vị trí ô kệ.');
    }
    return res.json();
  },

  // Lấy danh sách Lô (Batch) đang lưu trong một vị trí ô kệ
  async getLocationBatches(locationCode: string): Promise<any[]> {
    const url = `${API_BASE}/locations/${encodeURIComponent(locationCode)}/batches`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Lỗi tải danh sách Lô tại ô ${locationCode}.`);
    }
    return res.json();
  },

  // Lấy danh mục vật tư từ tbl_dm_vattu cho combobox
  async getMaterials(search?: string): Promise<CycleCountMaterialOption[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);

    const url = `${API_BASE}/cycle-count-materials?${params.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi tải danh mục vật tư.');
    }
    return res.json();
  },

  // Lấy danh sách kế hoạch kiểm kê (sp_kiemke_danhsach_kh)
  async getPlans(search?: string, statusCode?: string): Promise<CycleCountPlanSummary[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statusCode) params.append('statusCode', statusCode);

    const url = `${API_BASE}/cycle-counts?${params.toString()}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi tải danh sách kế hoạch kiểm kê.');
    }
    return res.json();
  },

  // Lấy chi tiết kế hoạch kiểm kê & các batch (sp_kiemke_chitiet_kh)
  async getPlanDetail(planId: number): Promise<CycleCountPlanDetail> {
    const res = await fetch(`${API_BASE}/cycle-counts/${planId}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Lỗi tải chi tiết kế hoạch kiểm kê #${planId}.`);
    }
    return res.json();
  },

  // Tạo mới kế hoạch kiểm kê (sp_kiemke_tao_kehoach)
  async createPlan(input: CreateCycleCountPlanInput): Promise<CreateCycleCountPlanResult> {
    const res = await fetch(`${API_BASE}/cycle-counts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi tạo kế hoạch kiểm kê.');
    }
    return res.json();
  },

  // Ghi nhận số lượng kiểm đếm thực tế hiện trường
  async logCount(planId: number, input: LogCycleCountInput): Promise<LogCycleCountResult> {
    const res = await fetch(`${API_BASE}/cycle-counts/${planId}/log`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi ghi nhận số lượng kiểm kê.');
    }
    return res.json();
  },

  // 1. Nhân viên báo đã kiểm xong (Chờ Trưởng phòng duyệt)
  async submitCounted(planId: number): Promise<{ ok: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/cycle-counts/${planId}/submit-counted`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi gửi báo cáo kiểm xong.');
    }
    return res.json();
  },

  // 2. Trưởng phòng phê duyệt và chốt sổ kế hoạch kiểm kê (INV-09)
  async approvePlan(planId: number): Promise<{ ok: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/cycle-counts/${planId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi phê duyệt kế hoạch kiểm kê.');
    }
    return res.json();
  },

  // 3. Trưởng phòng yêu cầu kiểm lại (Mở lại kế hoạch)
  async reopenPlan(planId: number): Promise<{ ok: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/cycle-counts/${planId}/reopen`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi mở lại kế hoạch kiểm kê.');
    }
    return res.json();
  },

  // Hoàn thành kế hoạch kiểm kê (INV-09 Legacy Alias)
  async finishPlan(planId: number): Promise<FinishCycleCountResult> {
    const res = await fetch(`${API_BASE}/cycle-counts/${planId}/finish`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi hoàn thành kế hoạch kiểm kê.');
    }
    return res.json();
  },

  // Xóa kế hoạch kiểm kê khi chưa có lượt kiểm đếm
  async deletePlan(planId: number): Promise<{ isSuccess: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/cycle-counts/${planId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Lỗi xóa kế hoạch kiểm kê.');
    }
    return res.json();
  }
};
