export interface SplitBatchV2Request {
    splitQuantity: number;
    targetLocation?: string;
}

export interface SplitBatchV2Result {
    isSuccess: boolean;
    message: string;
    newBatchId?: number;
}

export interface BatchGenealogyNode {
    batchId: number;
    parentBatchId?: number;
    materialId: string;
    quantity: number;
    createdAt: string;
    locationCode?: string;
    level: number;
}

export interface SplittableBatchItem {
    batchId: number;
    receivingLineId?: number;
    warehouseCode?: string;
    materialId?: string;
    bravoId?: string;
    materialName?: string;
    quantity: number;
    unit?: string;
    locationCode?: string;
    inventoryStatusCode?: string;
    transactionBalance?: number;
    isBalanced?: boolean;
    changedAt?: string;
}

export interface SplittableBatchPage {
    items: SplittableBatchItem[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface RelocateBatchItemInput {
    batchId: number;
    expectedLocationCode?: string;
}

export interface RelocateBatchRequest {
    targetLocationCode: string;
    batches: RelocateBatchItemInput[];
}

export interface RelocateBatchResult {
    locationCode?: string;
    batchCount: number;
    changedAt: string;
}

const API_BASE = '/api/v1/inventory-operations';

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

export const getSplittableBatches = async (search?: string, batchId?: number, page: number = 1, pageSize: number = 100): Promise<SplittableBatchPage> => {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (batchId && batchId > 0) params.append('batchId', batchId.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await fetch(`${API_BASE}/splittable-batches?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || err.detail || 'Lỗi khi tải danh sách lô có thể tách.');
    }

    return await response.json();
};

export const splitBatchV2 = async (batchId: number, request: SplitBatchV2Request): Promise<SplitBatchV2Result> => {
    const response = await fetch(`${API_BASE}/batches/${batchId}/split-v2`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
    });
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || 'Lỗi khi tách batch');
    }
    
    return await response.json();
};

export const getBatchGenealogy = async (batchId: number): Promise<BatchGenealogyNode[]> => {
    const response = await fetch(`${API_BASE}/batches/${batchId}/genealogy`, {
        method: 'GET',
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || 'Lỗi khi tải gia phả batch');
    }
    
    return await response.json();
};

export const relocateBatches = async (request: RelocateBatchRequest): Promise<RelocateBatchResult> => {
    const token = localStorage.getItem('mms_token');
    const response = await fetch('/api/v1/location-operations/relocation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(request)
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.errors ? Object.values(err.errors).flat().join(', ') : err.detail || err.title || `Lỗi HTTP ${response.status}`;
        throw new Error(msg);
    }

    return await response.json();
};

export interface WarehouseTransactionApiItem {
    transactionId: number;
    transactionCode: string;
    batchId?: number;
    batchNumber?: string;
    operationCode?: string;
    operationName?: string;
    operationGroup?: string;
    logic: number;
    materialId?: string;
    bravoId?: string;
    materialName?: string;
    quantity: number;
    unit?: string;
    locationCode?: string;
    referenceDoc?: string;
    performer?: string;
    note?: string;
    createdAt: string;
}

export const getWarehouseTransactions = async (
    search?: string,
    operationCode?: string,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    pageSize: number = 100
): Promise<WarehouseTransactionApiItem[]> => {
    const token = localStorage.getItem('mms_token');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (operationCode && operationCode !== 'ALL') params.append('operationCode', operationCode);
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const response = await fetch(`${API_BASE}/transactions?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || 'Lỗi tải danh sách giao dịch kho');
    }

    return await response.json();
};

// =========================================================================
// LỊCH SỬ LÔ HÀNG TOÀN DIỆN (KIỂM NHẬP + QC + GIA PHẢ + DÒNG THỜI GIAN)
// =========================================================================
export interface BatchDetailInfo {
    batchId: number;
    parentBatchId?: number;
    materialId?: string;
    bravoId?: string;
    materialName?: string;
    quantity: number;
    unit?: string;
    warehouseCode?: string;
    locationCode?: string;
    inventoryStatus?: string;
    createdAt: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
}

export interface BatchInboundQCInfo {
    receivingDocCode?: string;
    poNumber?: string;
    supplierName?: string;
    receivedDate?: string;
    receiver?: string;
    receivedQuantity?: number;
    poQuantity?: number;
    qcStatus?: string;
    qcInspector?: string;
    qcDate?: string;
    qcNotes?: string;
    inspectionType?: string;
    inspectedQuantity?: number;
    defectQuantity?: number;
    qcReportId?: number;
}

export interface BatchTimelineEvent {
    eventId: string;
    eventType: 'TRANSACTION' | 'BATCH_EVENT' | 'LOCATION_EVENT';
    eventCode?: string;
    eventName?: string;
    logic: number;
    quantity?: number;
    unit?: string;
    locationCode?: string;
    actorId?: string;
    occurredAt: string;
    referenceDoc?: string;
    note?: string;
}

export interface BatchFullHistoryResponse {
    found: boolean;
    batch?: BatchDetailInfo;
    inboundQC?: BatchInboundQCInfo;
    genealogy: BatchGenealogyNode[];
    timeline: BatchTimelineEvent[];
}

export interface RealBatchItem {
    batchId: number;
    parentBatchId?: number;
    materialId?: string;
    bravoId?: string;
    materialName?: string;
    quantity: number;
    unit?: string;
    warehouseCode?: string;
    locationCode?: string;
    inventoryStatus?: string;
    createdAt: string;
    expiryDate?: string;
}

export const getBatchFullHistory = async (batchId: number): Promise<BatchFullHistoryResponse> => {
    const token = localStorage.getItem('mms_token');
    const response = await fetch(`${API_BASE}/batches/${batchId}/full-history`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.title || `Không thể tải lịch sử Lô #${batchId}`);
    }

    return await response.json();
};

export const getRealBatches = async (
    search?: string,
    warehouse?: string,
    limit: number = 100
): Promise<RealBatchItem[]> => {
    const token = localStorage.getItem('mms_token');
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (warehouse && warehouse !== 'ALL') params.append('warehouse', warehouse);
    params.append('limit', String(limit));

    const response = await fetch(`${API_BASE}/batches?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || 'Lỗi tải danh sách Lô từ CSDL MMS1');
    }

    return await response.json();
};

// =========================================================================
// BÁO CÁO NHẬP - XUẤT - TỒN & SỔ PHIẾU XUẤT / NHẬP KHO THỰC TẾ (REAL REPORTING)
// =========================================================================
export interface NxtMaterialSummaryItem {
    materialId: string;
    bravoId?: string;
    materialName?: string;
    categoryName?: string;
    unit?: string;
    unitPrice: number;
    beginningQuantity: number;
    inQuantity: number;
    outQuantity: number;
    endingQuantity: number;
    endingValue: number;
    transactionCount: number;
}

export interface NxtReportResponse {
    fromDate: string;
    toDate: string;
    totalBeginningValue: number;
    totalInQuantity: number;
    totalOutQuantity: number;
    totalEndingValue: number;
    totalSkuCount: number;
    activeSkuCount: number;
    items: NxtMaterialSummaryItem[];
}

export interface InventoryDocumentSummaryItem {
    documentId: number;
    documentCode: string;
    operationCode?: string;
    operationName?: string;
    documentType: 'OUT' | 'IN' | 'TRANSFER' | 'COUNT' | 'SPLIT' | 'OTHER';
    warehouseFrom?: string;
    warehouseTo?: string;
    receiverOrPartner?: string;
    createdBy?: string;
    createdAt: string;
    statusCode?: string;
    statusName?: string;
    note?: string;
    totalLines: number;
    totalQuantity: number;
}

export interface InventoryDocumentPage {
    items: InventoryDocumentSummaryItem[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface InventoryDocumentLineItem {
    transactionId: number;
    batchId?: number;
    materialId?: string;
    bravoId?: string;
    materialName?: string;
    quantity: number;
    unit?: string;
    operationCode?: string;
    operationName?: string;
    logic: number;
    locationCode?: string;
    createdAt: string;
    note?: string;
}

export interface InventoryDocumentDetailResponse {
    found: boolean;
    document?: InventoryDocumentSummaryItem;
    lines: InventoryDocumentLineItem[];
}

export const getNxtSummaryReport = async (
    fromDate?: string,
    toDate?: string,
    search?: string,
    warehouse?: string,
    category?: string
): Promise<NxtReportResponse> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (search && search.trim()) params.append('search', search.trim());
    if (warehouse && warehouse !== 'ALL') params.append('warehouse', warehouse);
    if (category && category !== 'ALL') params.append('category', category);

    const response = await fetch(`${API_BASE}/reports/nxt-summary?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || err.message || 'Lỗi khi tải báo cáo Nhập - Xuất - Tồn.');
    }

    return await response.json();
};

export const getInventoryDocuments = async (
    fromDate?: string,
    toDate?: string,
    documentType?: string,
    search?: string,
    page: number = 1,
    pageSize: number = 50
): Promise<InventoryDocumentPage> => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (documentType && documentType !== 'ALL') params.append('documentType', documentType);
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));

    const response = await fetch(`${API_BASE}/reports/documents?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || err.message || 'Lỗi khi tải sổ phiếu kho.');
    }

    return await response.json();
};

export const getInventoryDocumentDetail = async (
    documentId: number
): Promise<InventoryDocumentDetailResponse> => {
    const response = await fetch(`${API_BASE}/reports/documents/${documentId}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || err.title || `Không thể tải chi tiết chứng từ #${documentId}`);
    }

    return await response.json();
};

