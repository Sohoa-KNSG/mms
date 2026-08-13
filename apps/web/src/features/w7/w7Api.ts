import { apiGet, apiPost } from '../../shared/api/client';
import { confirmedReturnSchema, createdReturnSchema, returnBatchesSchema, returnCatalogSchema, returnDetailSchema, returnDocumentsSchema, returnQueueSchema, splitReturnBatchSchema } from './contracts';

export interface ReturnItemInput { materialId: string; bravoId: string | null; materialName: string | null; quantity: number; unit: string | null; note: string }
export const w7Api = {
  catalog: (search: string, signal?: AbortSignal) => apiGet(`/internal-returns/catalog?${new URLSearchParams({ search })}`, returnCatalogSchema, signal),
  create: (input: { destinationBravoCode: string; qualityCode: string; returnAt: string; note: string | null; items: ReturnItemInput[] }, signal?: AbortSignal) => apiPost('/internal-returns', input, createdReturnSchema, signal),
  queue: (search: string, status: string, signal?: AbortSignal) => apiGet(`/internal-returns?${new URLSearchParams({ search, status, page: '1', pageSize: '100' })}`, returnQueueSchema, signal),
  detail: (returnId: number, signal?: AbortSignal) => apiGet(`/internal-returns/${returnId}`, returnDetailSchema, signal),
  confirm: (returnId: number, resultCode: number, note: string, bravoDocumentNumber: string, signal?: AbortSignal) => apiPost(`/internal-returns/${returnId}/confirmation`, { resultCode, note: note || null, bravoDocumentNumber: bravoDocumentNumber || null }, confirmedReturnSchema, signal),
  documents: (search: string, signal?: AbortSignal) => apiGet(`/internal-returns/documents/confirmed?${new URLSearchParams({ search })}`, returnDocumentsSchema, signal),
  batches: (documentId: number, signal?: AbortSignal) => apiGet(`/internal-returns/documents/${documentId}/batches`, returnBatchesSchema, signal),
  split: (documentId: number, batchId: number, splitQuantity: number, expectedQuantity: number, signal?: AbortSignal) => apiPost(`/internal-returns/documents/${documentId}/batches/${batchId}/split`, { splitQuantity, expectedQuantity }, splitReturnBatchSchema, signal),
};
