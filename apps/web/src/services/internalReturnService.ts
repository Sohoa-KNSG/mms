// Internal Return API Service for MMS (UC-06 / RET-01 & RET-02)

import { MaterialOption } from './receivingService';

export interface DestinationOption {
  destinationBravoCode: string;
  destinationName: string;
  departmentCode?: string;
}

export interface ReturnCatalogResult {
  materials: MaterialOption[];
  destinations: DestinationOption[];
}

export interface CreateInternalReturnItem {
  materialId: string;
  bravoId?: string;
  materialName?: string;
  quantity: number;
  unit?: string;
  note: string;
}

export interface CreateInternalReturnRequest {
  destinationBravoCode: string;
  qualityCode: '1' | '2'; // 1 = Hàng đạt (sử dụng lại), 2 = Hàng lỗi/không đạt
  returnAt: string;
  note?: string;
  items: CreateInternalReturnItem[];
}

export interface InternalReturnSummary {
  returnId: number;
  warehouseCode: string;
  destinationBravoCode: string;
  destinationName: string;
  qualityCode: string;
  warehouseResultCode?: string;
  note?: string;
  createdBy: string;
  returnAt: string;
  createdAt: string;
  statusCode: string; // 1 = Chờ xác nhận, 2 = Đã nhập kho, 3 = Từ chối
  departmentCode?: string;
  lineCount: number;
  totalQuantity: number;
}

export interface InternalReturnQueuePage {
  items: InternalReturnSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface InternalReturnLineDetail {
  lineId: number;
  returnId: number;
  materialId: string;
  bravoId?: string;
  materialName: string;
  unit: string;
  quantity: number;
  note?: string;
  createdAt: string;
}

export interface InternalReturnDetailResult {
  header: InternalReturnSummary;
  lines: InternalReturnLineDetail[];
}

export interface ConfirmInternalReturnRequest {
  resultCode: 1 | 2 | 3; // 1 = Nhập kho Đạt, 2 = Nhập kho Lỗi, 3 = Từ chối
  note?: string;
  bravoDocumentNumber?: string;
}

export interface ConfirmInternalReturnResult {
  returnId: number;
  resultCode: number;
  statusCode: string;
  warehouseResultCode?: string;
  transactionDocumentId?: number;
  createdBatchCount: number;
  changedAt: string;
}

export const internalReturnService = {
  /**
   * UC-06 / RET-01: Get catalog of materials and return departments (Bravo)
   */
  async getCatalog(search?: string): Promise<ReturnCatalogResult> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());

    const res = await fetch(`/api/v1/internal-returns/catalog?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh mục trả nội bộ: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-06 / RET-01: Create new internal return document
   */
  async createInternalReturn(request: CreateInternalReturnRequest): Promise<{ returnId: number; statusCode: string; createdAt: string }> {
    const res = await fetch('/api/v1/internal-returns', {
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
   * UC-06 / RET-01: Get list of internal returns queue with filter and pagination
   */
  async getReturnQueue(search?: string, status?: string, page: number = 1, pageSize: number = 20): Promise<InternalReturnQueuePage> {
    const params = new URLSearchParams();
    if (search && search.trim()) params.append('search', search.trim());
    if (status && status !== 'ALL') params.append('status', status);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());

    const res = await fetch(`/api/v1/internal-returns?${params.toString()}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải danh sách phiếu trả nội bộ: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-06 / RET-01: Get details of an internal return document
   */
  async getInternalReturn(returnId: number): Promise<InternalReturnDetailResult> {
    const res = await fetch(`/api/v1/internal-returns/${returnId}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Lỗi tải chi tiết phiếu trả #${returnId}: HTTP ${res.status}`);
    }

    return await res.json();
  },

  /**
   * UC-06 / RET-02: Warehouse keeper confirms internal return document (Accept Pass / Accept Defect / Reject)
   */
  async confirmInternalReturn(returnId: number, request: ConfirmInternalReturnRequest): Promise<ConfirmInternalReturnResult> {
    const res = await fetch(`/api/v1/internal-returns/${returnId}/confirmation`, {
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
