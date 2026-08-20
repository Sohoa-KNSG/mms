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

export const getSplittableBatches = async (search?: string, batchId?: number, page: number = 1, pageSize: number = 100): Promise<SplittableBatchPage> => {
    const token = localStorage.getItem('mms_token');
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (batchId && batchId > 0) params.append('batchId', batchId.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const response = await fetch(`${API_BASE}/splittable-batches?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || err.detail || 'Lỗi khi tải danh sách lô có thể tách.');
    }

    return await response.json();
};

export const splitBatchV2 = async (batchId: number, request: SplitBatchV2Request): Promise<SplitBatchV2Result> => {
    const token = localStorage.getItem('mms_token');
    const response = await fetch(`${API_BASE}/batches/${batchId}/split-v2`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(request)
    });
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.title || 'Lỗi khi tách batch');
    }
    
    return await response.json();
};

export const getBatchGenealogy = async (batchId: number): Promise<BatchGenealogyNode[]> => {
    const token = localStorage.getItem('mms_token');
    const response = await fetch(`${API_BASE}/batches/${batchId}/genealogy`, {
        method: 'GET',
        headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
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
    page: number = 1,
    pageSize: number = 100
): Promise<WarehouseTransactionApiItem[]> => {
    const token = localStorage.getItem('mms_token');
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (operationCode && operationCode !== 'ALL') params.append('operationCode', operationCode);
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
