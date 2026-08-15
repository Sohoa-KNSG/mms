import { apiGet, apiPost } from '../../shared/api/client';
import {
  completedGoodsIssueSchema, issueDocumentsSchema, issuePrintDataSchema,
  pickableBatchesSchema, pickedBatchSchema, pickingQueueSchema, pickingRequestSchema, startedPickingSchema,
} from './contracts';

const paging = (search: string, status?: string) => {
  const query = new URLSearchParams({ search, page: '1', pageSize: '100' });
  if (status) query.set('status', status);
  return query.toString();
};

export const w6Api = {
  queue: (search: string, status: string, signal?: AbortSignal) => apiGet(`/outbound-picking/requests?${paging(search, status)}`, pickingQueueSchema, signal),
  request: (requestId: number, signal?: AbortSignal) => apiGet(`/outbound-picking/requests/${requestId}`, pickingRequestSchema, signal),
  start: (requestId: number, signal?: AbortSignal) => apiPost(`/outbound-picking/requests/${requestId}/start`, {}, startedPickingSchema, signal),
  batches: (requestId: number, lineId: number, signal?: AbortSignal) => apiGet(`/outbound-picking/requests/${requestId}/lines/${lineId}/batches`, pickableBatchesSchema, signal),
  pick: (requestId: number, lineId: number, input: { batchId: number; quantity: number; expectedBatchQuantity: number; expectedLocationCode: string | null }, signal?: AbortSignal) =>
    apiPost(`/outbound-picking/requests/${requestId}/lines/${lineId}/pick`, input, pickedBatchSchema, signal),
  complete: (requestId: number, signal?: AbortSignal) => apiPost(`/outbound-picking/requests/${requestId}/complete`, {}, completedGoodsIssueSchema, signal),
  documents: (search: string, signal?: AbortSignal) => apiGet(`/outbound-picking/documents?${paging(search)}`, issueDocumentsSchema, signal),
  printData: (documentId: number, signal?: AbortSignal) => apiGet(`/outbound-picking/documents/${documentId}/print`, issuePrintDataSchema, signal),
};
