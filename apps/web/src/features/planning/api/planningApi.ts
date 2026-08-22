// Material Planning API Client for UC-30, UC-31 & UC-32

export interface PlanningUnitItem {
  code: string;
  name: string;
}

export interface MonthlyQuotaItem {
  planId: number;
  planningUnit: string;
  planningUnitName?: string;
  materialId: string;
  bravoId?: string;
  materialName?: string;
  unit?: string;
  month: number;
  year: number;
  limitQuantity: number;
  requestedQuantity: number;
  issuedQuantity: number;
  remainingQuantity: number;
  consumptionPercentage: number;
  isActive: number;
  note?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  statusLevel: 'NORMAL' | 'WARNING' | 'OVER';
}

export interface MonthlyQuotaKpis {
  totalSkuCount: number;
  totalLimitQuantity: number;
  totalRequestedQuantity: number;
  totalIssuedQuantity: number;
  warningCount: number;
  overLimitCount: number;
}

export interface MonthlyQuotaPage {
  items: MonthlyQuotaItem[];
  kpis: MonthlyQuotaKpis;
  page: number;
  pageSize: number;
}

export interface BulkSaveQuotaInputItem {
  materialId: string;
  quantity: number;
  unit?: string;
  note?: string;
}

export interface BulkSaveQuotaRequest {
  planningUnit: string;
  month: number;
  year: number;
  items: BulkSaveQuotaInputItem[];
}

export interface BulkSaveQuotaResult {
  isSuccess: boolean;
  planningUnit: string;
  month: number;
  year: number;
  insertedCount: number;
  updatedCount: number;
  totalProcessed: number;
}

export interface ValidatePasteItemInput {
  rawMaterialCode: string;
  rawQuantity: number;
  rawUnit?: string;
  rawNote?: string;
}

export interface ValidatePasteItemResult {
  rowIndex: number;
  rawMaterialCode: string;
  isValid: boolean;
  errorMessage?: string;
  materialId?: string;
  bravoId?: string;
  materialName?: string;
  unit?: string;
  quantity: number;
  note?: string;
  isDuplicate: boolean;
}

export interface ValidatePasteResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  items: ValidatePasteItemResult[];
}

export interface CopyPreviousMonthRequest {
  planningUnit: string;
  sourceMonth: number;
  sourceYear: number;
  targetMonth: number;
  targetYear: number;
}

export interface CopyPreviousMonthResult {
  isSuccess: boolean;
  planningUnit: string;
  targetMonth: number;
  targetYear: number;
  copiedCount: number;
}

export interface QuotaUsageHistoryHeader {
  planId: number;
  planningUnit: string;
  planningUnitName?: string;
  materialId: string;
  bravoId?: string;
  materialName?: string;
  unit?: string;
  month: number;
  year: number;
  limitQuantity: number;
  requestedQuantity: number;
  issuedQuantity: number;
  remainingQuantity: number;
  consumptionPercentage: number;
  isActive: number;
  note?: string;
}

export interface QuotaUsageHistoryItem {
  requestId: number;
  requestCode: string;
  requestLineId: number;
  requestedQuantity: number;
  unit?: string;
  requester?: string;
  departmentCode?: string;
  requestDate?: string;
  requestStatus?: string;
  pickingStatus?: string;
  issueDocumentId?: number;
  issuedQuantity: number;
  note?: string;
}

export interface QuotaUsageHistoryResponse {
  header: QuotaUsageHistoryHeader;
  requests: QuotaUsageHistoryItem[];
}

export interface ThreeWayReconciliationItem {
  materialId: string;
  bravoId?: string;
  materialName?: string;
  unit?: string;
  planMonth: number;
  planYear: number;
  plannedQuota: number;
  requestedQuantity: number;
  issuedQuantity: number;
  remainingQuota: number;
  poOrderedQuantity: number;
  receivedQuantity: number;
  inTransitQuantity: number;
  availableInventory: number;
  purchaseRecommendationGap: number;
  balanceStatusCode: 'SHORTAGE' | 'OVERSTOCK' | 'BALANCED';
  supplyFulfillmentRate: number;
  consumptionRate: number;
}

export interface ThreeWayReconciliationKpis {
  totalSkuCount: number;
  totalPlannedQuota: number;
  totalIssuedQuantity: number;
  totalPoQuantity: number;
  totalAvailableInventory: number;
  shortageCount: number;
  overstockCount: number;
  totalPurchaseGap: number;
}

export interface ThreeWayReconciliationPage {
  items: ThreeWayReconciliationItem[];
  kpis: ThreeWayReconciliationKpis;
  page: number;
  pageSize: number;
}

function getAuthHeaders(): Record<string, string> {
  let userId = '57';
  try {
    const saved = localStorage.getItem('mms_saved_session') || localStorage.getItem('mms_warehouse_v1_currentUser') || localStorage.getItem('mms_user') || localStorage.getItem('mms_current_user');
    if (saved) {
      const u = JSON.parse(saved);
      userId = u.userId || u.username || u.id || u.msnv || userId;
    }
  } catch {}

  const token = localStorage.getItem('mms_token');
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-User-Id': userId,
    'X-Dev-User': userId,
    ...(token ? { 'Authorization': `Bearer ${token}` } : { 'Authorization': `Bearer user-${userId}` })
  };
}

const API_BASE = '/api/v1/planning';

export const planningService = {
  async getPlanningUnits(): Promise<PlanningUnitItem[]> {
    const res = await fetch(`${API_BASE}/planning-units`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Không thể tải danh mục đơn vị kế hoạch');
    return await res.json();
  },

  async getMonthlyQuota(
    planningUnit?: string,
    month?: number,
    year?: number,
    search?: string,
    statusFilter?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<MonthlyQuotaPage> {
    const params = new URLSearchParams();
    if (planningUnit && planningUnit !== 'ALL') params.append('planningUnit', planningUnit);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (search && search.trim()) params.append('search', search.trim());
    if (statusFilter && statusFilter !== 'ALL') params.append('statusFilter', statusFilter);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`${API_BASE}/quotas?${params.toString()}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Không thể tải danh sách định mức tháng');
    return await res.json();
  },

  async validatePasteData(items: ValidatePasteItemInput[]): Promise<ValidatePasteResult> {
    const res = await fetch(`${API_BASE}/quotas/validate-paste`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(items)
    });
    if (!res.ok) throw new Error('Không thể đối soát dữ liệu dán');
    return await res.json();
  },

  async bulkSaveQuota(request: BulkSaveQuotaRequest): Promise<BulkSaveQuotaResult> {
    const res = await fetch(`${API_BASE}/quotas/bulk-save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.title || 'Lỗi khi lưu bảng định mức');
    }
    return await res.json();
  },

  async copyPreviousMonthQuota(request: CopyPreviousMonthRequest): Promise<CopyPreviousMonthResult> {
    const res = await fetch(`${API_BASE}/quotas/copy-previous-month`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.title || 'Lỗi khi sao chép định mức từ tháng trước');
    }
    return await res.json();
  },

  async toggleQuotaStatus(planId: number, isActive: number): Promise<{ planId: number; isActive: number }> {
    const res = await fetch(`${API_BASE}/quotas/${planId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ isActive })
    });
    if (!res.ok) throw new Error(`Lỗi cập nhật trạng thái định mức #${planId}`);
    return await res.json();
  },

  async getQuotaUsageHistory(planId: number): Promise<QuotaUsageHistoryResponse> {
    const res = await fetch(`${API_BASE}/quotas/${planId}/usage-history`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error(`Không thể tải lịch sử sử dụng định mức #${planId}`);
    return await res.json();
  },

  async get3WayReconciliation(
    month?: number,
    year?: number,
    balanceStatus?: string,
    search?: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<ThreeWayReconciliationPage> {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    if (balanceStatus && balanceStatus !== 'ALL') params.append('balanceStatus', balanceStatus);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`${API_BASE}/reconciliation?${params.toString()}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    if (!res.ok) throw new Error('Không thể tải bảng đối soát 3 chiều');
    return await res.json();
  }
};
