// Quality Control Service for UC-13 & UC-14 (QC-03 & QC-04)

export interface InspectionCandidateReceipt {
  receiptId: number;
  purchaseOrder?: string;
  customerName?: string;
  warehouseCode?: string;
  receiptStatus?: string;
  receivedAt?: string;
  pendingMaterialCount: number;
}

export interface InspectionCandidateMaterial {
  receivingLineId: number;
  receiptId: number;
  materialId: string;
  materialName: string;
  quantityReceived: number;
  unit: string;
  checkId: number;
  qcGroupCode?: string;
  qcGroupName?: string;
}

export interface InspectionCandidatesResult {
  receipts: InspectionCandidateReceipt[];
  materials: InspectionCandidateMaterial[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CreateInspectionRequest {
  receiptId: number;
  note?: string;
}

export interface CreateInspectionResult {
  inspectionId: number;
  receiptId: number;
  isExisting: boolean;
  status: number;
  createdAt: string;
}

export interface EvaluationCriterion {
  receivingLineId: number;
  criterionId: number;
  criterionCode: string;
  criterionName: string;
  specification?: string;
  sampleImage?: string;
  resultCode?: string;
  defectNote?: string;
}

export interface EvaluationMaterialLine {
  receivingLineId: number;
  materialId: string;
  materialName: string;
  quantityReceived: number;
  unit: string;
  overallResultCode?: string;
  checkId: number;
}

export interface EvaluationDetailResult {
  inspection: {
    inspectionId: number;
    receiptId: number;
    status: number;
    note?: string;
    createdBy?: string;
    createdAt: string;
    purchaseOrder?: string;
    customerName?: string;
  };
  materials: EvaluationMaterialLine[];
  criteria: EvaluationCriterion[];
}

export interface QcEvaluationItemInput {
  criterionId: number;
  resultCode: 'Đạt' | 'Không Đạt' | 'Không Kiểm';
  defectNote?: string;
}

export interface EvaluateMaterialRequest {
  receivingLineId: number;
  inspectionType: 'AQL' | '100%';
  inspectedQuantity: number;
  failedQuantity: number;
  overallResultCode: '1' | '2' | '3'; // 1: Đạt, 2: Không Đạt, 3: Nhân Nhượng
  results: QcEvaluationItemInput[];
}

export interface EvaluateMaterialResult {
  inspectionId: number;
  receivingLineId: number;
  overallResultCode: string;
  resultCount: number;
  evaluatedAt: string;
}

export interface InspectionHistoryItem {
  inspectionId: number;
  receiptId?: number;
  purchaseOrder?: string;
  customerName?: string;
  status: number;
  note?: string;
  createdBy?: string;
  createdAt?: string;
  evaluatedMaterialCount: number;
  resultRowCount: number;
}

export interface InspectionResultDetail {
  qcResultId: number;
  inspectionId?: number;
  receivingLineId?: number;
  materialId?: string;
  materialName?: string;
  criterionId?: number;
  criterionCode?: string;
  criterionName?: string;
  inspectionType?: string;
  inspectedQuantity?: number;
  failedQuantity?: number;
  resultCode?: string;
  overallResultCode?: string;
  defectNote?: string;
  unit?: string;
  actorId?: string;
  changedAt?: string;
  isLocked: boolean;
}

export interface InspectionHistoryResult {
  items: InspectionHistoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  details: InspectionResultDetail[];
}

export const qualityService = {
  /**
   * UC-13 / QC-03: Get list of candidate receipts and materials waiting for QC
   */
  async getInspectionCandidates(search?: string, receiptId?: number, page: number = 1, pageSize: number = 20): Promise<InspectionCandidatesResult> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (receiptId && receiptId > 0) params.append('receiptId', receiptId.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`/api/v1/quality/inspection-candidates?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách chờ kiểm QC: HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      receipts: data.receipts || data.items || [],
      materials: data.materials || data.lines || [],
      totalCount: data.totalCount || 0,
      page: data.page || page,
      pageSize: data.pageSize || pageSize,
    };
  },

  /**
   * UC-13 / QC-03: Create a new inspection ticket for a receiving receipt
   */
  async createInspection(request: CreateInspectionRequest): Promise<CreateInspectionResult> {
    const res = await fetch('/api/v1/quality/inspections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.errors ? Object.values(err.errors).flat().join(', ') : err.detail || err.title || `Lỗi HTTP ${res.status}`;
      throw new Error(msg);
    }

    return await res.json();
  },

  /**
   * UC-14 / QC-04: Get detailed criteria and material lines for evaluation
   */
  async getEvaluation(inspectionId: number, receivingLineId?: number): Promise<EvaluationDetailResult> {
    const params = new URLSearchParams();
    if (receivingLineId && receivingLineId > 0) params.append('receivingLineId', receivingLineId.toString());

    const res = await fetch(`/api/v1/quality/inspections/${inspectionId}/evaluation?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải thông tin tiêu chí QC phiếu #${inspectionId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-14 / QC-04: Submit evaluation result for a material line
   */
  async evaluateMaterial(inspectionId: number, request: EvaluateMaterialRequest): Promise<EvaluateMaterialResult> {
    const res = await fetch(`/api/v1/quality/inspections/${inspectionId}/evaluation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err.errors ? Object.values(err.errors).flat().join(', ') : err.detail || err.title || `Lỗi HTTP ${res.status}`;
      throw new Error(msg);
    }

    return await res.json();
  },

  /**
   * QC-05: Get inspection history
   */
  async getInspectionHistory(search?: string, inspectionId?: number, page: number = 1, pageSize: number = 20): Promise<InspectionHistoryResult> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (inspectionId && inspectionId > 0) params.append('inspectionId', inspectionId.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`/api/v1/quality/inspections/history?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải lịch sử kiểm tra QC: HTTP ${res.status}`);
    }

    return await res.json();
  }
};
