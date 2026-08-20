import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  MaterialCategory,
  Material,
  WarehouseLocation,
  ReceivingOrder,
  QCTicket,
  QCCriterion,
  BatchInventory,
  IssueRequest,
  WarehouseTransaction,
  InventoryAuditTicket,
  QCEvaluation,
  ReceivingType,
  IssueRequestType,
  UserRole
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_MATERIALS,
  INITIAL_LOCATIONS,
  INITIAL_BATCHES,
  INITIAL_QC_CRITERIA,
  INITIAL_RECEIVING_ORDERS,
  INITIAL_QC_TICKETS,
  INITIAL_ISSUE_REQUESTS,
  INITIAL_TRANSACTIONS,
  INITIAL_AUDIT_TICKETS
} from '../data/mockData';

import { authService, UserSession } from './authService';

interface WarehouseContextType {
  // Current user & role
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  onLoginSuccess: (session: UserSession) => void;
  loginWithCredentials: (username: string, password: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  
  // Master data
  categories: MaterialCategory[];
  materials: Material[];
  locations: WarehouseLocation[];
  batches: BatchInventory[];
  qcCriteria: QCCriterion[];

  // Operational documents
  receivingOrders: ReceivingOrder[];
  qcTickets: QCTicket[];
  issueRequests: IssueRequest[];
  transactions: WarehouseTransaction[];
  auditTickets: InventoryAuditTicket[];

  // Actions - Inbound / Receiving
  createReceivingOrder: (order: Partial<ReceivingOrder>) => ReceivingOrder;
  updateReceivingStatus: (orderId: string, status: ReceivingOrder['status']) => void;

  // Actions - QC
  createQCTicket: (ticket: Partial<QCTicket>) => QCTicket;
  evaluateQCTicket: (ticketId: string, evaluation: QCEvaluation, details: any[], notes?: string) => void;

  // Actions - Putaway & Location
  putawayBatch: (batchData: {
    materialId: string;
    quantity: number;
    locationId: string;
    receivingOrderCode?: string;
    qcCode?: string;
    expiryDate: string;
    manufactureDate: string;
    unitCost?: number;
    batchNumber?: string;
  }) => BatchInventory;
  splitBatch: (batchId: string, quantities: number[]) => BatchInventory[];
  transferLocation: (batchId: string, newLocationId: string, note?: string) => void;

  // Actions - Outbound / Issue
  createIssueRequest: (request: {
    type: IssueRequestType;
    department: string;
    purpose: string;
    productionOrder?: string;
    requiredDate: string;
    items: { materialId: string; quantity: number; notes?: string }[];
  }) => IssueRequest;
  approveIssueRequest: (requestId: string, approved: boolean, comment?: string, itemApprovals?: { [itemId: string]: number }) => void;
  issueGoods: (requestId: string, pickingDetails: { itemId: string; batchId: string; quantity: number }[]) => void;
  confirmReceivedIssueRequest: (requestId: string) => void;

  // Actions - Audit
  createAuditTicket: (warehouse: string, title: string, items: any[]) => InventoryAuditTicket;
  completeAuditTicket: (ticketId: string, approved: boolean) => void;

  // Actions - Master Data CRUD
  addMaterial: (material: Omit<Material, 'id'>) => void;
  updateMaterial: (id: string, material: Partial<Material>) => void;
  addLocation: (location: Omit<WarehouseLocation, 'id'>) => void;

  // Global utilities
  resetData: () => void;
  activeBarcodePrint: { title: string; batchNumber: string; materialName: string; materialCode: string; locationCode: string; quantity: number; unit: string; expiryDate: string; poNumber?: string } | null;
  setActiveBarcodePrint: (data: any) => void;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

const STORAGE_PREFIX = 'mms_warehouse_v1_';

export const WarehouseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mapSessionToUser = (session: UserSession): User => {
    let role: UserRole = 'nhanvien';
    const roleCodeLower = (session.roleCode || '').toLowerCase();
    if (roleCodeLower.includes('admin')) role = 'admin';
    else if (roleCodeLower.includes('kiemke') || roleCodeLower.includes('kiem_ke') || roleCodeLower.includes('audit')) role = 'ql_kiemke';
    else if (roleCodeLower.includes('truongphong') || roleCodeLower.includes('ql_kho') || roleCodeLower.includes('quanly')) role = 'truongphong_kho';
    else if (roleCodeLower.includes('thukho') || roleCodeLower.includes('kho')) role = 'thukho';
    else if (roleCodeLower.includes('qc') || roleCodeLower.includes('qa')) role = 'qc';
    else if (roleCodeLower.includes('sanxuat') || roleCodeLower.includes('prod') || roleCodeLower.includes('yeucau') || roleCodeLower.includes('bophan')) role = 'bophan_yeucau';
    else if (roleCodeLower.includes('ketoan') || roleCodeLower.includes('acc')) role = 'KETOAN';
    else if (roleCodeLower.includes('nhanvien') || roleCodeLower.includes('nv_kho')) role = 'nhanvien';

    return {
      id: session.userId,
      username: session.userId,
      fullName: session.displayName || session.userId,
      email: `${session.userId}@smartfactory.vn`,
      role,
      department: session.bravoDepartmentName || session.departmentCode || 'Nhà máy MMS',
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
    };
  };

  const DEFAULT_USER: User = INITIAL_USERS[0] || {
    id: '00',
    username: '00',
    fullName: 'Quản trị viên (DEV)',
    email: 'dev@mms.vn',
    role: 'ADMIN',
    department: 'Ban Công nghệ Thông tin'
  };

  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // UC-01: Auto check active user session from CSDL on startup
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const session = await authService.getSession();
        if (session && isMounted) {
          const user = mapSessionToUser(session);
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else if (isMounted) {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('Could not fetch active session from API:', err);
        if (isMounted) setIsAuthenticated(false);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    };
    checkSession();
    return () => { isMounted = false; };
  }, []);

  const onLoginSuccess = (session: UserSession) => {
    const user = mapSessionToUser(session);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowLoginModal(false);
  };

  const loginWithCredentials = async (username: string, pass: string): Promise<boolean> => {
    const result = await authService.login(username, pass);
    if (result.success && result.data) {
      onLoginSuccess(result.data);
      return true;
    }
    return false;
  };

  const logoutUser = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setShowLoginModal(false);
  };

  const [users] = useState<User[]>(INITIAL_USERS);

  const [categories, setCategories] = useState<MaterialCategory[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'materials');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [locations, setLocations] = useState<WarehouseLocation[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'locations');
    return saved ? JSON.parse(saved) : INITIAL_LOCATIONS;
  });

  const [batches, setBatches] = useState<BatchInventory[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'batches');
    return saved ? JSON.parse(saved) : INITIAL_BATCHES;
  });

  const [qcCriteria, setQcCriteria] = useState<QCCriterion[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'qcCriteria');
    return saved ? JSON.parse(saved) : INITIAL_QC_CRITERIA;
  });

  const [receivingOrders, setReceivingOrders] = useState<ReceivingOrder[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'receivingOrders');
    return saved ? JSON.parse(saved) : INITIAL_RECEIVING_ORDERS;
  });

  const [qcTickets, setQcTickets] = useState<QCTicket[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'qcTickets');
    return saved ? JSON.parse(saved) : INITIAL_QC_TICKETS;
  });

  const [issueRequests, setIssueRequests] = useState<IssueRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'issueRequests');
    return saved ? JSON.parse(saved) : INITIAL_ISSUE_REQUESTS;
  });

  const [transactions, setTransactions] = useState<WarehouseTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [auditTickets, setAuditTickets] = useState<InventoryAuditTicket[]>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + 'auditTickets');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_TICKETS;
  });

  const [activeBarcodePrint, setActiveBarcodePrint] = useState<any | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'categories', JSON.stringify(categories));
    localStorage.setItem(STORAGE_PREFIX + 'materials', JSON.stringify(materials));
    localStorage.setItem(STORAGE_PREFIX + 'locations', JSON.stringify(locations));
    localStorage.setItem(STORAGE_PREFIX + 'batches', JSON.stringify(batches));
    localStorage.setItem(STORAGE_PREFIX + 'qcCriteria', JSON.stringify(qcCriteria));
    localStorage.setItem(STORAGE_PREFIX + 'receivingOrders', JSON.stringify(receivingOrders));
    localStorage.setItem(STORAGE_PREFIX + 'qcTickets', JSON.stringify(qcTickets));
    localStorage.setItem(STORAGE_PREFIX + 'issueRequests', JSON.stringify(issueRequests));
    localStorage.setItem(STORAGE_PREFIX + 'transactions', JSON.stringify(transactions));
    localStorage.setItem(STORAGE_PREFIX + 'auditTickets', JSON.stringify(auditTickets));
  }, [categories, materials, locations, batches, qcCriteria, receivingOrders, qcTickets, issueRequests, transactions, auditTickets]);

  const resetData = () => {
    setCategories(INITIAL_CATEGORIES);
    setMaterials(INITIAL_MATERIALS);
    setLocations(INITIAL_LOCATIONS);
    setBatches(INITIAL_BATCHES);
    setQcCriteria(INITIAL_QC_CRITERIA);
    setReceivingOrders(INITIAL_RECEIVING_ORDERS);
    setQcTickets(INITIAL_QC_TICKETS);
    setIssueRequests(INITIAL_ISSUE_REQUESTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setAuditTickets(INITIAL_AUDIT_TICKETS);
    setCurrentUser(INITIAL_USERS[0]);
  };

  // 1. Inbound Actions
  const createReceivingOrder = (orderData: Partial<ReceivingOrder>): ReceivingOrder => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = receivingOrders.length + 1;
    const code = `PNH-${dateStr}-${String(count).padStart(3, '0')}`;
    
    const newOrder: ReceivingOrder = {
      id: `REC-${Date.now()}`,
      code,
      type: orderData.type || 'PO',
      poNumber: orderData.poNumber || '',
      supplier: orderData.supplier || 'Nhà cung cấp',
      receivedDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      receiver: currentUser.fullName,
      status: 'WAITING_QC',
      notes: orderData.notes || '',
      items: orderData.items || []
    };

    setReceivingOrders(prev => [newOrder, ...prev]);

    // Auto generate QC tickets for items requiring QC
    orderData.items?.forEach((item, idx) => {
      const mat = materials.find(m => m.id === item.materialId);
      const cat = categories.find(c => c.id === mat?.categoryId);
      if (cat?.qcRequired) {
        const qcCode = `QC-${dateStr}-${String(qcTickets.length + idx + 1).padStart(3, '0')}`;
        const newQCTicket: QCTicket = {
          id: `QC-${Date.now()}-${idx}`,
          code: qcCode,
          receivingOrderId: newOrder.id,
          receivingOrderCode: newOrder.code,
          materialId: item.materialId,
          materialCode: item.materialCode,
          materialName: item.materialName,
          batchNumber: item.batchNumber || `BAT-${dateStr}-${String(batches.length + idx + 1).padStart(2, '0')}`,
          sampleQuantity: Math.min(32, Math.max(5, Math.round(item.receivedQuantity * 0.05))),
          lotQuantity: item.receivedQuantity,
          inspector: 'Phòng QC',
          inspectionDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
          evaluation: 'PENDING',
          notes: `Phiếu kiểm định tự động cho lô hàng ${newOrder.code}`,
          checkDetails: qcCriteria.map(c => ({
            criterionId: c.id,
            criterionName: c.name,
            standardValue: c.standardValue,
            actualValue: 'Chờ đo kiểm tra',
            passed: false
          }))
        };
        setQcTickets(prev => [newQCTicket, ...prev]);
      }
    });

    return newOrder;
  };

  const updateReceivingStatus = (orderId: string, status: ReceivingOrder['status']) => {
    setReceivingOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  // 2. QC Actions
  const createQCTicket = (ticketData: Partial<QCTicket>): QCTicket => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = qcTickets.length + 1;
    const code = `QC-${dateStr}-${String(count).padStart(3, '0')}`;

    const newTicket: QCTicket = {
      id: `QC-${Date.now()}`,
      code,
      receivingOrderId: ticketData.receivingOrderId || '',
      receivingOrderCode: ticketData.receivingOrderCode || '',
      materialId: ticketData.materialId || '',
      materialCode: ticketData.materialCode || '',
      materialName: ticketData.materialName || '',
      batchNumber: ticketData.batchNumber || '',
      sampleQuantity: ticketData.sampleQuantity || 10,
      lotQuantity: ticketData.lotQuantity || 100,
      inspector: currentUser.fullName,
      inspectionDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      evaluation: 'PENDING',
      notes: ticketData.notes || '',
      checkDetails: ticketData.checkDetails || []
    };

    setQcTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  const evaluateQCTicket = (ticketId: string, evaluation: QCEvaluation, details: any[], notes?: string) => {
    setQcTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          evaluation,
          inspector: currentUser.fullName,
          inspectionDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
          checkDetails: details,
          notes: notes || t.notes,
          releasedQuantity: evaluation === 'PASS' ? t.lotQuantity : 0
        };
      }
      return t;
    }));

    // If passed, update receiving order status
    const target = qcTickets.find(t => t.id === ticketId);
    if (target && target.receivingOrderId) {
      if (evaluation === 'PASS') {
        updateReceivingStatus(target.receivingOrderId, 'QC_PASSED');
      } else if (evaluation === 'FAIL') {
        updateReceivingStatus(target.receivingOrderId, 'QC_REJECTED');
      }
    }
  };

  // 3. Putaway & Location
  const putawayBatch = (batchData: {
    materialId: string;
    quantity: number;
    locationId: string;
    receivingOrderCode?: string;
    qcCode?: string;
    expiryDate: string;
    manufactureDate: string;
    unitCost?: number;
    batchNumber?: string;
  }): BatchInventory => {
    const mat = materials.find(m => m.id === batchData.materialId);
    const loc = locations.find(l => l.id === batchData.locationId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = batches.length + 1;
    const batchNumber = batchData.batchNumber || `BAT-${dateStr}-${String(count).padStart(2, '0')}`;

    const newBatch: BatchInventory = {
      id: `BAT-${Date.now()}`,
      batchNumber,
      materialId: batchData.materialId,
      materialCode: mat?.code || 'SKU',
      materialName: mat?.name || 'Vật tư',
      unit: mat?.unit || 'Cái',
      quantity: batchData.quantity,
      initialQuantity: batchData.quantity,
      locationId: batchData.locationId,
      locationCode: loc?.code || 'K01-T1-01',
      warehouse: loc?.warehouse || 'Kho A',
      manufactureDate: batchData.manufactureDate,
      expiryDate: batchData.expiryDate,
      status: 'AVAILABLE',
      receivingOrderCode: batchData.receivingOrderCode,
      qcCode: batchData.qcCode,
      unitCost: batchData.unitCost || mat?.standardPrice || 100000,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    setBatches(prev => [newBatch, ...prev]);

    // Update location occupied capacity
    if (loc) {
      const newOccupied = loc.occupied + batchData.quantity;
      const newStatus = newOccupied >= loc.capacity ? 'FULL' : newOccupied > 0 ? 'PARTIAL' : 'EMPTY';
      setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, occupied: newOccupied, status: newStatus } : l));
    }

    // Record Inbound Transaction
    const newTrx: WarehouseTransaction = {
      id: `TRX-${Date.now()}`,
      code: `GD-${dateStr}-${String(transactions.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: 'IN_PO',
      operationCode: 'IN_PO',
      typeLabel: 'Nhập Mua Hàng (PO)',
      materialId: newBatch.materialId,
      materialCode: newBatch.materialCode,
      materialName: newBatch.materialName,
      batchNumber: newBatch.batchNumber,
      quantity: newBatch.quantity,
      unit: newBatch.unit,
      destinationLocation: newBatch.locationCode,
      referenceDoc: batchData.receivingOrderCode || 'PUTAWAY',
      performer: currentUser.fullName,
      note: `Lưu kho vào vị trí ${newBatch.locationCode}`
    };
    setTransactions(prev => [newTrx, ...prev]);

    return newBatch;
  };

  const splitBatch = (batchId: string, quantities: number[]): BatchInventory[] => {
    const parent = batches.find(b => b.id === batchId);
    if (!parent) return [];

    const totalSplit = quantities.reduce((a, b) => a + b, 0);
    if (totalSplit > parent.quantity) {
      alert('Tổng số lượng tách vượt quá số lượng batch hiện có!');
      return [];
    }

    const remainingParentQty = parent.quantity - totalSplit;
    const newBatches: BatchInventory[] = [];
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    quantities.forEach((qty, idx) => {
      const childBatch: BatchInventory = {
        ...parent,
        id: `BAT-${Date.now()}-${idx}`,
        batchNumber: `${parent.batchNumber}-S${idx + 1}`,
        quantity: qty,
        initialQuantity: qty,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
      newBatches.push(childBatch);
    });

    setBatches(prev => [
      ...prev.map(b => b.id === batchId ? { ...b, quantity: remainingParentQty } : b),
      ...newBatches
    ]);

    // Record transaction
    const newTrx: WarehouseTransaction = {
      id: `TRX-${Date.now()}`,
      code: `GD-${dateStr}-${String(transactions.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: 'ADJUST_TRANSFER',
      typeLabel: 'Tách Batch & In tem nhãn',
      materialId: parent.materialId,
      materialCode: parent.materialCode,
      materialName: parent.materialName,
      batchNumber: parent.batchNumber,
      quantity: 0,
      unit: parent.unit,
      sourceLocation: parent.locationCode,
      referenceDoc: parent.batchNumber,
      performer: currentUser.fullName,
      note: `Tách batch thành ${newBatches.length} sub-batches mới`
    };
    setTransactions(prev => [newTrx, ...prev]);

    return newBatches;
  };

  const transferLocation = (batchId: string, newLocationId: string, note?: string) => {
    const batch = batches.find(b => b.id === batchId);
    const newLoc = locations.find(l => l.id === newLocationId);
    if (!batch || !newLoc) return;

    const oldLoc = locations.find(l => l.id === batch.locationId);
    const oldLocCode = batch.locationCode;

    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          locationId: newLocationId,
          locationCode: newLoc.code,
          warehouse: newLoc.warehouse
        };
      }
      return b;
    }));

    // Update locations occupancy
    if (oldLoc) {
      const oldOccupied = Math.max(0, oldLoc.occupied - batch.quantity);
      setLocations(prev => prev.map(l => l.id === oldLoc.id ? { ...l, occupied: oldOccupied, status: oldOccupied === 0 ? 'EMPTY' : 'PARTIAL' } : l));
    }
    const newOccupied = newLoc.occupied + batch.quantity;
    setLocations(prev => prev.map(l => l.id === newLoc.id ? { ...l, occupied: newOccupied, status: newOccupied >= newLoc.capacity ? 'FULL' : 'PARTIAL' } : l));

    // Record Transaction
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const newTrx: WarehouseTransaction = {
      id: `TRX-${Date.now()}`,
      code: `GD-${dateStr}-${String(transactions.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      type: 'MOV_BIN',
      operationCode: 'MOV_BIN',
      typeLabel: 'Chuyển Vị Trí Kệ',
      materialId: batch.materialId,
      materialCode: batch.materialCode,
      materialName: batch.materialName,
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      unit: batch.unit,
      sourceLocation: oldLocCode,
      destinationLocation: newLoc.code,
      referenceDoc: 'TRANSFER',
      performer: currentUser.fullName,
      note: note || `Chuyển kệ từ ${oldLocCode} sang ${newLoc.code}`
    };
    setTransactions(prev => [newTrx, ...prev]);
  };

  // 4. Outbound Actions
  const createIssueRequest = (data: {
    type: IssueRequestType;
    department: string;
    purpose: string;
    productionOrder?: string;
    requiredDate: string;
    items: { materialId: string; quantity: number; notes?: string }[];
  }): IssueRequest => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = issueRequests.length + 1;
    const code = `DNXK-${dateStr}-${String(count).padStart(3, '0')}`;

    const items = data.items.map((item, idx) => {
      const mat = materials.find(m => m.id === item.materialId);
      return {
        id: `II-${Date.now()}-${idx}`,
        materialId: item.materialId,
        materialCode: mat?.code || 'SKU',
        materialName: mat?.name || 'Vật tư',
        unit: mat?.unit || 'Cái',
        requestedQuantity: item.quantity,
        approvedQuantity: 0,
        issuedQuantity: 0,
        notes: item.notes
      };
    });

    const newRequest: IssueRequest = {
      id: `REQ-${Date.now()}`,
      code,
      type: data.type,
      department: data.department,
      requester: currentUser.fullName,
      purpose: data.purpose,
      productionOrder: data.productionOrder,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      requiredDate: data.requiredDate,
      status: 'PENDING_APPROVAL',
      items
    };

    setIssueRequests(prev => [newRequest, ...prev]);
    return newRequest;
  };

  const approveIssueRequest = (
    requestId: string,
    approved: boolean,
    comment?: string,
    itemApprovals?: { [itemId: string]: number }
  ) => {
    setIssueRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: approved ? 'APPROVED' : 'REJECTED',
          approver: currentUser.fullName,
          approvalDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
          approvalComment: comment || (approved ? 'Đã duyệt yêu cầu xuất kho' : 'Từ chối yêu cầu xuất kho'),
          items: req.items.map(item => ({
            ...item,
            approvedQuantity: approved ? (itemApprovals ? (itemApprovals[item.id] ?? item.requestedQuantity) : item.requestedQuantity) : 0
          }))
        };
      }
      return req;
    }));
  };

  const issueGoods = (requestId: string, pickingDetails: { itemId: string; batchId: string; quantity: number }[]) => {
    const targetReq = issueRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const pxkCode = `PXK-${dateStr}-${String(transactions.length + 1).padStart(3, '0')}`;

    // Deduct batches
    const updatedBatches = [...batches];
    const newTransactions: WarehouseTransaction[] = [];

    pickingDetails.forEach((pick, idx) => {
      const bIndex = updatedBatches.findIndex(b => b.id === pick.batchId);
      if (bIndex >= 0) {
        const batch = updatedBatches[bIndex];
        const newQty = Math.max(0, batch.quantity - pick.quantity);
        updatedBatches[bIndex] = { ...batch, quantity: newQty };

        // Deduct location occupied count
        setLocations(prev => prev.map(l => {
          if (l.id === batch.locationId) {
            const occ = Math.max(0, l.occupied - pick.quantity);
            return { ...l, occupied: occ, status: occ === 0 ? 'EMPTY' : 'PARTIAL' };
          }
          return l;
        }));

        // Create transaction
        newTransactions.push({
          id: `TRX-${Date.now()}-${idx}`,
          code: `GD-${dateStr}-${String(transactions.length + idx + 1).padStart(3, '0')}`,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          type: 'OUT_CON',
          operationCode: 'OUT_CON',
          typeLabel: 'Xuất Cho Sản Xuất',
          materialId: batch.materialId,
          materialCode: batch.materialCode,
          materialName: batch.materialName,
          batchNumber: batch.batchNumber,
          quantity: -pick.quantity,
          unit: batch.unit,
          sourceLocation: batch.locationCode,
          referenceDoc: pxkCode,
          performer: currentUser.fullName,
          note: `Xuất kho theo phiếu ${targetReq.code} - ${targetReq.purpose}`
        });
      }
    });

    setBatches(updatedBatches);
    setTransactions(prev => [...newTransactions, ...prev]);

    // Update issue request status
    setIssueRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'ISSUED',
          deliveryNoteNumber: pxkCode,
          issuedDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
          issuer: currentUser.fullName,
          items: req.items.map(item => {
            const pickedTotal = pickingDetails
              .filter(p => p.itemId === item.id)
              .reduce((sum, p) => sum + p.quantity, 0);
            return {
              ...item,
              issuedQuantity: pickedTotal > 0 ? pickedTotal : item.approvedQuantity
            };
          })
        };
      }
      return req;
    }));
  };

  const confirmReceivedIssueRequest = (requestId: string) => {
    setIssueRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'RECEIVED'
        };
      }
      return req;
    }));
  };

  // 5. Audit Actions
  const createAuditTicket = (warehouse: string, title: string, items: any[]): InventoryAuditTicket => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = auditTickets.length + 1;
    const code = `KK-${dateStr}-${String(count).padStart(3, '0')}`;

    const newTicket: InventoryAuditTicket = {
      id: `AUD-${Date.now()}`,
      code,
      title,
      date: new Date().toISOString().slice(0, 10),
      warehouse,
      auditor: currentUser.fullName,
      status: 'IN_PROGRESS',
      items: items.map((it, idx) => ({
        id: `AI-${Date.now()}-${idx}`,
        materialId: it.materialId,
        materialCode: it.materialCode,
        materialName: it.materialName,
        batchNumber: it.batchNumber,
        locationCode: it.locationCode,
        systemQuantity: it.systemQuantity,
        actualQuantity: it.actualQuantity ?? it.systemQuantity,
        difference: (it.actualQuantity ?? it.systemQuantity) - it.systemQuantity,
        status: (it.actualQuantity ?? it.systemQuantity) === it.systemQuantity ? 'MATCH' : (it.actualQuantity > it.systemQuantity ? 'SURPLUS' : 'SHORTAGE'),
        reason: it.reason || ''
      }))
    };

    setAuditTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  const completeAuditTicket = (ticketId: string, approved: boolean) => {
    setAuditTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: approved ? 'APPROVED' : 'COMPLETED'
        };
      }
      return t;
    }));
  };

  // 6. Master Data CRUD
  const addMaterial = (material: Omit<Material, 'id'>) => {
    const newMat: Material = {
      ...material,
      id: `MAT-${Date.now()}`
    };
    setMaterials(prev => [...prev, newMat]);
  };

  const updateMaterial = (id: string, material: Partial<Material>) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...material } : m));
  };

  const addLocation = (location: Omit<WarehouseLocation, 'id'>) => {
    const newLoc: WarehouseLocation = {
      ...location,
      id: `LOC-${Date.now()}`
    };
    setLocations(prev => [...prev, newLoc]);
  };

  return (
    <WarehouseContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        isAuthenticated,
        isAuthChecking,
        showLoginModal,
        setShowLoginModal,
        onLoginSuccess,
        loginWithCredentials,
        logoutUser,
        categories,
        materials,
        locations,
        batches,
        qcCriteria,
        receivingOrders,
        qcTickets,
        issueRequests,
        transactions,
        auditTickets,
        createReceivingOrder,
        updateReceivingStatus,
        createQCTicket,
        evaluateQCTicket,
        putawayBatch,
        splitBatch,
        transferLocation,
        createIssueRequest,
        approveIssueRequest,
        issueGoods,
        confirmReceivedIssueRequest,
        createAuditTicket,
        completeAuditTicket,
        addMaterial,
        updateMaterial,
        addLocation,
        resetData,
        activeBarcodePrint,
        setActiveBarcodePrint
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
};

export const useWarehouse = () => {
  const context = useContext(WarehouseContext);
  if (!context) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
};
