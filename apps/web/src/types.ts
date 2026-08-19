// MMS System Core Types matching Database Entities

export type UserRole = 
  | 'admin' 
  | 'truongphong_kho' 
  | 'thukho' 
  | 'nhanvien' 
  | 'qc'
  | 'ql_kiemke'
  | 'bophan_yeucau'
  | 'donvi_yeucau'
  | 'ADMIN' 
  | 'THUKHO' 
  | 'QC' 
  | 'SANXUAT' 
  | 'KETOAN'
  | 'ql_kho'
  | 'nv_kho'
  | 'nv_sx'
  | 'qc_kho';

export interface AppPermission {
  code: string;
  moduleGroup: string;
  name: string;
  description: string;
  isGranted: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  avatar?: string;
  permissions?: string[];
}

export interface MaterialCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  qcRequired: boolean;
}

export interface Material {
  id: string;
  code: string; // SKU
  name: string;
  categoryId: string;
  categoryName: string;
  unit: string; // ĐVT: Cuộn, Cái, Kg, Hộp, Mét, Thùng...
  minStock: number;
  maxStock: number;
  standardPrice: number;
  specification?: string;
  supplier?: string;
  storageCondition?: string; // Nhiệt độ phòng, 20-25C, Chống ẩm...
  imageUrl?: string;
}

export interface WarehouseLocation {
  id: string;
  code: string; // e.g. "K01-T2-03"
  warehouse: string; // "Kho A - Vật tư chính", "Kho B - Phụ liệu", "Kho C - Hoá chất"
  rack: string; // "K01", "K02", "K03"...
  tier: string; // "T1", "T2", "T3", "T4"
  bin: string; // "01", "02", "03"
  capacity: number; // Maximum items or weight
  occupied: number;
  status: 'EMPTY' | 'PARTIAL' | 'FULL' | 'MAINTENANCE';
}

export type ReceivingType = 'PO' | 'NON_PO' | 'INTERNAL_RETURN';
export type ReceivingStatus = 'DRAFT' | 'TEMPORARY_RECEIVED' | 'WAITING_QC' | 'QC_IN_PROGRESS' | 'QC_PASSED' | 'QC_REJECTED' | 'PUTAWAY_COMPLETED';

export interface ReceivingItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  poQuantity: number;
  receivedQuantity: number;
  note?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
}

export interface ReceivingOrder {
  id: string;
  code: string; // e.g. "PNH-20260814-001"
  type: ReceivingType;
  poNumber?: string;
  supplier: string;
  receivedDate: string;
  receiver: string;
  status: ReceivingStatus;
  notes?: string;
  items: ReceivingItem[];
  attachedImages?: string[];
  qcTicketId?: string;
}

export interface QCCriterion {
  id: string;
  name: string;
  standardValue: string;
  testMethod: string;
  importance: 'CRITICAL' | 'MAJOR' | 'MINOR';
}

export interface QCCheckDetail {
  criterionId: string;
  criterionName: string;
  standardValue: string;
  actualValue: string;
  passed: boolean;
  notes?: string;
}

export type QCEvaluation = 'PASS' | 'FAIL' | 'CONCESSION' | 'PENDING';

export interface QCTicket {
  id: string;
  code: string; // e.g. "QC-20260814-001"
  receivingOrderId: string;
  receivingOrderCode: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  batchNumber: string;
  sampleQuantity: number;
  lotQuantity: number;
  inspector: string;
  inspectionDate: string;
  evaluation: QCEvaluation;
  notes?: string;
  checkDetails: QCCheckDetail[];
  rejectionReason?: string;
  releasedQuantity?: number;
}

export type BatchStatus = 'QUARANTINE' | 'AVAILABLE' | 'RESERVED' | 'EXPIRED' | 'BLOCKED';

export interface BatchInventory {
  id: string;
  batchNumber: string; // e.g. "BAT-2026-0814-01"
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  quantity: number;
  initialQuantity: number;
  locationId: string;
  locationCode: string; // e.g. "K01-T2-01"
  warehouse: string;
  manufactureDate: string;
  expiryDate: string;
  status: BatchStatus;
  poNumber?: string;
  receivingOrderCode?: string;
  qcCode?: string;
  unitCost: number;
  createdAt: string;
}

export type IssueRequestType = 'PLANNING' | 'OVER_PLANNING' | 'UNPLANNED';
export type IssueRequestStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PICKING' | 'ISSUED' | 'CANCELLED';

export interface IssueItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  requestedQuantity: number;
  approvedQuantity: number;
  issuedQuantity: number;
  allocatedBatches?: {
    batchId: string;
    batchNumber: string;
    locationCode: string;
    quantity: number;
  }[];
  notes?: string;
}

export interface IssueRequest {
  id: string;
  code: string; // e.g. "DNXK-20260814-001"
  type: IssueRequestType;
  department: string;
  requester: string;
  purpose: string; // e.g. "Lắp ráp đơn hàng SX-889", "Bảo trì máy số 3"
  productionOrder?: string;
  createdAt: string;
  requiredDate: string;
  status: IssueRequestStatus;
  approver?: string;
  approvalDate?: string;
  approvalComment?: string;
  items: IssueItem[];
  deliveryNoteNumber?: string;
  issuedDate?: string;
  issuer?: string;
}

export type TransactionType = 'INBOUND_PO' | 'INBOUND_NON_PO' | 'INBOUND_RETURN' | 'OUTBOUND_PRODUCTION' | 'OUTBOUND_MAINTENANCE' | 'ADJUST_TRANSFER' | 'ADJUST_AUDIT';

export interface WarehouseTransaction {
  id: string;
  code: string;
  date: string;
  type: TransactionType;
  typeLabel: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  batchNumber: string;
  quantity: number; // positive for in, negative for out
  unit: string;
  sourceLocation?: string;
  destinationLocation?: string;
  referenceDoc: string; // PNH-..., DNXK-..., KK-...
  performer: string;
  note?: string;
}

export interface InventoryAuditItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  batchNumber: string;
  locationCode: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  reason?: string;
  status: 'MATCH' | 'SURPLUS' | 'SHORTAGE';
}

export interface InventoryAuditTicket {
  id: string;
  code: string;
  title: string;
  date: string;
  warehouse: string;
  auditor: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  items: InventoryAuditItem[];
  notes?: string;
}
