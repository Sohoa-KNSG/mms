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

const API_BASE = '/api/v1/inventory-operations';

export const splitBatchV2 = async (batchId: number, request: SplitBatchV2Request): Promise<SplitBatchV2Result> => {
    const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
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
