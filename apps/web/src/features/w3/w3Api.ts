import { apiGet, apiPost, apiPut } from '../../shared/api/client';
import {
  attachPurchaseOrderResultSchema,
  batchLabelDataSchema,
  materialOptionPageSchema,
  processWarehouseReceiptResultSchema,
  purchaseOrderMatchesSchema,
  purchaseOrderPageSchema,
  receiptCommandResultSchema,
  receiptDetailSchema,
  unmatchedReceiptPageSchema,
  warehouseQueuePageSchema,
} from './contracts';

export interface ReceivingLineInput {
  receivingLineId: number | null;
  purchaseOrderKey: string | null;
  materialId: string;
  documentQuantity: number;
  receivedQuantity: number;
  unit: string | null;
  deliveryDate: string | null;
}

export interface ReceiptImageInput { category: string; imageLink: string }
export interface PoAssignmentInput { receivingLineId: number; purchaseOrderKey: string; receivedQuantity: number }

export const w3Api = {
  getPurchaseOrders: (search: string, signal?: AbortSignal) => apiGet(
    `/receiving/purchase-orders?search=${encodeURIComponent(search)}&page=1&pageSize=50`,
    purchaseOrderPageSchema,
    signal,
  ),
  createReceiptWithPo: (request: {
    purchaseOrder: string; warehouseCode: string; lines: ReceivingLineInput[]; images: ReceiptImageInput[];
  }, signal?: AbortSignal) => apiPost('/receiving/receipts/with-po', request, receiptCommandResultSchema, signal),
  getMaterials: (search: string, signal?: AbortSignal) => apiGet(
    `/receiving/materials?search=${encodeURIComponent(search)}&page=1&pageSize=50`,
    materialOptionPageSchema,
    signal,
  ),
  createReceiptWithoutPo: (request: {
    supplierName: string; warehouseCode: string; lines: ReceivingLineInput[]; images: ReceiptImageInput[];
  }, signal?: AbortSignal) => apiPost('/receiving/receipts/without-po', request, receiptCommandResultSchema, signal),
  getReceipt: (receiptId: number, signal?: AbortSignal) =>
    apiGet(`/receiving/receipts/${receiptId}`, receiptDetailSchema, signal),
  saveReceipt: (receiptId: number, request: {
    warehouseCode: string; customerName: string; purchaseOrder: string; action: 'SAVE' | 'CONFIRM' | 'CANCEL';
    expectedStatus: string; lines: ReceivingLineInput[]; images: ReceiptImageInput[];
  }, signal?: AbortSignal) => apiPut(`/receiving/receipts/${receiptId}`, request, receiptCommandResultSchema, signal),
  getUnmatchedReceipts: (search: string, signal?: AbortSignal) => apiGet(
    `/receiving/po-attachments/receipts?search=${encodeURIComponent(search)}&page=1&pageSize=50`,
    unmatchedReceiptPageSchema,
    signal,
  ),
  attachPurchaseOrder: (receiptId: number, purchaseOrder: string, expectedStatus: string,
    assignments: PoAssignmentInput[], signal?: AbortSignal) => apiPut(
    `/receiving/receipts/${receiptId}/purchase-order`,
    { purchaseOrder, expectedStatus, assignments },
    attachPurchaseOrderResultSchema,
    signal,
  ),
  getPurchaseOrderMatches: (receiptId: number, search: string, signal?: AbortSignal) => apiGet(
    `/receiving/receipts/${receiptId}/purchase-order-matches?search=${encodeURIComponent(search)}`,
    purchaseOrderMatchesSchema,
    signal,
  ),
  attachMultiplePurchaseOrders: (receiptId: number, expectedStatus: string,
    assignments: PoAssignmentInput[], signal?: AbortSignal) => apiPut(
    `/receiving/receipts/${receiptId}/purchase-orders`,
    { expectedStatus, assignments },
    attachPurchaseOrderResultSchema,
    signal,
  ),
  getWarehouseQueue: (search: string, receiptId: number | null, signal?: AbortSignal) => {
    const query = new URLSearchParams({ search, page: '1', pageSize: '50' });
    if (receiptId !== null) query.set('receiptId', String(receiptId));
    return apiGet(`/receiving/warehouse-queue?${query.toString()}`, warehouseQueuePageSchema, signal);
  },
  processWarehouseReceipt: (receiptId: number, expectedStatus: string,
    items: Array<{ receivingLineId: number; quantity: number }>, signal?: AbortSignal) => apiPost(
    `/receiving/receipts/${receiptId}/warehouse`,
    { expectedStatus, items },
    processWarehouseReceiptResultSchema,
    signal,
  ),
  getBatchLabels: (filter: { receiptId?: number; transactionDocumentId?: number; batchId?: number }, signal?: AbortSignal) => {
    const query = new URLSearchParams();
    if (filter.receiptId) query.set('receiptId', String(filter.receiptId));
    if (filter.transactionDocumentId) query.set('transactionDocumentId', String(filter.transactionDocumentId));
    if (filter.batchId) query.set('batchId', String(filter.batchId));
    return apiGet(`/receiving/batch-labels?${query.toString()}`, batchLabelDataSchema, signal);
  },
};

