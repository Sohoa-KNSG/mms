import { apiGet, apiPost } from '../../shared/api/client';
import { batchCountDataSchema, batchLocationResultSchema, countBatchResultSchema, countLocationBatchResultSchema, declarationCatalogSchema, declareInventoryResultSchema, locationCountDataSchema, locationWorklistSchema, splitBatchResultSchema, splittableBatchPageSchema } from './contracts';

export interface InventoryDeclarationInput { materialId: string; quantity: number; unit: string | null; locationCode: string | null }
export interface BatchLocationInput { batchId: number; expectedLocationCode: string | null }
const listQuery = (search: string, locationCode?: string) => { const query = new URLSearchParams({ search, page: '1', pageSize: '50' }); if (locationCode) query.set('locationCode', locationCode); return query.toString(); };

export const w4Api = {
  declarationCatalog: (search: string, signal?: AbortSignal) => apiGet(`/inventory-operations/declaration-catalog?${listQuery(search)}`, declarationCatalogSchema, signal),
  declareInventory: (warehouseCode: string, reason: string, items: InventoryDeclarationInput[], signal?: AbortSignal) => apiPost('/inventory-operations/declarations', { warehouseCode, reason, items }, declareInventoryResultSchema, signal),
  splittableBatches: (search: string, batchId: number | null, signal?: AbortSignal) => { const query = new URLSearchParams({ search, page: '1', pageSize: '50' }); if (batchId) query.set('batchId', String(batchId)); return apiGet(`/inventory-operations/splittable-batches?${query.toString()}`, splittableBatchPageSchema, signal); },
  splitBatch: (batchId: number, splitQuantity: number, expectedQuantity: number, signal?: AbortSignal) => apiPost(`/inventory-operations/batches/${batchId}/split`, { splitQuantity, expectedQuantity }, splitBatchResultSchema, signal),
  batchCount: (batchId: number, signal?: AbortSignal) => apiGet(`/inventory-operations/batch-count/${batchId}`, batchCountDataSchema, signal),
  countBatch: (batchId: number, actualQuantity: number, expectedQuantity: number, reason: string, signal?: AbortSignal) => apiPost(`/inventory-operations/batch-count/${batchId}`, { actualQuantity, expectedQuantity, reason }, countBatchResultSchema, signal),
  locationCount: (locationCode: string, signal?: AbortSignal) => apiGet(`/inventory-operations/location-count/${encodeURIComponent(locationCode)}`, locationCountDataSchema, signal),
  countLocationBatch: (locationCode: string, batchId: number, actualQuantity: number, expectedQuantity: number, reason: string, signal?: AbortSignal) => apiPost(`/inventory-operations/location-count/${encodeURIComponent(locationCode)}/batches/${batchId}`, { actualQuantity, expectedQuantity, reason }, countLocationBatchResultSchema, signal),
  putAwayWorklist: (search: string, signal?: AbortSignal) => apiGet(`/location-operations/put-away?${listQuery(search)}`, locationWorklistSchema, signal),
  putAway: (targetLocationCode: string, batches: BatchLocationInput[], signal?: AbortSignal) => apiPost('/location-operations/put-away', { targetLocationCode, batches }, batchLocationResultSchema, signal),
  relocationWorklist: (search: string, locationCode: string, signal?: AbortSignal) => apiGet(`/location-operations/relocation?${listQuery(search, locationCode)}`, locationWorklistSchema, signal),
  relocate: (targetLocationCode: string, batches: BatchLocationInput[], signal?: AbortSignal) => apiPost('/location-operations/relocation', { targetLocationCode, batches }, batchLocationResultSchema, signal),
  takeDownWorklist: (search: string, locationCode: string, signal?: AbortSignal) => apiGet(`/location-operations/take-down?${listQuery(search, locationCode)}`, locationWorklistSchema, signal),
  takeDown: (batches: BatchLocationInput[], signal?: AbortSignal) => apiPost('/location-operations/take-down', { targetLocationCode: null, batches }, batchLocationResultSchema, signal),
};

