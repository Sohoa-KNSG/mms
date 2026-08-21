// Receiving & Purchase Order API Service for MMS (UC-03 to UC-08 / INB-01 to INB-06)

export interface PurchaseOrderSummary {
  purchaseOrder: string;
  customerCode?: string;
  orderDate?: string;
  deliveryDate?: string;
  remainingQuantity: number;
}

export interface PurchaseOrderLine {
  purchaseOrder: string;
  purchaseOrderKey: string;
  customerCode?: string;
  materialId?: string;
  bravoId?: string;
  materialName?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unit?: string;
  deliveryDate?: string;
}

export interface PurchaseOrderPage {
  items: PurchaseOrderSummary[];
  lines: PurchaseOrderLine[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface MaterialOption {
  materialId: string;
  bravoId?: string;
  materialName?: string;
  unit?: string;
  supplierCode?: string;
  materialGroupCode?: string;
}

export interface MaterialOptionPage {
  items: MaterialOption[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ReceivingLineInput {
  receivingLineId?: number;
  purchaseOrderKey?: string;
  materialId: string;
  documentQuantity: number;
  receivedQuantity: number;
  unit?: string;
  deliveryDate?: string;
}

export interface ReceiptImageInput {
  category: string;
  imageLink: string;
}

export interface CreateReceiptWithPoRequest {
  purchaseOrder: string;
  warehouseCode: string;
  lines: ReceivingLineInput[];
  images: ReceiptImageInput[];
}

export interface CreateReceiptWithoutPoRequest {
  supplierName: string;
  warehouseCode: string;
  lines: ReceivingLineInput[];
  images: ReceiptImageInput[];
}

export interface ReceiptCommandResult {
  receiptId: number;
  statusCode: string;
  lineCount: number;
  changedAt: string;
}

export interface UnmatchedReceiptSummary {
  receiptId: number;
  warehouseCode?: string;
  customerName?: string;
  statusCode?: string;
  createdBy?: string;
  createdAt?: string;
  lineCount: number;
}

export interface UnmatchedReceiptLine {
  receivingLineId: number;
  receiptId: number;
  materialId?: string;
  materialName?: string;
  receivedQuantity: number;
  unit?: string;
}

export interface UnmatchedReceiptPage {
  items: UnmatchedReceiptSummary[];
  lines: UnmatchedReceiptLine[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PoAssignmentInput {
  receivingLineId: number;
  purchaseOrderKey: string;
  receivedQuantity: number;
}

export interface AttachPurchaseOrderRequest {
  purchaseOrder: string;
  expectedStatus: string;
  assignments: PoAssignmentInput[];
}

export interface AttachPurchaseOrderResult {
  receiptId: number;
  purchaseOrder: string;
  assignmentCount: number;
  changedAt: string;
}

export interface PoMatchCandidate {
  receivingLineId: number;
  purchaseOrder: string;
  purchaseOrderKey: string;
  customerCode?: string;
  materialId?: string;
  materialName?: string;
  unit?: string;
  remainingQuantity: number;
  deliveryDate?: string;
}

export interface PoMatchResult {
  lines: Array<{
    receivingLineId: number;
    materialId?: string;
    materialName?: string;
    receivedQuantity: number;
    unit?: string;
  }>;
  candidates: PoMatchCandidate[];
}

export interface AttachMultiplePurchaseOrdersRequest {
  expectedStatus: string;
  assignments: PoAssignmentInput[];
}

export interface ReceiptLogItem {
  historyId: number;
  receiptId: string;
  warehouseCode?: string;
  customerName?: string;
  purchaseOrder?: string;
  statusCode?: string;
  statusLabel?: string;
  actionType?: string;
  actorName?: string;
  auditTime?: string;
}

export interface ReceiptLogPage {
  items: ReceiptLogItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ReceiptLineDetail {
  receivingLineId: number;
  receiptId: number;
  purchaseOrderKey?: string;
  materialId?: string;
  materialName?: string;
  documentQuantity: number;
  receivedQuantity: number;
  unit?: string;
  deliveryDate?: string;
  lineStatusCode?: string;
  qcResultCode?: string;
}

export interface ReceiptDetailResult {
  header?: {
    receiptId: number;
    warehouseCode?: string;
    customerName?: string;
    purchaseOrder?: string;
    statusCode?: string;
    createdBy?: string;
    createdAt?: string;
    canEdit: boolean;
    changedAt?: string;
  };
  lines: ReceiptLineDetail[];
  images: Array<{
    imageId: number;
    category?: string;
    imageLink?: string;
    createdAt?: string;
  }>;
}

export const receivingService = {
  /**
   * UC-07 / INB-04: Get real paginated list of receiving receipts & audit history from MMS1 database
   */
  async getReceiptLog(search?: string, page: number = 1, pageSize: number = 20): Promise<ReceiptLogPage> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`/api/v1/receipts/log?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải nhật ký phiếu nhận: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-07 / INB-03: Get full receipt details (header, line items, QC status, images)
   */
  async getReceiptDetail(receiptId: number): Promise<ReceiptDetailResult> {
    const res = await fetch(`/api/v1/receiving/receipts/${receiptId}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải chi tiết phiếu nhận #${receiptId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-03: Get paginated list of active Purchase Orders and line items from database
   */
  async getPurchaseOrders(search?: string, page: number = 1, pageSize: number = 50): Promise<PurchaseOrderPage> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`/api/v1/receiving/purchase-orders?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách PO: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-03: Create Receipt with PO in MMS1 database via Stored Procedure
   */
  async createReceiptWithPo(request: CreateReceiptWithPoRequest): Promise<ReceiptCommandResult> {
    const res = await fetch('/api/v1/receiving/receipts/with-po', {
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
   * UC-04: Get materials list from MMS1 database
   */
  async getMaterials(search?: string, page: number = 1, pageSize: number = 50): Promise<MaterialOptionPage> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`/api/v1/receiving/materials?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh mục vật tư: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-04: Create Non-PO Receipt in MMS1 database via Stored Procedure
   */
  async createReceiptWithoutPo(request: CreateReceiptWithoutPoRequest): Promise<ReceiptCommandResult> {
    const res = await fetch('/api/v1/receiving/receipts/without-po', {
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
   * UC-05: Get non-PO receipts awaiting PO reconciliation / attachment
   */
  async getUnmatchedReceipts(search?: string, page: number = 1, pageSize: number = 50): Promise<UnmatchedReceiptPage> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`/api/v1/receiving/po-attachments/receipts?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách phiếu chờ đối soát PO: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-05: Attach PO to Non-PO Receipt via Stored Procedure
   */
  async attachPurchaseOrder(receiptId: number, request: AttachPurchaseOrderRequest): Promise<AttachPurchaseOrderResult> {
    const res = await fetch(`/api/v1/receiving/receipts/${receiptId}/purchase-order`, {
      method: 'PUT',
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
   * UC-08 / INB-06: Get matching candidate PO lines for multiple PO attachment
   */
  async getPurchaseOrderMatches(receiptId: number, search?: string): Promise<PoMatchResult> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());

    const res = await fetch(`/api/v1/receiving/receipts/${receiptId}/purchase-order-matches?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách PO gợi ý cho phiếu #${receiptId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-08 / INB-06: Attach multiple POs to Non-PO Receipt via Stored Procedure
   */
  async attachMultiplePurchaseOrders(receiptId: number, request: AttachMultiplePurchaseOrdersRequest): Promise<AttachPurchaseOrderResult> {
    const res = await fetch(`/api/v1/receiving/receipts/${receiptId}/purchase-orders`, {
      method: 'PUT',
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
   * UC-09 / INB-07: Get list of receipts waiting for warehouse entry finalization
   */
  async getWarehouseReceiptQueue(search?: string, receiptId?: number, page: number = 1, pageSize: number = 20): Promise<WarehouseQueueResult> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (receiptId && receiptId > 0) params.append('receiptId', receiptId.toString());
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`/api/v1/receiving/warehouse-queue?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách hàng đợi nhập kho: HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      receipts: data.receipts || data.items || [],
      lines: data.lines || [],
      totalCount: data.totalCount ?? 0,
      page: data.page ?? page,
      pageSize: data.pageSize ?? pageSize
    };
  },

  /**
   * UC-09 / INB-07: Process warehouse receipt and create inventory batches + transaction document
   */
  async processWarehouseReceipt(receiptId: number, request: ProcessWarehouseReceiptRequest): Promise<ProcessWarehouseReceiptResult> {
    const res = await fetch(`/api/v1/receiving/receipts/${receiptId}/warehouse`, {
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
  }
};

export interface WarehouseQueueReceipt {
  receiptId: number;
  warehouseCode: string;
  customerName: string;
  purchaseOrder: string;
  statusCode: string;
  receivedAt: string;
  pendingLineCount: number;
}

export interface WarehouseQueueLine {
  receivingLineId: number;
  receiptId: number;
  materialId: string;
  bravoId?: string;
  materialName: string;
  receivedQuantity: number;
  batchedQuantity: number;
  remainingQuantity: number;
  unit: string;
  lineStatusCode: string;
  qcResultCode?: string;
}

export interface WarehouseQueueResult {
  receipts: WarehouseQueueReceipt[];
  lines: WarehouseQueueLine[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ProcessWarehouseReceiptItem {
  receivingLineId: number;
  quantity: number;
}

export interface ProcessWarehouseReceiptRequest {
  expectedStatus: string;
  items: ProcessWarehouseReceiptItem[];
}

export interface ProcessWarehouseReceiptResult {
  receiptId: number;
  transactionDocumentId: number;
  statusCode: string;
  batchCount: number;
  processedAt: string;
}

