import { apiGet, apiPost, apiPut } from '../../shared/api/client';
import {
  changedOutboundRequestSchema, createdOutboundRequestSchema, decidedOutboundRequestSchema,
  outboundCatalogSchema, outboundRequestDetailSchema, requestQueueSchema,
} from './contracts';

export type RequestKind = 'planned' | 'unplanned' | 'over-plan';
export interface OutboundRequestItemInput {
  planId: number | null; materialId: string; bravoId: string | null; materialName: string | null;
  quantity: number; unit: string | null; note: string | null; destinationBravoCode: string | null;
}
export interface CreateRequestInput {
  planningUnit: string; neededAt: string; destinationBravoCode: string | null;
  destinationName: string | null; items: OutboundRequestItemInput[];
}
const queryString = (planningUnit: string, search: string) => new URLSearchParams({ planningUnit, search, page: '1', pageSize: '50' }).toString();

export const w5Api = {
  catalog: (kind: RequestKind, planningUnit: string, search: string, signal?: AbortSignal) =>
    apiGet(`/outbound-requests/catalog/${kind}?${queryString(planningUnit, search)}`, outboundCatalogSchema, signal),
  create: (kind: RequestKind, input: CreateRequestInput, signal?: AbortSignal) =>
    apiPost(`/outbound-requests/${kind}`, input, createdOutboundRequestSchema, signal),
  queue: (search: string, status: string, signal?: AbortSignal) => {
    const query = new URLSearchParams({ search, status, page: '1', pageSize: '100' });
    return apiGet(`/outbound-requests?${query.toString()}`, requestQueueSchema, signal);
  },
  detail: (requestId: number, signal?: AbortSignal) =>
    apiGet(`/outbound-requests/${requestId}`, outboundRequestDetailSchema, signal),
  save: (requestId: number, input: CreateRequestInput & { expectedChangedAt: string }, signal?: AbortSignal) =>
    apiPut(`/outbound-requests/${requestId}`, input, changedOutboundRequestSchema, signal),
  decide: (requestId: number, approvalRunId: number, decision: 'approve' | 'reject', note: string, signal?: AbortSignal) =>
    apiPost(`/outbound-requests/${requestId}/decision`, { approvalRunId, decision, note: note || null }, decidedOutboundRequestSchema, signal),
  cancel: (requestId: number, reason: string, expectedChangedAt: string, signal?: AbortSignal) =>
    apiPost(`/outbound-requests/${requestId}/cancel`, { reason, expectedChangedAt }, changedOutboundRequestSchema, signal),
};
