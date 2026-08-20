import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Barcode,
  Package,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Loader2,
  Check,
  ExternalLink,
  Database,
  Link2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserCheck,
  ArrowDownToLine,
  CheckSquare,
  ShieldCheck,
  X
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { ReceivingType, ReceivingOrder } from '../types';
import {
  receivingService,
  PurchaseOrderSummary,
  PurchaseOrderLine,
  MaterialOption,
  UnmatchedReceiptSummary,
  UnmatchedReceiptLine,
  ReceiptLogItem,
  ReceiptDetailResult,
  PoMatchCandidate,
  WarehouseQueueReceipt,
  WarehouseQueueLine,
  ProcessWarehouseReceiptResult
} from '../services/receivingService';
import {
  internalReturnService,
  DestinationOption,
  InternalReturnSummary,
  InternalReturnDetailResult,
  CreateInternalReturnItem
} from '../services/internalReturnService';
import {
  qualityService,
  InspectionCandidateReceipt,
  InspectionCandidateMaterial
} from '../services/qualityService';
import { getTodayUtc7String, getNowUtc7String, formatDate, formatDateTime } from '../utils/dateUtils';

export const ReceivingModule: React.FC = () => {
  const {
    receivingOrders,
    materials,
    createReceivingOrder,
    setActiveBarcodePrint,
    currentUser
  } = useWarehouse();

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'reconciliation' | 'internal_returns' | 'warehouse_entry' | 'qc_inspection'>('list');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ReceivingOrder | null>(null);

  // Real Database Receiving List & History states (UC-07 / INB-04)
  const [dbReceiptLogs, setDbReceiptLogs] = useState<ReceiptLogItem[]>([]);
  const [dbReceiptTotalCount, setDbReceiptTotalCount] = useState<number>(0);
  const [dbReceiptPage, setDbReceiptPage] = useState<number>(1);
  const [isReceiptLogLoading, setIsReceiptLogLoading] = useState<boolean>(false);
  const [liveReceiptDetail, setLiveReceiptDetail] = useState<ReceiptDetailResult | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Real QC Candidates States (UC-13 / QC-03)
  const [qcCandidateReceipts, setQcCandidateReceipts] = useState<InspectionCandidateReceipt[]>([]);
  const [qcCandidateMaterials, setQcCandidateMaterials] = useState<InspectionCandidateMaterial[]>([]);
  const [qcCandidateTotalCount, setQcCandidateTotalCount] = useState<number>(0);
  const [qcCandidatePage, setQcCandidatePage] = useState<number>(1);
  const [qcCandidateSearch, setQcCandidateSearch] = useState<string>('');
  const [isQcCandidatesLoading, setIsQcCandidatesLoading] = useState<boolean>(false);
  const [selectedQcReceipt, setSelectedQcReceipt] = useState<InspectionCandidateReceipt | null>(null);

  const loadQcCandidates = async (search?: string, page: number = 1) => {
    setIsQcCandidatesLoading(true);
    try {
      const data = await qualityService.getInspectionCandidates(search, undefined, page, 20);
      setQcCandidateReceipts(data.receipts || []);
      setQcCandidateMaterials(data.materials || []);
      setQcCandidateTotalCount(data.totalCount || 0);
      setQcCandidatePage(page);
      if (data.receipts && data.receipts.length > 0) {
        if (!selectedQcReceipt || !data.receipts.some(r => r.receiptId === selectedQcReceipt.receiptId)) {
          setSelectedQcReceipt(data.receipts[0]);
        }
      } else {
        setSelectedQcReceipt(null);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách phiếu chờ kiểm QC:', err);
    } finally {
      setIsQcCandidatesLoading(false);
    }
  };

  // Form states for creating a receiving order
  const [orderType, setOrderType] = useState<ReceivingType>('PO');
  const [poNumber, setPoNumber] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<{
    materialId: string;
    receivedQuantity: number;
    batchNumber: string;
    manufactureDate: string;
    expiryDate: string;
    note: string;
  }[]>([
    {
      materialId: materials[0]?.id || '',
      receivedQuantity: 100,
      batchNumber: `BAT-${getTodayUtc7String().replace(/-/g, '')}-01`,
      manufactureDate: getTodayUtc7String(),
      expiryDate: getTodayUtc7String(365),
      note: ''
    }
  ]);

  // Real Database PO states (UC-03)
  const [dbPos, setDbPos] = useState<PurchaseOrderSummary[]>([]);
  const [dbPoLines, setDbPoLines] = useState<PurchaseOrderLine[]>([]);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrderSummary | null>(null);
  const [selectedPoLines, setSelectedPoLines] = useState<PurchaseOrderLine[]>([]);
  const [poSearchText, setPoSearchText] = useState('');
  const [isPoLoading, setIsPoLoading] = useState(false);
  const [isSubmittingPo, setIsSubmittingPo] = useState(false);
  const [poWarehouseCode, setPoWarehouseCode] = useState('KHO-NVL');
  const [poReceiveQuantities, setPoReceiveQuantities] = useState<Record<string, number>>({});
  const [receiptSuccessModal, setReceiptSuccessModal] = useState<{ receiptId: number; po: string; linesCount: number } | null>(null);

  // Real Database Materials states (UC-04)
  const [dbMaterials, setDbMaterials] = useState<MaterialOption[]>([]);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
  const [nonPoSupplier, setNonPoSupplier] = useState('');
  const [nonPoWarehouse, setNonPoWarehouse] = useState('KHO-NVL');
  const [nonPoLines, setNonPoLines] = useState<{
    materialId: string;
    documentQuantity: number;
    receivedQuantity: number;
    unit: string;
    batchNumber: string;
  }[]>([
    {
      materialId: '1000633600',
      documentQuantity: 50,
      receivedQuantity: 50,
      unit: 'Xấp',
      batchNumber: `BAT-NOPO-${Date.now().toString().slice(-4)}`
    }
  ]);
  const [isSubmittingNonPo, setIsSubmittingNonPo] = useState(false);

  // PO Reconciliation states (UC-05 & UC-08)
  const [reconcileMode, setReconcileMode] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [unmatchedReceipts, setUnmatchedReceipts] = useState<UnmatchedReceiptSummary[]>([]);
  const [unmatchedLines, setUnmatchedLines] = useState<UnmatchedReceiptLine[]>([]);
  const [isUnmatchedLoading, setIsUnmatchedLoading] = useState(false);
  const [selectedUnmatched, setSelectedUnmatched] = useState<UnmatchedReceiptSummary | null>(null);
  const [selectedReconcilePo, setSelectedReconcilePo] = useState<PurchaseOrderSummary | null>(null);
  const [reconcilePoLines, setReconcilePoLines] = useState<PurchaseOrderLine[]>([]);
  const [selectedPoKeyMapping, setSelectedPoKeyMapping] = useState<Record<number, string>>({});
  const [poMatchesCandidates, setPoMatchesCandidates] = useState<PoMatchCandidate[]>([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState(false);
  const [isSubmittingAttach, setIsSubmittingAttach] = useState(false);

  // Load Real Receipt Logs from MMS1 (UC-07 / INB-04)
  const loadDatabaseReceiptLogs = async (query?: string, page: number = 1) => {
    setIsReceiptLogLoading(true);
    try {
      const data = await receivingService.getReceiptLog(query, page, 20);
      setDbReceiptLogs(data.items || []);
      setDbReceiptTotalCount(data.totalCount || 0);
      setDbReceiptPage(page);
    } catch (err) {
      console.warn('Lỗi tải danh sách phiếu nhận từ CSDL MMS1:', err);
    } finally {
      setIsReceiptLogLoading(false);
    }
  };

  // Load Full Live Receipt Detail from MMS1 (UC-07 / INB-03)
  const handleOpenReceiptDetail = async (receiptIdStr: string) => {
    const rId = parseInt(receiptIdStr, 10);
    if (!rId || isNaN(rId)) return;
    setIsDetailLoading(true);
    try {
      const detail = await receivingService.getReceiptDetail(rId);
      setLiveReceiptDetail(detail);
    } catch (err: any) {
      alert(err.message || 'Không thể tải chi tiết phiếu nhận từ CSDL');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Load PO match candidates for UC-08
  const loadPoMatches = async (receiptId: number) => {
    setIsMatchesLoading(true);
    try {
      const data = await receivingService.getPurchaseOrderMatches(receiptId);
      setPoMatchesCandidates(data.candidates || []);
    } catch (err) {
      console.warn('Lỗi tải danh sách PO gợi ý:', err);
    } finally {
      setIsMatchesLoading(false);
    }
  };

  // Load real POs from MMS1 API
  const loadDatabasePos = async (query?: string) => {
    setIsPoLoading(true);
    try {
      const data = await receivingService.getPurchaseOrders(query, 1, 30);
      setDbPos(data.items || []);
      setDbPoLines(data.lines || []);
    } catch (err) {
      console.warn('Lỗi tải danh sách PO từ CSDL:', err);
    } finally {
      setIsPoLoading(false);
    }
  };

  // Load real Materials from MMS1 API (UC-04)
  const loadDatabaseMaterials = async (query?: string) => {
    setIsMaterialsLoading(true);
    try {
      const data = await receivingService.getMaterials(query, 1, 50);
      setDbMaterials(data.items || []);
    } catch (err) {
      console.warn('Lỗi tải danh mục vật tư:', err);
    } finally {
      setIsMaterialsLoading(false);
    }
  };

  // Load Unmatched non-PO receipts from MMS1 API (UC-05 & UC-08)
  const loadUnmatchedReceipts = async (query?: string) => {
    setIsUnmatchedLoading(true);
    try {
      const data = await receivingService.getUnmatchedReceipts(query, 1, 50);
      setUnmatchedReceipts(data.items || []);
      setUnmatchedLines(data.lines || []);
    } catch (err) {
      console.warn('Lỗi tải danh sách phiếu chờ đối soát:', err);
    } finally {
      setIsUnmatchedLoading(false);
    }
  };

  // UC-08: Attach Multiple POs Handler
  const handleAttachMultiplePo = async () => {
    if (!selectedUnmatched) return;
    const currentLines = unmatchedLines.filter(l => l.receiptId === selectedUnmatched.receiptId);
    const assignments = currentLines
      .filter(l => selectedPoKeyMapping[l.receivingLineId])
      .map(l => ({
        receivingLineId: l.receivingLineId,
        purchaseOrderKey: selectedPoKeyMapping[l.receivingLineId],
        receivedQuantity: l.receivedQuantity
      }));

    if (assignments.length < currentLines.length) {
      alert('Vui lòng ánh xạ tất cả các dòng nhận vào đơn PO!');
      return;
    }

    const assignedPos = new Set<string>();
    const assignedCustomers = new Set<string>();

    assignments.forEach(a => {
      const match = poMatchesCandidates.find(c => c.purchaseOrderKey === a.purchaseOrderKey)
        || dbPoLines.find(p => p.purchaseOrderKey === a.purchaseOrderKey);
      if (match) {
        assignedPos.add(match.purchaseOrder);
        if (match.customerCode) assignedCustomers.add(match.customerCode);
      }
    });

    if (assignedPos.size < 2) {
      alert('Nghiệp vụ Ghép Nhiều PO (UC-08) yêu cầu ít nhất 2 mã đơn PO khác nhau! Nếu chỉ gắn 1 PO, hãy chuyển sang chế độ "Ghép 1 PO (UC-05)".');
      return;
    }

    if (assignedCustomers.size > 1) {
      alert('Tất cả các đơn PO được ghép phải thuộc cùng một Nhà cung cấp / Khách hàng!');
      return;
    }

    setIsSubmittingAttach(true);
    try {
      const result = await receivingService.attachMultiplePurchaseOrders(selectedUnmatched.receiptId, {
        expectedStatus: selectedUnmatched.statusCode || '2',
        assignments
      });

      alert(`Đã đối soát & gắn thành công ${result.assignmentCount} dòng vào các đơn PO (Ký hiệu: ${result.purchaseOrder}) cho phiếu #${result.receiptId}!`);
      setSelectedUnmatched(null);
      setSelectedPoKeyMapping({});
      loadUnmatchedReceipts();
      loadDatabaseReceiptLogs();
    } catch (err: any) {
      alert('Lỗi gắn nhiều PO cho phiếu nhận: ' + (err.message || err));
    } finally {
      setIsSubmittingAttach(false);
    }
  };
  // Internal Returns States (UC-06 / RET-01 & RET-02)
  const [internalReturnList, setInternalReturnList] = useState<InternalReturnSummary[]>([]);
  const [internalReturnTotalCount, setInternalReturnTotalCount] = useState<number>(0);
  const [internalReturnPage, setInternalReturnPage] = useState<number>(1);
  const [internalReturnStatusFilter, setInternalReturnStatusFilter] = useState<string>('ALL');
  const [internalReturnSearch, setInternalReturnSearch] = useState<string>('');
  const [isInternalReturnLoading, setIsInternalReturnLoading] = useState<boolean>(false);
  const [returnDestinations, setReturnDestinations] = useState<DestinationOption[]>([]);
  const [returnMaterials, setReturnMaterials] = useState<MaterialOption[]>([]);
  const [isReturnCatalogLoading, setIsReturnCatalogLoading] = useState<boolean>(false);
  const [selectedReturnDetail, setSelectedReturnDetail] = useState<InternalReturnDetailResult | null>(null);
  const [isReturnDetailLoading, setIsReturnDetailLoading] = useState<boolean>(false);

  // Form states for creating internal return (RET-01)
  const [isCreatingReturn, setIsCreatingReturn] = useState<boolean>(false);
  const [returnDestinationBravo, setReturnDestinationBravo] = useState<string>('');
  const [returnQualityCode, setReturnQualityCode] = useState<'1' | '2'>('1');
  const [returnDate, setReturnDate] = useState<string>(getTodayUtc7String());
  const [returnNote, setReturnNote] = useState<string>('');
  const [returnItems, setReturnItems] = useState<CreateInternalReturnItem[]>([
    { materialId: '', bravoId: '', materialName: '', quantity: 1, unit: 'Cái', note: 'Thừa chuyền sản xuất' }
  ]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState<boolean>(false);

  // Warehouse keeper confirmation state (RET-02)
  const [confirmRejectNote, setConfirmRejectNote] = useState<string>('');
  const [confirmBravoDoc, setConfirmBravoDoc] = useState<string>('');
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState<boolean>(false);

  // Load internal returns queue from API
  const loadInternalReturns = async (search?: string, status?: string, page: number = 1) => {
    setIsInternalReturnLoading(true);
    try {
      const data = await internalReturnService.getReturnQueue(search, status, page, 20);
      setInternalReturnList(data.items || []);
      setInternalReturnTotalCount(data.totalCount || 0);
      setInternalReturnPage(page);
    } catch (err) {
      console.warn('Lỗi tải danh sách phiếu trả nội bộ:', err);
    } finally {
      setIsInternalReturnLoading(false);
    }
  };

  // Load catalog (destinations & materials) for internal returns
  const loadReturnCatalog = async () => {
    setIsReturnCatalogLoading(true);
    try {
      const data = await internalReturnService.getCatalog();
      setReturnDestinations(data.destinations || []);
      setReturnMaterials(data.materials || []);
      if (data.destinations.length > 0 && !returnDestinationBravo) {
        setReturnDestinationBravo(data.destinations[0].destinationBravoCode);
      }
    } catch (err) {
      console.warn('Lỗi tải danh mục trả nội bộ:', err);
    } finally {
      setIsReturnCatalogLoading(false);
    }
  };

  // Load detail of an internal return
  const handleOpenReturnDetail = async (returnId: number) => {
    setIsReturnDetailLoading(true);
    setConfirmRejectNote('');
    setConfirmBravoDoc('');
    try {
      const detail = await internalReturnService.getInternalReturn(returnId);
      setSelectedReturnDetail(detail);
    } catch (err: any) {
      alert(err.message || 'Không thể tải chi tiết phiếu trả');
    } finally {
      setIsReturnDetailLoading(false);
    }
  };

  // Submit new internal return (RET-01)
  const handleCreateInternalReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDestinationBravo) {
      alert('Vui lòng chọn Đơn vị / Phân xưởng hoàn trả!');
      return;
    }
    const validItems = returnItems.filter(i => i.materialId && i.quantity > 0 && i.note.trim());
    if (validItems.length === 0) {
      alert('Vui lòng nhập ít nhất 1 dòng vật tư có số lượng > 0 và lý do hoàn trả!');
      return;
    }
    // Check duplicates
    const matIds = validItems.map(i => i.materialId.trim());
    if (new Set(matIds).size !== validItems.length) {
      alert('Không được trùng mã vật tư trên cùng một phiếu trả!');
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const res = await internalReturnService.createInternalReturn({
        destinationBravoCode: returnDestinationBravo,
        qualityCode: returnQualityCode,
        returnAt: `${returnDate}T12:00:00`,
        note: returnNote,
        items: validItems
      });

      alert(`Đã lập thành công phiếu trả nội bộ #${res.returnId} (Chờ thủ kho xác nhận)!`);
      setIsCreatingReturn(false);
      setReturnItems([{ materialId: '', bravoId: '', materialName: '', quantity: 1, unit: 'Cái', note: 'Thừa chuyền sản xuất' }]);
      setReturnNote('');
      loadInternalReturns(internalReturnSearch, internalReturnStatusFilter, 1);
    } catch (err: any) {
      alert('Lỗi lập phiếu trả nội bộ: ' + (err.message || err));
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Confirm internal return by warehouse keeper (RET-02)
  const handleConfirmReturn = async (resultCode: 1 | 2 | 3) => {
    if (!selectedReturnDetail) return;
    if (resultCode === 3 && !confirmRejectNote.trim()) {
      alert('Vui lòng nhập lý do từ chối tiếp nhận phiếu trả này!');
      return;
    }

    setIsSubmittingConfirm(true);
    try {
      const res = await internalReturnService.confirmInternalReturn(selectedReturnDetail.header.returnId, {
        resultCode,
        note: confirmRejectNote.trim() || undefined,
        bravoDocumentNumber: confirmBravoDoc.trim() || undefined
      });

      const label = resultCode === 1 ? 'Đã NHẬP KHO ĐẠT (Đã tạo Batch tồn kho)' : resultCode === 2 ? 'Đã NHẬP KHO LỖI/CÁCH LY' : 'Đã TỪ CHỐI TIẾP NHẬN';
      alert(`Xử lý thành công phiếu #${res.returnId}: ${label}! (Số batch sinh: ${res.createdBatchCount})`);
      setSelectedReturnDetail(null);
      loadInternalReturns(internalReturnSearch, internalReturnStatusFilter, internalReturnPage);
    } catch (err: any) {
      alert('Lỗi xác nhận phiếu trả: ' + (err.message || err));
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  // Warehouse Receipt Entry States (UC-09 / INB-07)
  const [warehouseQueueReceipts, setWarehouseQueueReceipts] = useState<WarehouseQueueReceipt[]>([]);
  const [warehouseQueueLines, setWarehouseQueueLines] = useState<WarehouseQueueLine[]>([]);
  const [warehouseQueueTotalCount, setWarehouseQueueTotalCount] = useState<number>(0);
  const [warehouseQueuePage, setWarehouseQueuePage] = useState<number>(1);
  const [warehouseQueueSearch, setWarehouseQueueSearch] = useState<string>('');
  const [isWarehouseQueueLoading, setIsWarehouseQueueLoading] = useState<boolean>(false);
  const [selectedWarehouseReceipt, setSelectedWarehouseReceipt] = useState<WarehouseQueueReceipt | null>(null);
  const [warehouseReceiveQuantities, setWarehouseReceiveQuantities] = useState<Record<number, number>>({});
  const [isSubmittingWarehouseReceipt, setIsSubmittingWarehouseReceipt] = useState<boolean>(false);
  const [warehouseReceiptSuccessModal, setWarehouseReceiptSuccessModal] = useState<ProcessWarehouseReceiptResult | null>(null);

  // Load warehouse entry queue from API (status_nhap = '4')
  const loadWarehouseQueue = async (search?: string, page: number = 1) => {
    setIsWarehouseQueueLoading(true);
    try {
      const data = await receivingService.getWarehouseReceiptQueue(search, undefined, page, 20);
      setWarehouseQueueReceipts(data.receipts || []);
      setWarehouseQueueLines(data.lines || []);
      setWarehouseQueueTotalCount(data.totalCount || 0);
      setWarehouseQueuePage(page);

      if (data.receipts && data.receipts.length > 0) {
        if (!selectedWarehouseReceipt || !data.receipts.some(r => r.receiptId === selectedWarehouseReceipt.receiptId)) {
          handleSelectWarehouseReceipt(data.receipts[0], data.lines);
        }
      } else {
        setSelectedWarehouseReceipt(null);
      }
    } catch (err) {
      console.warn('Lỗi tải hàng đợi nhập kho:', err);
    } finally {
      setIsWarehouseQueueLoading(false);
    }
  };

  // Select a receipt in warehouse entry queue
  const handleSelectWarehouseReceipt = (receipt: WarehouseQueueReceipt, linesList?: WarehouseQueueLine[]) => {
    setSelectedWarehouseReceipt(receipt);
    const lines = (linesList || warehouseQueueLines).filter(l => l.receiptId === receipt.receiptId);
    const defaultQtys: Record<number, number> = {};
    lines.forEach(l => {
      defaultQtys[l.receivingLineId] = Math.max(0, l.remainingQuantity);
    });
    setWarehouseReceiveQuantities(defaultQtys);
  };

  // Submit warehouse receipt finalization (UC-09 / INB-07)
  const handleProcessWarehouseReceipt = async () => {
    if (!selectedWarehouseReceipt) return;
    const lines = warehouseQueueLines.filter(l => l.receiptId === selectedWarehouseReceipt.receiptId);
    const items = lines
      .map(l => ({
        receivingLineId: l.receivingLineId,
        quantity: warehouseReceiveQuantities[l.receivingLineId] ?? l.remainingQuantity
      }))
      .filter(i => i.quantity > 0);

    if (items.length === 0) {
      alert('Vui lòng nhập số lượng nhập kho (> 0) cho ít nhất 1 dòng vật tư!');
      return;
    }

    setIsSubmittingWarehouseReceipt(true);
    try {
      const res = await receivingService.processWarehouseReceipt(selectedWarehouseReceipt.receiptId, {
        expectedStatus: selectedWarehouseReceipt.statusCode || '4',
        items
      });

      setWarehouseReceiptSuccessModal(res);
      loadWarehouseQueue(warehouseQueueSearch, warehouseQueuePage);
      loadDatabaseReceiptLogs();
    } catch (err: any) {
      alert('Lỗi hoàn tất thủ tục nhập kho: ' + (err.message || err));
    } finally {
      setIsSubmittingWarehouseReceipt(false);
    }
  };

  useEffect(() => {
    loadQcCandidates();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      loadDatabaseReceiptLogs(searchQuery, dbReceiptPage);
    } else if (activeTab === 'create') {
      if (orderType === 'PO') loadDatabasePos();
      else if (orderType === 'NON_PO') loadDatabaseMaterials();
    } else if (activeTab === 'reconciliation') {
      loadUnmatchedReceipts();
      loadDatabasePos();
    } else if (activeTab === 'internal_returns') {
      loadInternalReturns(internalReturnSearch, internalReturnStatusFilter, internalReturnPage);
      loadReturnCatalog();
    } else if (activeTab === 'warehouse_entry') {
      loadWarehouseQueue(warehouseQueueSearch, warehouseQueuePage);
    } else if (activeTab === 'qc_inspection') {
      loadQcCandidates(qcCandidateSearch, qcCandidatePage);
    }
  }, [activeTab, orderType]);

  const handleSelectPo = (po: PurchaseOrderSummary) => {
    setSelectedPo(po);
    setPoNumber(po.purchaseOrder);
    setSupplier(po.customerCode || 'Nhà Cung Cấp');
    
    // Filter lines belonging to this PO
    const lines = dbPoLines.filter(l => l.purchaseOrder === po.purchaseOrder);
    setSelectedPoLines(lines);

    // Default receive quantity to remaining quantity
    const defaultQtys: Record<string, number> = {};
    lines.forEach(l => {
      defaultQtys[l.purchaseOrderKey] = Math.max(0, l.remainingQuantity);
    });
    setPoReceiveQuantities(defaultQtys);
  };

  const handleCreateReceiptWithPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo || selectedPoLines.length === 0) {
      alert('Vui lòng chọn một đơn hàng PO từ CSDL!');
      return;
    }

    const linesToSubmit = selectedPoLines
      .filter(l => (poReceiveQuantities[l.purchaseOrderKey] || 0) > 0)
      .map(l => ({
        purchaseOrderKey: l.purchaseOrderKey,
        materialId: l.materialId || 'UNKNOWN',
        documentQuantity: l.orderedQuantity,
        receivedQuantity: Number(poReceiveQuantities[l.purchaseOrderKey] || 0),
        unit: l.unit || 'Cái',
        deliveryDate: l.deliveryDate
      }));

    if (linesToSubmit.length === 0) {
      alert('Vui lòng nhập số lượng thực nhận lớn hơn 0 cho ít nhất một dòng vật tư!');
      return;
    }

    setIsSubmittingPo(true);
    try {
      const result = await receivingService.createReceiptWithPo({
        purchaseOrder: selectedPo.purchaseOrder,
        warehouseCode: poWarehouseCode,
        lines: linesToSubmit,
        images: []
      });

      // Also register into local store for instant UI sync
      const newOrder = createReceivingOrder({
        type: 'PO',
        poNumber: selectedPo.purchaseOrder,
        supplier: selectedPo.customerCode || 'Nhà Cung Cấp',
        notes: `Phiếu nhận hàng thực tế từ CSDL MMS1 (Receipt ID: ${result.receiptId})`,
        items: linesToSubmit.map((line, idx) => ({
          id: `RI-${result.receiptId}-${idx}`,
          materialId: line.materialId,
          materialCode: line.materialId,
          materialName: selectedPoLines.find(p => p.materialId === line.materialId)?.materialName || line.materialId,
          unit: line.unit || 'Cái',
          poQuantity: line.documentQuantity,
          receivedQuantity: line.receivedQuantity,
          batchNumber: `BAT-${selectedPo.purchaseOrder}-${idx + 1}`,
          manufactureDate: getTodayUtc7String(),
          expiryDate: getTodayUtc7String(365)
        }))
      });

      setReceiptSuccessModal({
        receiptId: result.receiptId,
        po: selectedPo.purchaseOrder,
        linesCount: result.lineCount
      });

      setSelectedOrder(newOrder);
      setActiveTab('list');
      loadDatabasePos();
    } catch (err: any) {
      alert('Lỗi tạo phiếu nhận hàng: ' + (err.message || err));
    } finally {
      setIsSubmittingPo(false);
    }
  };

  // UC-04: Create Non-PO Receipt Handler
  const handleCreateReceiptWithoutPo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nonPoSupplier.trim()) {
      alert('Vui lòng nhập tên nhà cung cấp / đơn vị giao!');
      return;
    }
    if (nonPoLines.length === 0) {
      alert('Vui lòng thêm ít nhất một dòng vật tư!');
      return;
    }

    setIsSubmittingNonPo(true);
    try {
      const linesPayload = nonPoLines.map(l => ({
        materialId: l.materialId,
        documentQuantity: Number(l.documentQuantity),
        receivedQuantity: Number(l.receivedQuantity),
        unit: l.unit
      }));

      const result = await receivingService.createReceiptWithoutPo({
        supplierName: nonPoSupplier.trim(),
        warehouseCode: nonPoWarehouse,
        lines: linesPayload,
        images: []
      });

      const newOrder = createReceivingOrder({
        type: 'NON_PO',
        supplier: nonPoSupplier.trim(),
        notes: `Phiếu nhận hàng không PO thực tế CSDL MMS1 (Receipt ID: ${result.receiptId})`,
        items: nonPoLines.map((line, idx) => {
          const mat = dbMaterials.find(m => m.materialId === line.materialId);
          return {
            id: `RI-${result.receiptId}-${idx}`,
            materialId: line.materialId,
            materialCode: line.materialId,
            materialName: mat?.materialName || line.materialId,
            unit: line.unit || 'Cái',
            poQuantity: line.documentQuantity,
            receivedQuantity: line.receivedQuantity,
            batchNumber: line.batchNumber,
            manufactureDate: getTodayUtc7String(),
            expiryDate: getTodayUtc7String(365)
          };
        })
      });

      setReceiptSuccessModal({
        receiptId: result.receiptId,
        po: 'khong_po (Chờ đối soát PO)',
        linesCount: result.lineCount
      });

      setSelectedOrder(newOrder);
      setActiveTab('list');
    } catch (err: any) {
      alert('Lỗi tạo phiếu nhận không PO: ' + (err.message || err));
    } finally {
      setIsSubmittingNonPo(false);
    }
  };

  // UC-05: Attach PO Handler
  const handleAttachPo = async () => {
    if (!selectedUnmatched || !selectedReconcilePo) {
      alert('Vui lòng chọn phiếu nhận và đơn hàng PO cần gắn!');
      return;
    }

    const currentLines = unmatchedLines.filter(l => l.receiptId === selectedUnmatched.receiptId);
    const assignments = currentLines
      .filter(l => selectedPoKeyMapping[l.receivingLineId])
      .map(l => ({
        receivingLineId: l.receivingLineId,
        purchaseOrderKey: selectedPoKeyMapping[l.receivingLineId],
        receivedQuantity: l.receivedQuantity
      }));

    if (assignments.length === 0) {
      alert('Vui lòng ghép ít nhất một dòng vật tư với đơn PO!');
      return;
    }

    setIsSubmittingAttach(true);
    try {
      const result = await receivingService.attachPurchaseOrder(selectedUnmatched.receiptId, {
        purchaseOrder: selectedReconcilePo.purchaseOrder,
        expectedStatus: selectedUnmatched.statusCode || '2',
        assignments
      });

      alert(`Đã đối soát & gắn thành công PO ${result.purchaseOrder} cho phiếu nhận #${result.receiptId}!`);
      setSelectedUnmatched(null);
      setSelectedReconcilePo(null);
      setSelectedPoKeyMapping({});
      loadUnmatchedReceipts();
    } catch (err: any) {
      alert('Lỗi gắn PO cho phiếu nhận: ' + (err.message || err));
    } finally {
      setIsSubmittingAttach(false);
    }
  };

  const handleAddItemRow = () => {
    setOrderItems([
      ...orderItems,
      {
        materialId: materials[0]?.id || '',
        receivedQuantity: 50,
        batchNumber: `BAT-${getTodayUtc7String().replace(/-/g, '')}-0${orderItems.length + 1}`,
        manufactureDate: getTodayUtc7String(),
        expiryDate: getTodayUtc7String(365),
        note: ''
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (orderItems.length === 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    (updated[index] as any)[field] = value;
    setOrderItems(updated);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim() && orderType !== 'INTERNAL_RETURN') {
      alert('Vui lòng nhập tên nhà cung cấp!');
      return;
    }

    const itemsPayload = orderItems.map((item, idx) => {
      const mat = materials.find(m => m.id === item.materialId);
      return {
        id: `RI-${Date.now()}-${idx}`,
        materialId: item.materialId,
        materialCode: mat?.code || '',
        materialName: mat?.name || '',
        unit: mat?.unit || '',
        poQuantity: item.receivedQuantity,
        receivedQuantity: Number(item.receivedQuantity),
        batchNumber: item.batchNumber,
        manufactureDate: item.manufactureDate,
        expiryDate: item.expiryDate,
        note: item.note
      };
    });

    const newOrder = createReceivingOrder({
      type: orderType,
      poNumber: poNumber.trim() || undefined,
      supplier: orderType === 'INTERNAL_RETURN' ? 'Xưởng Sản Xuất Nội Bộ' : supplier,
      notes,
      items: itemsPayload
    });

    alert(`Đã tạo phiếu nhận hàng ${newOrder.code} thành công! Hệ thống đã tự động chuyển sang quy trình kiểm định chất lượng QC.`);
    setActiveTab('list');
    setSelectedOrder(newOrder);
  };

  const filteredOrders = receivingOrders.filter(order => {
    if (filterType !== 'ALL' && order.type !== filterType) return false;
    if (filterStatus !== 'ALL' && order.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = order.code.toLowerCase().includes(q);
      const matchPO = order.poNumber?.toLowerCase().includes(q);
      const matchSupplier = order.supplier.toLowerCase().includes(q);
      const matchItem = order.items.some(
        it => it.materialCode.toLowerCase().includes(q) || it.materialName.toLowerCase().includes(q)
      );
      return matchCode || matchPO || matchSupplier || matchItem;
    }
    return true;
  });

  const getStatusBadge = (status: ReceivingOrder['status']) => {
    switch (status) {
      case 'WAITING_QC':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ Kiểm QC</span>;
      case 'QC_IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Đang Đo Kiểm</span>;
      case 'QC_PASSED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> QC Đạt - Chờ Lưu Kho</span>;
      case 'QC_REJECTED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> QC Từ Chối</span>;
      case 'PUTAWAY_COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã Lưu Lên Kệ</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-[#007D3C] text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" /> Inbound Logistics & Receiving (Kềm Nghĩa WMS)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Quản Lý Nhận Hàng & Tạm Nhận Vật Tư (UC03 - UC09)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Nhận hàng theo PO nhà cung cấp, hàng mẫu không PO, đối soát đơn PO và hoàn tất thủ tục nhập kho vào CSDL MMS1.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[#007D3C] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5 inline mr-1 text-emerald-200" />
            Danh Sách Phiếu ({dbReceiptTotalCount > 0 ? dbReceiptTotalCount.toLocaleString() : '60,181'})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#007D3C] text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Tạo Phiếu Nhận (UC-03/04)
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-[#007D3C] text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-[#007D3C] border border-emerald-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" /> Đối Soát PO (UC-05/08)
            {unmatchedReceipts.length > 0 && (
              <span className="px-1.5 py-0.2 bg-[#F7941D] text-white text-[10px] font-bold rounded-full ml-1">
                {unmatchedReceipts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('internal_returns')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'internal_returns'
                ? 'bg-[#F7941D] text-white shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Trả Nội Bộ (UC-06)
            {internalReturnTotalCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full ml-1">
                {internalReturnTotalCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('qc_inspection');
              loadQcCandidates(qcCandidateSearch, 1);
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'qc_inspection'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Chờ Kiểm QC (UC-13)
            {qcCandidateTotalCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full ml-1">
                {qcCandidateTotalCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab('warehouse_entry');
              loadWarehouseQueue(warehouseQueueSearch, 1);
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'warehouse_entry'
                ? 'bg-[#007D3C] text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100 text-[#007D3C] border border-emerald-200'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" /> Nhập Kho (UC-09)
            {warehouseQueueTotalCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#F7941D] text-white text-[10px] font-bold rounded-full ml-1">
                {warehouseQueueTotalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Smartlog Inbound Realtime Metrics Strip (Interactive Click-to-View) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Tổng Phiếu CSDL -> Click để xem danh sách toàn bộ phiếu */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('list');
            setSearchQuery('');
            loadDatabaseReceiptLogs('', 1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'list'
              ? 'bg-emerald-50/80 border-[#007D3C] ring-2 ring-[#007D3C]/20 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
          title="Bấm để xem danh sách tất cả phiếu nhận hàng trong CSDL MMS1"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Phiếu CSDL</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 mt-0.5 block">
              {dbReceiptTotalCount > 0 ? dbReceiptTotalCount.toLocaleString() : '60,181'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Xem toàn bộ phiếu</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            activeTab === 'list' ? 'bg-[#007D3C] text-white' : 'bg-emerald-50 text-[#007D3C]'
          }`}>
            <Database className="w-5 h-5" />
          </div>
        </button>

        {/* Card 2: Chờ Kiểm Tra QC -> Click để mở danh sách phiếu chờ kiểm tra QC */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('qc_inspection');
            loadQcCandidates(qcCandidateSearch, 1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'qc_inspection'
              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
          title="Bấm để xem danh sách các phiếu đang chờ phòng QC đo đạc & kiểm định"
        >
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Chờ Kiểm Tra QC</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-700 mt-0.5 block">
              {qcCandidateTotalCount > 0 ? qcCandidateTotalCount : (receivingOrders.filter(r => r.status === 'WAITING_QC').length || 0)}
            </span>
            <span className="text-[10px] text-amber-600/80 mt-0.5 block font-semibold">Bấm để kiểm QC</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            activeTab === 'qc_inspection' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'
          }`}>
            <Clock className="w-5 h-5" />
          </div>
        </button>

        {/* Card 3: Chờ Nhập Kho Vào Kệ -> Click để chuyển sang tab Nhập Kho (UC-09) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('warehouse_entry');
            loadWarehouseQueue(warehouseQueueSearch, 1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'warehouse_entry'
              ? 'bg-emerald-50/80 border-[#007D3C] ring-2 ring-[#007D3C]/20 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
          title="Bấm để xem danh sách phiếu đã đạt QC sẵn sàng cất kệ & sinh lô tồn kho"
        >
          <div>
            <span className="text-[11px] font-bold text-[#007D3C] uppercase tracking-wider block">Chờ Nhập Kho Vào Kệ</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#007D3C] mt-0.5 block">
              {warehouseQueueTotalCount > 0 ? warehouseQueueTotalCount : '29'}
            </span>
            <span className="text-[10px] text-emerald-700/80 mt-0.5 block font-semibold">Bấm để nhập kệ</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            activeTab === 'warehouse_entry' ? 'bg-[#007D3C] text-white' : 'bg-emerald-50 text-[#007D3C]'
          }`}>
            <ArrowDownToLine className="w-5 h-5" />
          </div>
        </button>

        {/* Card 4: Chờ Ghép Đơn PO -> Click để chuyển sang tab Đối Soát PO */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('reconciliation');
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'reconciliation'
              ? 'bg-amber-50/80 border-[#F7941D] ring-2 ring-[#F7941D]/20 shadow-xs'
              : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
          }`}
          title="Bấm để xem các phiếu nhận hàng tạm chưa ghép đơn PO"
        >
          <div>
            <span className="text-[11px] font-bold text-[#F7941D] uppercase tracking-wider block">Chờ Ghép Đơn PO</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#F7941D] mt-0.5 block">
              {unmatchedReceipts.length}
            </span>
            <span className="text-[10px] text-amber-700/80 mt-0.5 block font-semibold">Bấm để đối soát PO</span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
            activeTab === 'reconciliation' ? 'bg-[#F7941D] text-white' : 'bg-amber-50 text-[#F7941D]'
          }`}>
            <Link2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {activeTab === 'reconciliation' ? (
        /* UC-05 & UC-08: PO Reconciliation & Attachment View */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <Link2 className="w-4 h-4" /> {reconcileMode === 'SINGLE' ? 'UC-05 / INB-05 - Gắn Đơn Hàng PO' : 'UC-08 / INB-06 - Ghép Nhiều Đơn PO'}
              </div>
              <h2 className="font-extrabold text-slate-900 text-lg mt-0.5">
                {reconcileMode === 'SINGLE' ? 'Ghép Nối Đơn PO Cho Phiếu Nhận Hàng Tạm' : 'Ghép Nhiều Đơn PO Khác Nhau Cho Cùng Phiếu Nhận'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {reconcileMode === 'SINGLE'
                  ? 'Đối soát toàn bộ dòng nhận của phiếu tạm với 1 đơn đặt hàng PO chính thức từ nhà cung cấp.'
                  : 'Đối soát các dòng nhận khác nhau của phiếu tạm với nhiều đơn PO khác nhau của cùng 1 nhà cung cấp (yêu cầu tối thiểu 2 PO).'}
              </p>
            </div>

            {/* Mode Toggle Buttons & Refresh */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setReconcileMode('SINGLE');
                    setSelectedPoKeyMapping({});
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    reconcileMode === 'SINGLE'
                      ? 'bg-white text-indigo-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔗 Ghép 1 PO (UC-05)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReconcileMode('MULTI');
                    setSelectedPoKeyMapping({});
                    if (selectedUnmatched) loadPoMatches(selectedUnmatched.receiptId);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    reconcileMode === 'MULTI'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📑 Ghép Nhiều PO (UC-08)
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  loadUnmatchedReceipts();
                  loadDatabasePos();
                  if (selectedUnmatched && reconcileMode === 'MULTI') {
                    loadPoMatches(selectedUnmatched.receiptId);
                  }
                }}
                disabled={isUnmatchedLoading}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUnmatchedLoading ? 'animate-spin' : ''}`} />
                <span>Tải lại ({unmatchedReceipts.length})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Unmatched Non-PO Receipts List */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                1. Chọn Phiếu Chưa Gắn PO ({unmatchedReceipts.length})
              </span>

              {isUnmatchedLoading ? (
                <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-slate-50 rounded-xl border border-slate-200">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Đang tải phiếu từ CSDL MMS1...</span>
                </div>
              ) : unmatchedReceipts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  Không có phiếu nhận nào đang chờ đối soát PO!
                </div>
              ) : (
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {unmatchedReceipts.map(rec => {
                    const isSelected = selectedUnmatched?.receiptId === rec.receiptId;
                    const lines = unmatchedLines.filter(l => l.receiptId === rec.receiptId);
                    return (
                      <button
                        type="button"
                        key={rec.receiptId}
                        onClick={() => {
                          setSelectedUnmatched(rec);
                          setSelectedReconcilePo(null);
                          setSelectedPoKeyMapping({});
                          if (reconcileMode === 'MULTI') {
                            loadPoMatches(rec.receiptId);
                          }
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-indigo-900 font-mono">Phiếu #{rec.receiptId}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Chờ PO (status: {rec.statusCode})
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-1">
                          {rec.customerName || 'Chưa xác định NCC'}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                          <span>Kho: {rec.warehouseCode || 'KHO-NVL'}</span>
                          <span>{rec.createdAt?.slice(0, 10)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                          {lines.length} dòng: {lines.map(l => `${l.materialId} (SL:${l.receivedQuantity})`).join(', ')}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: PO Selector & Line Matching Details */}
            <div className="lg:col-span-7 space-y-4">
              {selectedUnmatched ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      2. {reconcileMode === 'SINGLE' ? 'Ghép Dòng Nhận ⟷ 1 Đơn PO' : 'Ghép Dòng Nhận ⟷ Nhiều Đơn PO (UC-08)'} (Phiếu #{selectedUnmatched.receiptId})
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                      Kho: {selectedUnmatched.warehouseCode}
                    </span>
                  </div>

                  {reconcileMode === 'SINGLE' ? (
                    /* UC-05: Single PO Mode UI */
                    <>
                      {/* PO Selector */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="text-xs font-bold text-slate-700">Chọn Đơn Đặt Hàng PO Cần Gắn:</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                          {dbPos.map(po => {
                            const isPoSelected = selectedReconcilePo?.purchaseOrder === po.purchaseOrder;
                            return (
                              <button
                                type="button"
                                key={po.purchaseOrder}
                                onClick={() => {
                                  setSelectedReconcilePo(po);
                                  const lines = dbPoLines.filter(l => l.purchaseOrder === po.purchaseOrder);
                                  setReconcilePoLines(lines);

                                  // Auto map if matching materialId
                                  const currentRecLines = unmatchedLines.filter(l => l.receiptId === selectedUnmatched.receiptId);
                                  const autoMap: Record<number, string> = {};
                                  currentRecLines.forEach(cl => {
                                    const matchingPoLine = lines.find(pl => pl.materialId === cl.materialId);
                                    if (matchingPoLine) {
                                      autoMap[cl.receivingLineId] = matchingPoLine.purchaseOrderKey;
                                    }
                                  });
                                  setSelectedPoKeyMapping(autoMap);
                                }}
                                className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                                  isPoSelected
                                    ? 'border-indigo-600 bg-indigo-50 font-bold'
                                    : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                              >
                                <div className="flex justify-between font-mono">
                                  <span>{po.purchaseOrder}</span>
                                  <span className="text-blue-600">Còn {po.remainingQuantity}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate mt-0.5">{po.customerCode}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mapping Rows Table */}
                      {selectedReconcilePo && (
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-800">
                            Đối Soát Dòng Nhận ⟷ Dòng PO (<span className="font-mono text-indigo-700">{selectedReconcilePo.purchaseOrder}</span>):
                          </div>

                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                                <tr>
                                  <th className="p-3">Dòng Nhận Thực Tế</th>
                                  <th className="p-3 text-right">SL Nhận</th>
                                  <th className="p-3">Ghép Với Dòng PO</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {unmatchedLines
                                  .filter(l => l.receiptId === selectedUnmatched.receiptId)
                                  .map(line => (
                                    <tr key={line.receivingLineId} className="hover:bg-slate-50/50">
                                      <td className="p-3">
                                        <div className="font-bold text-slate-800 font-mono">{line.materialId}</div>
                                        <div className="text-[10px] text-slate-500">{line.materialName || 'Vật tư'}</div>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-right text-emerald-700">
                                        {line.receivedQuantity} {line.unit}
                                      </td>
                                      <td className="p-3">
                                        <select
                                          value={selectedPoKeyMapping[line.receivingLineId] || ''}
                                          onChange={e => {
                                            const key = e.target.value;
                                            setSelectedPoKeyMapping(prev => ({
                                              ...prev,
                                              [line.receivingLineId]: key
                                            }));
                                          }}
                                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                                        >
                                          <option value="">-- Chọn dòng PO --</option>
                                          {reconcilePoLines.map(pl => (
                                            <option key={pl.purchaseOrderKey} value={pl.purchaseOrderKey}>
                                              {pl.materialId} (Đặt: {pl.orderedQuantity} - Còn: {pl.remainingQuantity})
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={handleAttachPo}
                              disabled={isSubmittingAttach}
                              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                            >
                              {isSubmittingAttach ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Đang Gắn PO Vào CSDL MMS1...</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4" />
                                  <span>Xác Nhận Gắn PO Vào Phiếu Nhận</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* UC-08: Multi-PO Mode UI */
                    <div className="space-y-4">
                      <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs text-indigo-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          <span>Quy tắc Nghiệp vụ Ghép Nhiều PO (UC-08 / INB-06):</span>
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-indigo-800 space-y-0.5 pl-1">
                          <li>Mỗi dòng nhận có thể ghép vào một đơn PO khác nhau phù hợp với mã vật tư.</li>
                          <li>Tối thiểu phải có <strong>2 mã PO khác nhau</strong> được gán trong phiếu này.</li>
                          <li>Tất cả các đơn PO phải thuộc về <strong>cùng một Nhà cung cấp / Khách hàng</strong>.</li>
                        </ul>
                      </div>

                      {/* Multi PO Candidates Mapping Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Dòng Nhận Thực Tế</th>
                              <th className="p-3 text-right">SL Nhận</th>
                              <th className="p-3">Chọn Đơn PO & Khóa Chính Phù Hợp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {isMatchesLoading ? (
                              <tr>
                                <td colSpan={3} className="p-6 text-center text-xs text-slate-500">
                                  <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                                    <span>Đang phân tích và gợi ý các PO khớp vật tư từ CSDL MMS1...</span>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              unmatchedLines
                                .filter(l => l.receiptId === selectedUnmatched.receiptId)
                                .map(line => {
                                  // Matching candidate lines for this material
                                  const candidates = poMatchesCandidates.filter(c => c.receivingLineId === line.receivingLineId || c.materialId === line.materialId);
                                  return (
                                    <tr key={line.receivingLineId} className="hover:bg-slate-50/50">
                                      <td className="p-3">
                                        <div className="font-bold text-slate-800 font-mono">{line.materialId}</div>
                                        <div className="text-[10px] text-slate-500">{line.materialName || 'Vật tư'}</div>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-right text-emerald-700">
                                        {line.receivedQuantity} {line.unit}
                                      </td>
                                      <td className="p-3">
                                        <select
                                          value={selectedPoKeyMapping[line.receivingLineId] || ''}
                                          onChange={e => {
                                            const key = e.target.value;
                                            setSelectedPoKeyMapping(prev => ({
                                              ...prev,
                                              [line.receivingLineId]: key
                                            }));
                                          }}
                                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                                        >
                                          <option value="">-- Chọn đơn PO khớp ({candidates.length} PO khả dụng) --</option>
                                          {candidates.map(cand => (
                                            <option key={cand.purchaseOrderKey} value={cand.purchaseOrderKey}>
                                              PO: {cand.purchaseOrder} | NCC: {cand.customerCode} | Còn: {cand.remainingQuantity}
                                            </option>
                                          ))}
                                          {/* Fallback to global dbPoLines matching material */}
                                          {candidates.length === 0 &&
                                            dbPoLines
                                              .filter(pl => pl.materialId === line.materialId)
                                              .map(pl => (
                                                <option key={pl.purchaseOrderKey} value={pl.purchaseOrderKey}>
                                                  PO: {pl.purchaseOrder} | Đặt: {pl.orderedQuantity} - Còn: {pl.remainingQuantity}
                                                </option>
                                              ))}
                                        </select>
                                      </td>
                                    </tr>
                                  );
                                })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Multi PO Validation Summary Box */}
                      {(() => {
                        const currentLines = unmatchedLines.filter(l => l.receiptId === selectedUnmatched.receiptId);
                        const assignedKeys = Object.values(selectedPoKeyMapping).filter(Boolean);
                        const assignedPos = new Set<string>();
                        const assignedCustomers = new Set<string>();

                        assignedKeys.forEach(pk => {
                          const match = poMatchesCandidates.find(c => c.purchaseOrderKey === pk)
                            || dbPoLines.find(p => p.purchaseOrderKey === pk);
                          if (match) {
                            assignedPos.add(match.purchaseOrder);
                            if (match.customerCode) assignedCustomers.add(match.customerCode);
                          }
                        });

                        const isValidDistinctPo = assignedPos.size >= 2;
                        const isValidCustomer = assignedCustomers.size <= 1;
                        const isAllLinesMapped = assignedKeys.length === currentLines.length;
                        const canSubmit = isValidDistinctPo && isValidCustomer && isAllLinesMapped && !isSubmittingAttach;

                        return (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="flex items-center gap-1.5">
                                {isAllLinesMapped ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-amber-500" />
                                )}
                                <span>Ánh xạ: <strong>{assignedKeys.length} / {currentLines.length} dòng</strong></span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {isValidDistinctPo ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-rose-500" />
                                )}
                                <span>Số đơn PO: <strong>{assignedPos.size} PO</strong> (Yêu cầu &ge; 2)</span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {isValidCustomer ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-rose-500" />
                                )}
                                <span>NCC: <strong>{Array.from(assignedCustomers).join(', ') || 'Chưa xác định'}</strong></span>
                              </div>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button
                                type="button"
                                onClick={handleAttachMultiplePo}
                                disabled={!canSubmit}
                                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {isSubmittingAttach ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Đang Gắn Nhiều PO Vào CSDL MMS1...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Xác Nhận Đối Soát & Gắn Nhiều PO (UC-08)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Vui lòng bấm chọn một phiếu nhận chưa có PO ở danh sách bên trái để tiến hành ghép nối.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'internal_returns' ? (
        /* UC-06: Internal Returns (RET-01 & RET-02) */
        <div className="space-y-6">
          {/* Internal Returns Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                  <Package className="w-4 h-4" /> UC-06 / RET-01 & RET-02 - Nhận & Hoàn Trả Vật Tư Nội Bộ
                </div>
                <h2 className="font-extrabold text-slate-900 text-lg mt-0.5">
                  Quản Lý Phiếu Trả Vật Tư Phân Xưởng & Nhập Kho
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các phân xưởng sản xuất, tổ kỹ thuật lập phiếu trả vật tư thừa/lỗi về kho. Thủ kho tiếp nhận, phân loại chất lượng và tự động sinh Batch tồn kho.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingReturn(!isCreatingReturn)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCreatingReturn
                      ? 'bg-slate-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> {isCreatingReturn ? 'Đóng Form' : 'Lập Phiếu Trả Mới (RET-01)'}
                </button>
              </div>
            </div>

            {/* Form Lập Phiếu Trả Mới (RET-01) */}
            {isCreatingReturn && (
              <form onSubmit={handleCreateInternalReturn} className="mt-6 p-5 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" /> Form Lập Phiếu Trả Vật Tư Về Kho (RET-01)
                  </h3>
                  <span className="text-[11px] text-amber-800 font-mono">Kho đích: 20020100 (Kho Tổng NVL)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Đơn Vị / Phân Xưởng Trả (*):</label>
                    <select
                      value={returnDestinationBravo}
                      onChange={e => setReturnDestinationBravo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      {returnDestinations.map(d => (
                        <option key={d.destinationBravoCode} value={d.destinationBravoCode}>
                          [{d.destinationBravoCode}] {d.destinationName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phân Loại Chất Lượng (*):</label>
                    <select
                      value={returnQualityCode}
                      onChange={e => setReturnQualityCode(e.target.value as '1' | '2')}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="1">1 - Hàng Đạt (Còn dùng tốt / Thừa chuyền)</option>
                      <option value="2">2 - Hàng Lỗi / Không Đạt (Cần xử lý/phế phẩm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngày Hoàn Trả (*):</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={e => setReturnDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ghi Chú Chung Phiếu:</label>
                  <input
                    type="text"
                    value={returnNote}
                    onChange={e => setReturnNote(e.target.value)}
                    placeholder="Ví dụ: Trả vật tư dư sau ca sản xuất sáng 15/08..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Return Items Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Danh Sách Vật Tư Hoàn Trả ({returnItems.length} mục)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnItems(prev => [
                          ...prev,
                          { materialId: '', bravoId: '', materialName: '', quantity: 1, unit: 'Cái', note: 'Thừa chuyền sản xuất' }
                        ]);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-amber-700 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Thêm dòng
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-10">#</th>
                          <th className="p-3">Mã Vật Tư (*):</th>
                          <th className="p-3 w-32 text-right">Số Lượng (*):</th>
                          <th className="p-3 w-28">ĐVT:</th>
                          <th className="p-3">Lý Do Trả (*):</th>
                          <th className="p-3 w-14 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {returnItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3">
                              <select
                                value={item.materialId}
                                onChange={e => {
                                  const matId = e.target.value;
                                  const found = returnMaterials.find(m => m.materialId === matId)
                                    || dbMaterials.find(m => m.materialId === matId);
                                  setReturnItems(prev => prev.map((it, i) => i === idx ? {
                                    ...it,
                                    materialId: matId,
                                    bravoId: found?.bravoId || '',
                                    materialName: found?.materialName || matId,
                                    unit: found?.unit || it.unit
                                  } : it));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                              >
                                <option value="">-- Chọn vật tư từ CSDL ({returnMaterials.length || dbMaterials.length} SKU) --</option>
                                {(returnMaterials.length > 0 ? returnMaterials : dbMaterials).map(m => (
                                  <option key={m.materialId} value={m.materialId}>
                                    {m.materialId} - {m.materialName} ({m.unit})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0.0001"
                                step="any"
                                value={item.quantity}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setReturnItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-emerald-700"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.unit}
                                onChange={e => {
                                  const val = e.target.value;
                                  setReturnItems(prev => prev.map((it, i) => i === idx ? { ...it, unit: val } : it));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.note}
                                onChange={e => {
                                  const val = e.target.value;
                                  setReturnItems(prev => prev.map((it, i) => i === idx ? { ...it, note: val } : it));
                                }}
                                placeholder="Lý do hoàn trả..."
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                              />
                            </td>
                            <td className="p-3 text-center">
                              {returnItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setReturnItems(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-rose-500 hover:text-rose-700 p-1 font-bold text-sm"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingReturn(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReturn}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmittingReturn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi phiếu về CSDL MMS1...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Gửi Phiếu Trả Về Kho (RET-01)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Internal Returns Queue Filter & List */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={internalReturnSearch}
                    onChange={e => {
                      setInternalReturnSearch(e.target.value);
                      loadInternalReturns(e.target.value, internalReturnStatusFilter, 1);
                    }}
                    placeholder="Tìm mã phiếu, người lập, phân xưởng..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64 sm:w-80"
                  />
                </div>

                <select
                  value={internalReturnStatusFilter}
                  onChange={e => {
                    setInternalReturnStatusFilter(e.target.value);
                    loadInternalReturns(internalReturnSearch, e.target.value, 1);
                  }}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="1">Chờ kho xác nhận (status 1)</option>
                  <option value="2">Đã nhập kho (status 2)</option>
                  <option value="3">Từ chối tiếp nhận (status 3)</option>
                </select>

                <button
                  type="button"
                  onClick={() => loadInternalReturns(internalReturnSearch, internalReturnStatusFilter, internalReturnPage)}
                  disabled={isInternalReturnLoading}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isInternalReturnLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 font-medium">
                Tổng cộng: <strong className="text-slate-800 font-mono">{internalReturnTotalCount}</strong> phiếu trả
              </span>
            </div>

            {/* Returns Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Mã Phiếu</th>
                      <th className="p-3.5">Phân Xưởng / Đơn Vị Trả</th>
                      <th className="p-3.5">Phân Loại Chất Lượng</th>
                      <th className="p-3.5 text-right">Số Dòng / Tổng SL</th>
                      <th className="p-3.5">Người Lập</th>
                      <th className="p-3.5">Ngày Lập</th>
                      <th className="p-3.5">Trạng Thái Xử Lý</th>
                      <th className="p-3.5 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isInternalReturnLoading ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs text-slate-500">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            <span>Đang tải danh sách phiếu trả nội bộ từ CSDL MMS1...</span>
                          </div>
                        </td>
                      </tr>
                    ) : internalReturnList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-xs text-slate-500">
                          Không có phiếu trả nội bộ nào phù hợp với bộ lọc tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      internalReturnList.map(item => (
                        <tr key={item.returnId} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-amber-700">
                            #{item.returnId}
                          </td>
                          <td className="p-3.5 font-medium text-slate-800">
                            {item.destinationName || item.destinationBravoCode}
                          </td>
                          <td className="p-3.5">
                            {item.qualityCode === '1' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                1 - Hàng Đạt (Dùng tốt)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                2 - Hàng Lỗi / Không Đạt
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-right font-bold text-slate-700">
                            {item.lineCount} dòng ({item.totalQuantity})
                          </td>
                          <td className="p-3.5 text-slate-700 font-medium">
                            {item.createdBy}
                          </td>
                          <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                            {item.createdAt ? item.createdAt.slice(0, 10) : '—'}
                          </td>
                          <td className="p-3.5">
                            {item.statusCode === '1' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3" /> Chờ kho xác nhận (status 1)
                              </span>
                            ) : item.statusCode === '2' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Đã nhập kho (status 2)
                              </span>
                            ) : item.statusCode === '3' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                                <AlertCircle className="w-3 h-3" /> Đã từ chối (status 3)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                status {item.statusCode}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenReturnDetail(item.returnId)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer ${
                                item.statusCode === '1'
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                                  : 'text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {item.statusCode === '1' ? 'Kiểm Tra & Nhập Kho' : 'Xem Chi Tiết'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">
                  Hiển thị trang <strong className="text-slate-800">{internalReturnPage}</strong> / {Math.ceil(internalReturnTotalCount / 20) || 1}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={internalReturnPage <= 1 || isInternalReturnLoading}
                    onClick={() => loadInternalReturns(internalReturnSearch, internalReturnStatusFilter, internalReturnPage - 1)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Trang trước
                  </button>
                  <button
                    type="button"
                    disabled={internalReturnPage >= Math.ceil(internalReturnTotalCount / 20) || isInternalReturnLoading}
                    onClick={() => loadInternalReturns(internalReturnSearch, internalReturnStatusFilter, internalReturnPage + 1)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Trang sau <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'qc_inspection' ? (
        /* UC-13 & UC-14: Inbound QC Candidates (QC-03) */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4" /> UC-13 / QC-03 - Danh Sách Phiếu Chờ Kiểm Tra QC
                </div>
                <h2 className="font-extrabold text-slate-900 text-lg mt-0.5">
                  Kiểm Định Chất Lượng Vật Tư Nhận Hàng (QC Pass / Reject)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách các phiếu nhận tạm (status_nhap 2 / 5) có vật tư cần phòng QC đo đạc, kiểm tra ngoại quan và đánh giá tiêu chí trước khi hoàn tất nhập kho.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadQcCandidates(qcCandidateSearch, qcCandidatePage)}
                  disabled={isQcCandidatesLoading}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isQcCandidatesLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới hàng đợi QC</span>
                </button>
              </div>
            </div>

            {/* Two Column Master-Detail Interface for QC Inspection */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* Left Column: Candidate Receipts List */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Phiếu Chờ Kiểm QC ({qcCandidateTotalCount})
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={qcCandidateSearch}
                    onChange={e => {
                      setQcCandidateSearch(e.target.value);
                      loadQcCandidates(e.target.value, 1);
                    }}
                    placeholder="Tìm mã phiếu, PO, nhà cung cấp..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 font-medium"
                  />
                </div>

                {isQcCandidatesLoading ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
                    Đang tải danh sách chờ kiểm QC từ CSDL MMS1...
                  </div>
                ) : qcCandidateReceipts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Không có phiếu nhận nào đang chờ kiểm tra QC.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {qcCandidateReceipts.map(receipt => {
                      const isSelected = selectedQcReceipt?.receiptId === receipt.receiptId;
                      return (
                        <div
                          key={receipt.receiptId}
                          onClick={() => setSelectedQcReceipt(receipt)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50/80 border-amber-500 shadow-xs ring-1 ring-amber-500'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-amber-900 font-mono">
                              Phiếu #{receipt.receiptId}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Chờ kiểm QC
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {receipt.customerName || 'Nhà Cung Cấp'}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                            <span className="font-mono">PO: <strong className="text-slate-700">{receipt.purchaseOrder || '—'}</strong></span>
                            <span className="text-amber-700 font-bold font-mono">
                              {receipt.pendingMaterialCount} dòng vật tư
                            </span>
                          </div>

                          {receipt.receivedAt && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              Nhận lúc: {formatDateTime(receipt.receivedAt)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Selected Receipt Material Items */}
              <div className="lg:col-span-8 space-y-4">
                {selectedQcReceipt ? (
                  <div className="space-y-5">
                    {/* Header Banner */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 font-mono">
                            Chi Tiết Phiếu Chờ Kiểm QC #{selectedQcReceipt.receiptId}
                          </span>
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-md">
                            Đang Chờ Đánh Giá
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Nhà cung cấp: <strong className="text-slate-800">{selectedQcReceipt.customerName}</strong> • PO: <strong className="font-mono text-slate-800">{selectedQcReceipt.purchaseOrder}</strong> • Kho: <strong className="font-mono text-slate-800">{selectedQcReceipt.warehouseCode || '20020100'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Pending Materials Table */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                      <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Danh Sách Vật Tư Cần Kiểm Tra Chất Lượng
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {qcCandidateMaterials.filter(m => m.receiptId === selectedQcReceipt.receiptId).length} dòng vật tư
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px] uppercase">
                            <tr>
                              <th className="p-3">Dòng #</th>
                              <th className="p-3">Mã Vật Tư</th>
                              <th className="p-3">Tên Vật Tư & Quy Cách</th>
                              <th className="p-3 text-right">SL Nhận</th>
                              <th className="p-3">ĐVT</th>
                              <th className="p-3">Nhóm Kiểm QC</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {qcCandidateMaterials
                              .filter(m => m.receiptId === selectedQcReceipt.receiptId)
                              .map(item => (
                                <tr key={item.receivingLineId} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="p-3 font-mono text-slate-500">#{item.receivingLineId}</td>
                                  <td className="p-3 font-mono font-bold text-slate-900">{item.materialId}</td>
                                  <td className="p-3 font-semibold text-slate-800">{item.materialName}</td>
                                  <td className="p-3 font-mono font-bold text-amber-700 text-right">
                                    {item.quantityReceived.toLocaleString('vi-VN')}
                                  </td>
                                  <td className="p-3 font-mono text-slate-600">{item.unit}</td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      {item.qcGroupName || 'Tiêu Chuẩn Nhập Kho'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Vui lòng bấm chọn một phiếu nhận ở danh sách bên trái để xem chi tiết các dòng vật tư chờ kiểm QC.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'warehouse_entry' ? (
        /* UC-09: Warehouse Entry Finalization (INB-07) */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <ArrowDownToLine className="w-4 h-4" /> UC-09 / INB-07 - Thủ Tục Nhập Kho Chính Thức
                </div>
                <h2 className="font-extrabold text-slate-900 text-lg mt-0.5">
                  Xác Nhận Hàng Đạt QC & Tạo Lô Hàng Tồn Kho
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra các phiếu nhận đã có kết quả QC đạt, nhập số lượng thực tế nhập kho, tự động sinh phiếu giao dịch kho và Batch tồn kho.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadWarehouseQueue(warehouseQueueSearch, warehouseQueuePage)}
                  disabled={isWarehouseQueueLoading}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isWarehouseQueueLoading ? 'animate-spin' : ''}`} />
                  <span>Làm mới hàng đợi</span>
                </button>
              </div>
            </div>

            {/* Main Warehouse Entry Interface: Two Column Master-Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
              {/* Left Column: Warehouse Receipt Queue (status_nhap = '4') */}
              <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Phiếu Chờ Nhập Kho ({warehouseQueueTotalCount})
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={warehouseQueueSearch}
                    onChange={e => {
                      setWarehouseQueueSearch(e.target.value);
                      loadWarehouseQueue(e.target.value, 1);
                    }}
                    placeholder="Tìm mã phiếu, PO, nhà cung cấp..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                {isWarehouseQueueLoading ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Đang tải hàng đợi nhập kho từ CSDL MMS1...
                  </div>
                ) : warehouseQueueReceipts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Không có phiếu nhận nào đang chờ thủ tục nhập kho (status 4).
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                    {warehouseQueueReceipts.map(receipt => {
                      const isSelected = selectedWarehouseReceipt?.receiptId === receipt.receiptId;
                      return (
                        <div
                          key={receipt.receiptId}
                          onClick={() => handleSelectWarehouseReceipt(receipt)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-emerald-800 font-mono">
                              Phiếu #{receipt.receiptId}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Đã kiểm QC (status 4)
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-slate-800 truncate">
                            {receipt.customerName || 'Nhà Cung Cấp'}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                            <span className="font-mono">PO: <strong className="text-slate-700">{receipt.purchaseOrder || '—'}</strong></span>
                            <span>{receipt.pendingLineCount} dòng chờ nhập</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Selected Receipt Line Items & Confirmation */}
              <div className="lg:col-span-8 space-y-4">
                {selectedWarehouseReceipt ? (
                  <div className="space-y-5">
                    {/* Receipt Header Banner */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 font-mono">
                            Chi Tiết Nhập Kho Phiếu #{selectedWarehouseReceipt.receiptId}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">
                            Sẵn sàng nhập kho
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Nhà cung cấp: <strong className="text-slate-800">{selectedWarehouseReceipt.customerName}</strong> • PO: <strong className="font-mono text-slate-800">{selectedWarehouseReceipt.purchaseOrder}</strong> • Kho đích: <strong className="font-mono text-slate-800">{selectedWarehouseReceipt.warehouseCode || '20020100'}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSubmittingWarehouseReceipt}
                        onClick={handleProcessWarehouseReceipt}
                        className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmittingWarehouseReceipt ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang Xử Lý Nhập Kho...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Xác Nhận Nhập Kho (INB-07)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Line Items Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Mã Vật Tư (SKU)</th>
                            <th className="p-3.5">Tên Vật Tư Chi Tiết</th>
                            <th className="p-3.5 text-right">SL Thực Nhận</th>
                            <th className="p-3.5 text-right">Đã Nhập</th>
                            <th className="p-3.5 text-right">Chờ Nhập</th>
                            <th className="p-3.5 text-center">QC</th>
                            <th className="p-3.5 w-36 text-right">SL Nhập Kho (*):</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {warehouseQueueLines
                            .filter(l => l.receiptId === selectedWarehouseReceipt.receiptId)
                            .map((line, idx) => {
                              const qty = warehouseReceiveQuantities[line.receivingLineId] ?? line.remainingQuantity;
                              return (
                                <tr key={line.receivingLineId || idx} className="hover:bg-slate-50/60">
                                  <td className="p-3.5 font-mono font-bold text-blue-700">
                                    {line.materialId}
                                  </td>
                                  <td className="p-3.5 font-medium text-slate-800">
                                    {line.materialName}
                                  </td>
                                  <td className="p-3.5 font-mono text-right text-slate-600">
                                    {line.receivedQuantity} {line.unit}
                                  </td>
                                  <td className="p-3.5 font-mono text-right text-slate-400">
                                    {line.batchedQuantity}
                                  </td>
                                  <td className="p-3.5 font-mono font-bold text-right text-amber-700">
                                    {line.remainingQuantity}
                                  </td>
                                  <td className="p-3.5 text-center">
                                    {line.qcResultCode === '1' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Đạt (1)
                                      </span>
                                    ) : line.qcResultCode === '2' ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        Lỗi (2)
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                        {line.qcResultCode || 'QC Đạt'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <input
                                      type="number"
                                      min="0.0001"
                                      max={line.remainingQuantity}
                                      step="any"
                                      value={qty}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setWarehouseReceiveQuantities(prev => ({
                                          ...prev,
                                          [line.receivingLineId]: val
                                        }));
                                      }}
                                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-right text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                    <ArrowDownToLine className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    Vui lòng bấm chọn một phiếu nhận ở danh sách bên trái để tiến hành thủ tục nhập kho.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'create' ? (
        /* Create Receiving Order Form */
        <form onSubmit={orderType === 'NON_PO' ? handleCreateReceiptWithoutPo : handleCreateOrder} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-bold text-slate-900 text-base">Thông Tin Phiếu Nhận Hàng Mới</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống sẽ sinh mã số phiếu tự động và tạo liên kết kiểm tra QC đối với các nhóm vật tư yêu cầu kiểm định.
            </p>
          </div>

          {/* Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'PO' as ReceivingType, label: 'Nhận theo PO (UC-03)', desc: 'Có đơn đặt hàng từ nhà cung cấp' },
              { type: 'NON_PO' as ReceivingType, label: 'Nhận không PO (UC-04)', desc: 'Hàng mẫu thử nghiệm, quà tặng, linh kiện khẩn' },
              { type: 'INTERNAL_RETURN' as ReceivingType, label: 'Nhận trả nội bộ', desc: 'Xưởng sản xuất hoàn trả vật tư dư thừa' }
            ].map(t => (
              <button
                type="button"
                key={t.type}
                onClick={() => setOrderType(t.type)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  orderType === t.type
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{t.label}</div>
                <div className="text-[11px] text-slate-500 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* UC-03: Real PO Workflow */}
          {orderType === 'PO' ? (
            <div className="space-y-6">
              {/* PO Search & Selection Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Chọn Đơn Đặt Hàng PO Thực Tế (CSDL MMS1)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={poSearchText}
                        onChange={e => {
                          setPoSearchText(e.target.value);
                          loadDatabasePos(e.target.value);
                        }}
                        placeholder="Tìm theo mã PO, NCC, vật tư..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => loadDatabasePos(poSearchText)}
                      disabled={isPoLoading}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {isPoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Tìm</span>
                    </button>
                  </div>
                </div>

                {/* PO Quick Selection Grid */}
                {isPoLoading ? (
                  <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Đang tải danh sách PO từ máy chủ CSDL...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {dbPos.map(po => {
                      const isSelected = selectedPo?.purchaseOrder === po.purchaseOrder;
                      return (
                        <button
                          type="button"
                          key={po.purchaseOrder}
                          onClick={() => handleSelectPo(po)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 font-mono">{po.purchaseOrder}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Còn {po.remainingQuantity}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 font-medium truncate">
                            {po.customerCode || 'Nhà Cung Cấp'}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                            <span>Giao: {po.deliveryDate?.slice(0, 10) || 'Chưa định'}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected PO Line Items Details Table */}
              {selectedPo ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div>
                      <div className="text-xs font-bold text-emerald-900">
                        Đang chọn PO: <span className="font-mono text-emerald-700">{selectedPo.purchaseOrder}</span> — NCC: <span className="text-slate-800">{selectedPo.customerCode}</span>
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Tổng số dòng vật tư có thể nhận: {selectedPoLines.length} dòng
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        Kho Tiếp Nhận *:
                      </label>
                      <select
                        value={poWarehouseCode}
                        onChange={e => setPoWarehouseCode(e.target.value)}
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="KHO-NVL">KHO-NVL (Kho Nguyên Vật Liệu)</option>
                        <option value="KHO-TONG">KHO-TONG (Kho Tổng Chính)</option>
                        <option value="KHO-TAM">KHO-TAM (Kho Tạm Chờ QC)</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">#</th>
                          <th className="p-3">Mã Vật Tư</th>
                          <th className="p-3">Tên Vật Tư Chi Tiết</th>
                          <th className="p-3 text-center">ĐVT</th>
                          <th className="p-3 text-right">Số Lượng Đặt</th>
                          <th className="p-3 text-right">Đã Nhận</th>
                          <th className="p-3 text-right">Còn Lại</th>
                          <th className="p-3 text-right w-36">SL Thực Nhận (UC-03)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedPoLines.map((line, idx) => (
                          <tr key={line.purchaseOrderKey} className="hover:bg-slate-50/60">
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-mono font-bold text-blue-700">{line.materialId}</td>
                            <td className="p-3">
                              <div className="font-semibold text-slate-800">{line.materialName || line.materialId}</div>
                              {line.bravoId && (
                                <div className="text-[10px] text-slate-400 font-mono">Bravo: {line.bravoId}</div>
                              )}
                            </td>
                            <td className="p-3 text-center text-slate-600">{line.unit || 'Cái'}</td>
                            <td className="p-3 font-mono text-right text-slate-700">{line.orderedQuantity}</td>
                            <td className="p-3 font-mono text-right text-slate-500">{line.receivedQuantity}</td>
                            <td className="p-3 font-mono text-right font-bold text-emerald-700">{line.remainingQuantity}</td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                min="0"
                                max={line.remainingQuantity}
                                value={poReceiveQuantities[line.purchaseOrderKey] ?? line.remainingQuantity}
                                onChange={e => {
                                  const val = Math.min(line.remainingQuantity, Math.max(0, Number(e.target.value)));
                                  setPoReceiveQuantities(prev => ({
                                    ...prev,
                                    [line.purchaseOrderKey]: val
                                  }));
                                }}
                                className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 text-right focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCreateReceiptWithPo}
                      disabled={isSubmittingPo}
                      className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmittingPo ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang tạo phiếu nhận vào CSDL MMS1...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Xác Nhận Tạo Phiếu Nhận Hàng Theo PO (UC-03)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                  Vui lòng bấm chọn một Đơn đặt hàng PO ở danh sách phía trên để nạp các dòng vật tư chi tiết.
                </div>
              )}
            </div>
          ) : orderType === 'NON_PO' ? (
            /* UC-04: Non-PO Receiving Workflow */
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-amber-600" /> UC-04 / INB-02: Nhận Hàng Không PO (Mẫu / Khẩn / Quà tặng)
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Phiếu sẽ được tạo với ký hiệu tạm <code>ma_po = 'khong_po'</code>. Thủ kho có thể tiến hành đối soát và gắn PO chính thức ở Tab "Đối Soát PO (UC-05)" sau này.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nhà Cung Cấp / Đơn Vị Giao Hàng *:
                  </label>
                  <input
                    type="text"
                    required
                    value={nonPoSupplier}
                    onChange={e => setNonPoSupplier(e.target.value)}
                    placeholder="e.g. Cty TNHH Thép Việt Nhật..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kho Nhận *:
                  </label>
                  <select
                    value={nonPoWarehouse}
                    onChange={e => setNonPoWarehouse(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                  >
                    <option value="KHO-NVL">KHO-NVL (Kho Nguyên Vật Liệu)</option>
                    <option value="KHO-TONG">KHO-TONG (Kho Tổng Chính)</option>
                    <option value="KHO-TAM">KHO-TAM (Kho Tạm Nhận QC)</option>
                  </select>
                </div>
              </div>

              {/* Non-PO Item Rows Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Danh Sách Vật Tư Nhận Tạm (CSDL MMS1)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNonPoLines([
                        ...nonPoLines,
                        {
                          materialId: dbMaterials[0]?.materialId || '1000633600',
                          documentQuantity: 10,
                          receivedQuantity: 10,
                          unit: dbMaterials[0]?.unit || 'Cái',
                          batchNumber: `BAT-NOPO-${Date.now().toString().slice(-4)}`
                        }
                      ]);
                    }}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Dòng Vật Tư
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Vật Tư Trong Danh Mục</th>
                        <th className="p-3 text-right">SL Chứng Từ</th>
                        <th className="p-3 text-right">SL Thực Nhận</th>
                        <th className="p-3">Mã Lô (Batch)</th>
                        <th className="p-3 text-center w-12">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {nonPoLines.map((line, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3 min-w-[240px]">
                            <select
                              value={line.materialId}
                              onChange={e => {
                                const selMat = dbMaterials.find(m => m.materialId === e.target.value);
                                const updated = [...nonPoLines];
                                updated[idx].materialId = e.target.value;
                                if (selMat?.unit) updated[idx].unit = selMat.unit;
                                setNonPoLines(updated);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                            >
                              {dbMaterials.map(m => (
                                <option key={m.materialId} value={m.materialId}>
                                  {m.materialId} - {m.materialName || m.materialId} ({m.unit || 'ĐVT'})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 w-28 text-right">
                            <input
                              type="number"
                              min="1"
                              value={line.documentQuantity}
                              onChange={e => {
                                const updated = [...nonPoLines];
                                updated[idx].documentQuantity = Number(e.target.value);
                                setNonPoLines(updated);
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono text-right"
                            />
                          </td>
                          <td className="p-3 w-28 text-right">
                            <input
                              type="number"
                              min="1"
                              value={line.receivedQuantity}
                              onChange={e => {
                                const updated = [...nonPoLines];
                                updated[idx].receivedQuantity = Number(e.target.value);
                                setNonPoLines(updated);
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono font-bold text-amber-700 text-right"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={line.batchNumber}
                              onChange={e => {
                                const updated = [...nonPoLines];
                                updated[idx].batchNumber = e.target.value;
                                setNonPoLines(updated);
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => setNonPoLines(nonPoLines.filter((_, i) => i !== idx))}
                              disabled={nonPoLines.length === 1}
                              className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingNonPo}
                  className="py-3 px-6 bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isSubmittingNonPo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo phiếu nhận không PO vào CSDL MMS1...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tạo Phiếu Nhận Hàng Không PO (UC-04)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Manual & Internal Return Flow */
            <>
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {orderType === 'INTERNAL_RETURN' ? 'Đơn vị / Chuyền giao hoàn trả *' : 'Nhà Cung Cấp / Đơn Vị Giao *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder={orderType === 'INTERNAL_RETURN' ? 'e.g. Chuyền SMT 1 - Xưởng 1' : 'e.g. STMicroelectronics, Nichicon...'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Ghi Chú Vận Chuyển / Kiện Hàng
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Số kiện, tình trạng niêm phong, tài xế..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Item List Rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Danh Sách Vật Tư Nhận Thực Tế
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Dòng Vật Tư
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Mã & Tên Vật Tư (SKU)</th>
                        <th className="p-3">Số Lượng</th>
                        <th className="p-3">Mã Lô (Batch No)</th>
                        <th className="p-3">Ngày SX</th>
                        <th className="p-3">Hạn Dùng (EXP)</th>
                        <th className="p-3">Ghi Chú</th>
                        <th className="p-3 w-12 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderItems.map((item, idx) => {
                        const selMat = materials.find(m => m.id === item.materialId);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3 min-w-[220px]">
                              <select
                                value={item.materialId}
                                onChange={e => handleItemChange(idx, 'materialId', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                              >
                                {materials.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.code} - {m.name} ({m.unit})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 w-28">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.receivedQuantity}
                                  onChange={e => handleItemChange(idx, 'receivedQuantity', Math.max(1, Number(e.target.value)))}
                                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono font-bold text-blue-700 text-right"
                                />
                                <span className="text-[11px] text-slate-500 shrink-0">{selMat?.unit}</span>
                              </div>
                            </td>
                            <td className="p-3 min-w-[150px]">
                              <input
                                type="text"
                                value={item.batchNumber}
                                onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono"
                              />
                            </td>
                            <td className="p-3 w-32">
                              <input
                                type="date"
                                value={item.manufactureDate}
                                onChange={e => handleItemChange(idx, 'manufactureDate', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono"
                              />
                            </td>
                            <td className="p-3 w-32">
                              <input
                                type="date"
                                value={item.expiryDate}
                                onChange={e => handleItemChange(idx, 'expiryDate', e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono text-rose-600 font-semibold"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                value={item.note}
                                onChange={e => handleItemChange(idx, 'note', e.target.value)}
                                placeholder="Khay/cuộn..."
                                className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                disabled={orderItems.length === 1}
                                className="text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm cursor-pointer"
                >
                  Lưu & Xác Nhận Tạm Nhận Hàng
                </button>
              </div>
            </>
          )}
        </form>
      ) : (
        /* Real Database List View of Receiving Orders (UC-07 / INB-04) */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    loadDatabaseReceiptLogs(e.target.value, 1);
                  }}
                  placeholder="Tìm số phiếu, mã PO, nhà cung cấp, kho..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64 sm:w-80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => loadDatabaseReceiptLogs(searchQuery, dbReceiptPage)}
                disabled={isReceiptLogLoading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReceiptLogLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Tổng cộng: <strong className="text-slate-800 font-mono">{dbReceiptTotalCount.toLocaleString()}</strong> phiếu trong CSDL MMS1
              </span>
            </div>
          </div>

          {/* Real Database Receipts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Phiếu CSDL</th>
                    <th className="p-3.5">Kho Nhận</th>
                    <th className="p-3.5">Số PO / Đơn Hàng</th>
                    <th className="p-3.5">Khách Hàng / Nhà Cung Cấp</th>
                    <th className="p-3.5">Trạng Thái (status_nhap)</th>
                    <th className="p-3.5">Thao Tác Gần Nhất</th>
                    <th className="p-3.5">Người Thực Hiện</th>
                    <th className="p-3.5">Thời Gian Ghi Nhận</th>
                    <th className="p-3.5 text-right">Xem Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isReceiptLogLoading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-xs text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>Đang tải danh sách phiếu từ CSDL MMS1...</span>
                        </div>
                      </td>
                    </tr>
                  ) : dbReceiptLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-xs text-slate-500">
                        Không tìm thấy phiếu nhận nào phù hợp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    dbReceiptLogs.map(item => (
                      <tr key={item.historyId} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-blue-700">
                          #{item.receiptId}
                        </td>
                        <td className="p-3.5 font-mono font-medium text-slate-700">
                          {item.warehouseCode || '—'}
                        </td>
                        <td className="p-3.5 font-mono font-semibold">
                          {item.purchaseOrder === 'khong_po' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              khong_po (Chờ gắn PO)
                            </span>
                          ) : (
                            <span className="text-slate-900">{item.purchaseOrder || '—'}</span>
                          )}
                        </td>
                        <td className="p-3.5 font-medium text-slate-800 max-w-[200px] truncate">
                          {item.customerName || 'Chưa định NCC'}
                        </td>
                        <td className="p-3.5">
                          {item.statusCode === '2' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3" /> Chờ Kiểm QC (status 2)
                            </span>
                          ) : item.statusCode === '4' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3" /> Đã Nhập Kho (status 4)
                            </span>
                          ) : item.statusCode === '0' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3 h-3" /> Đã Hủy (status 0)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              status {item.statusCode}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.actionType === 'CREATE' ? 'bg-blue-50 text-blue-700' :
                            item.actionType === 'UPDATE_PO' ? 'bg-indigo-50 text-indigo-700' :
                            item.actionType === 'DELETE' ? 'bg-rose-50 text-rose-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {item.actionType || 'GHI SỔ'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">
                          {item.actorName || 'Hệ thống'}
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {item.auditTime ? item.auditTime.replace('T', ' ').slice(0, 19) : '—'}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenReceiptDetail(item.receiptId)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 active:scale-95 rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Chi Tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-500">
                Hiển thị trang <strong className="text-slate-800">{dbReceiptPage}</strong> / {Math.ceil(dbReceiptTotalCount / 20) || 1} (20 phiếu / trang)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={dbReceiptPage <= 1 || isReceiptLogLoading}
                  onClick={() => loadDatabaseReceiptLogs(searchQuery, dbReceiptPage - 1)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trang trước
                </button>
                <button
                  type="button"
                  disabled={dbReceiptPage >= Math.ceil(dbReceiptTotalCount / 20) || isReceiptLogLoading}
                  onClick={() => loadDatabaseReceiptLogs(searchQuery, dbReceiptPage + 1)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  Trang sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Database Receipt Detail Modal (UC-07 / INB-03) */}
      {liveReceiptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    Chi Tiết Phiếu Nhận Hàng CSDL MMS1 (UC-07 / INB-03)
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mt-0.5">
                  Phiếu Nhận #{liveReceiptDetail.header?.receiptId}
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                    Trạng thái: status {liveReceiptDetail.header?.statusCode}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setLiveReceiptDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header Details Overview */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Mã PO / Đơn Hàng:</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">{liveReceiptDetail.header?.purchaseOrder || 'khong_po'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Khách Hàng / NCC:</span>
                  <span className="font-bold text-slate-800">{liveReceiptDetail.header?.customerName || 'Chưa xác định'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Kho Tiếp Nhận:</span>
                  <span className="font-bold text-slate-800 font-mono">{liveReceiptDetail.header?.warehouseCode || 'KHO-NVL'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Người Tạo & Thời Gian:</span>
                  <span className="font-semibold text-slate-700 block">{liveReceiptDetail.header?.createdBy || '00'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{liveReceiptDetail.header?.createdAt?.slice(0, 10)}</span>
                </div>
              </div>

              {/* Lines Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">
                  Danh Sách Vật Tư Chi Tiết ({liveReceiptDetail.lines.length} dòng)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Mã Vật Tư (SKU)</th>
                        <th className="p-3">Tên Vật Tư Chi Tiết</th>
                        <th className="p-3 text-right">SL Chứng Từ</th>
                        <th className="p-3 text-right">SL Thực Nhận</th>
                        <th className="p-3 text-center">ĐVT</th>
                        <th className="p-3">Khóa Chính PO</th>
                        <th className="p-3 text-center">Kết Quả QC</th>
                        <th className="p-3 text-center">In Tem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liveReceiptDetail.lines.map((line, idx) => (
                        <tr key={line.receivingLineId || idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-blue-700">{line.materialId}</td>
                          <td className="p-3 font-medium text-slate-800">{line.materialName || line.materialId}</td>
                          <td className="p-3 font-mono text-right text-slate-600">{line.documentQuantity}</td>
                          <td className="p-3 font-mono font-bold text-right text-emerald-700">{line.receivedQuantity}</td>
                          <td className="p-3 text-center text-slate-600">{line.unit || 'Cái'}</td>
                          <td className="p-3 font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                            {line.purchaseOrderKey || '—'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {line.qcResultCode || 'Chờ QC'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveBarcodePrint({
                                  title: `Tem Nhận #${liveReceiptDetail.header?.receiptId}`,
                                  batchNumber: `BAT-${liveReceiptDetail.header?.purchaseOrder || 'NOPO'}-${idx + 1}`,
                                  materialName: line.materialName || line.materialId || 'Vật tư',
                                  materialCode: line.materialId || 'MAT',
                                  quantity: line.receivedQuantity,
                                  unit: line.unit || 'Cái',
                                  receivingDate: getTodayUtc7String(),
                                  expiryDate: getTodayUtc7String(365)
                                });
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs cursor-pointer"
                              title="In Tem Barcode"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setLiveReceiptDetail(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC-06 / RET-02: Warehouse Keeper Confirmation & Detail Modal */}
      {selectedReturnDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                    Chi Tiết Phiếu Trả Nội Bộ & Xác Nhận Nhập Kho (UC-06 / RET-01 & RET-02)
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2 mt-0.5">
                  Phiếu Trả #{selectedReturnDetail.header.returnId}
                  {selectedReturnDetail.header.statusCode === '1' ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                      Chờ thủ kho xác nhận (status 1)
                    </span>
                  ) : selectedReturnDetail.header.statusCode === '2' ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                      Đã nhập kho (status 2)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800">
                      Từ chối (status 3)
                    </span>
                  )}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReturnDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Đơn vị / Phân xưởng:</span>
                  <span className="font-bold text-slate-800">{selectedReturnDetail.header.destinationName || selectedReturnDetail.header.destinationBravoCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phân loại chất lượng:</span>
                  <span className="font-bold text-slate-800">
                    {selectedReturnDetail.header.qualityCode === '1' ? '1 - Hàng Đạt' : '2 - Hàng Lỗi'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Người lập & Ngày tạo:</span>
                  <span className="font-semibold text-slate-700 block">{selectedReturnDetail.header.createdBy}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedReturnDetail.header.createdAt?.slice(0, 10)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ghi chú phiếu:</span>
                  <span className="text-slate-700 italic">{selectedReturnDetail.header.note || '—'}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-xs">
                  Danh Sách Vật Tư Hoàn Trả ({selectedReturnDetail.lines.length} dòng)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Mã Vật Tư (SKU)</th>
                        <th className="p-3">Tên Vật Tư Chi Tiết</th>
                        <th className="p-3 text-right">Số Lượng</th>
                        <th className="p-3 text-center">ĐVT</th>
                        <th className="p-3">Lý Do Hoàn Trả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReturnDetail.lines.map((line, idx) => (
                        <tr key={line.lineId || idx} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-blue-700">{line.materialId}</td>
                          <td className="p-3 font-medium text-slate-800">{line.materialName}</td>
                          <td className="p-3 font-mono font-bold text-right text-emerald-700">{line.quantity}</td>
                          <td className="p-3 text-center text-slate-600">{line.unit}</td>
                          <td className="p-3 text-slate-600 italic">{line.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warehouse Keeper Decision Area (if status 1) */}
              {selectedReturnDetail.header.statusCode === '1' && (
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                  <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-amber-700" />
                    <span>Quyết Định Của Thủ Kho (Xác nhận nhập kho & tạo Batch tồn kho):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Số Chứng Từ Bravo (Tùy chọn):</label>
                      <input
                        type="text"
                        value={confirmBravoDoc}
                        onChange={e => setConfirmBravoDoc(e.target.value)}
                        placeholder="Ví dụ: NK-NB-2026-08..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Lý Do Từ Chối (Bắt buộc nếu từ chối):</label>
                      <input
                        type="text"
                        value={confirmRejectNote}
                        onChange={e => setConfirmRejectNote(e.target.value)}
                        placeholder="Nhập lý do nếu không chấp nhận phiếu..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-amber-200/60">
                    <button
                      type="button"
                      disabled={isSubmittingConfirm}
                      onClick={() => handleConfirmReturn(3)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                    >
                      ❌ Từ Chối Tiếp Nhận
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingConfirm}
                      onClick={() => handleConfirmReturn(2)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                    >
                      ⚠️ Chấp Nhận - Nhập Kho Hàng Lỗi/Cách Ly
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingConfirm}
                      onClick={() => handleConfirmReturn(1)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmittingConfirm ? (
                        <span className="flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xử lý...</span>
                      ) : (
                        <span>✅ Chấp Nhận - Nhập Kho Đạt (Tạo Batch)</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setSelectedReturnDetail(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC-03: Real Receipt Creation Success Modal */}
      {receiptSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Tạo Phiếu Nhận Hàng Thành Công!</h3>
              <p className="text-xs text-slate-500 mt-1">Đã lưu trữ dữ liệu thực tế vào CSDL MMS1 qua Stored Procedure</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã Phiếu CSDL (Receipt ID):</span>
                <span className="font-bold text-emerald-700 text-sm">#{receiptSuccessModal.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đơn Hàng (PO No):</span>
                <span className="font-bold text-slate-800">{receiptSuccessModal.po}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số dòng vật tư đã nhận:</span>
                <span className="font-bold text-blue-700">{receiptSuccessModal.linesCount} dòng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái phiếu:</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Chờ Kiểm QC (W3)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReceiptSuccessModal(null)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Hoàn Tất & Xem Danh Sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UC-09: Warehouse Receipt Finalization Success Modal */}
      {warehouseReceiptSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Hoàn Tất Thủ Tục Nhập Kho!</h3>
              <p className="text-xs text-slate-500 mt-1">Đã chốt phiếu nhận và tự động tạo Lô hàng tồn kho (Batch) vào CSDL MMS1</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã Phiếu Nhận Hàng:</span>
                <span className="font-bold text-slate-800 text-sm">#{warehouseReceiptSuccessModal.receiptId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã Phiếu Giao Dịch Kho:</span>
                <span className="font-bold text-emerald-700 text-sm">#{warehouseReceiptSuccessModal.transactionDocumentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số Lô Hàng (Batch) Sinh Mới:</span>
                <span className="font-bold text-blue-700">{warehouseReceiptSuccessModal.batchCount} lô tồn kho</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Trạng thái phiếu:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {warehouseReceiptSuccessModal.statusCode === '5' ? 'Đã Nhập Kho Xong (status 5)' : 'Nhập Kho 1 Phần (status 4)'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWarehouseReceiptSuccessModal(null)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Đóng & Xem Hàng Đợi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
