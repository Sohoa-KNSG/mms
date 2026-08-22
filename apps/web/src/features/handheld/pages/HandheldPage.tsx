import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Barcode,
  Camera,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  ArrowRightLeft,
  ArrowRight,
  ClipboardCheck,
  ClipboardList,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  Printer,
  MapPin,
  Wifi,
  WifiOff,
  BatteryCharging,
  Info,
  Plus,
  Minus,
  Moon,
  Sun,
  Check,
  History,
  Loader2,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { useWarehouse } from '../../../app/providers/warehouseStore';
import { soundManager } from '../../../shared/utils/audioFeedback';
import { HandheldScannerModal } from '../components/HandheldScannerModal';
import { BatchInventory, WarehouseLocation, ReceivingOrder, IssueRequest } from '../../../shared/types';
import {
  cycleCountService,
  CycleCountPlanSummary,
  CycleCountPlanDetail,
  CycleCountBatchItem,
  WarehouseLocationOption
} from '../../../features/cycle-count/api/cycleCountApi';
import { printService } from '../../../infrastructure/printing/printClient';
import { formatTime } from '../../../shared/utils/dateUtils';
import {
  batchAuditApi,
  BatchAuditPlanSummary,
  BatchAuditPlanDetailResponse,
  BatchAuditDetailItem
} from '../../../features/inventory/api/batchAuditApi';
import { outboundService } from '../../../features/outbound/api/outboundApi';

export type PDAMode =
  | 'MENU'
  | 'PUTAWAY'
  | 'PICKING'
  | 'RECEIVING'
  | 'TRANSFER'
  | 'COUNT'
  | 'BATCH_AUDIT'
  | 'CYCLE_COUNT'
  | 'LOOKUP';

interface HandheldModuleProps {
  onExitToDesktop?: () => void;
}

export const HandheldModule: React.FC<HandheldModuleProps> = ({ onExitToDesktop }) => {
  const {
    currentUser,
    materials,
    locations,
    batches,
    receivingOrders,
    issueRequests,
    refreshIssueRequests,
    transferLocation,
    issueGoods,
    setActiveBarcodePrint
  } = useWarehouse();

  const [activePDAMode, setActivePDAMode] = useState<PDAMode>('MENU');
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isSoundEnabled());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mms_pda_dark') === 'true';
  });
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showBanner('success', 'Đã kết nối lại mạng (Online). Đang đồng bộ dữ liệu...');
      setOfflineQueueCount(0);
    };
    const handleOffline = () => {
      setIsOnline(false);
      showBanner('info', 'Mất kết nối mạng. Đã tự động chuyển sang chế độ Bộ đệm Offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    localStorage.setItem('mms_pda_dark', newVal ? 'true' : 'false');
  };

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerConfig, setScannerConfig] = useState<{
    title: string;
    expectedType: 'ANY' | 'BATCH' | 'LOCATION' | 'PO' | 'MATERIAL';
    sampleCodes: { code: string; label: string }[];
    onScan: (code: string) => void;
  }>({
    title: 'Quét Barcode',
    expectedType: 'ANY',
    sampleCodes: [],
    onScan: () => {}
  });

  // Notification Banner
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showBanner = (type: 'success' | 'error' | 'info', message: string) => {
    setStatusBanner({ type, message });
    if (type === 'success') soundManager.playSuccessBeep();
    if (type === 'error') soundManager.playErrorBuzzer();
    setTimeout(() => {
      setStatusBanner(null);
    }, 3500);
  };

  const openScanner = (
    title: string,
    expectedType: 'ANY' | 'BATCH' | 'LOCATION' | 'PO' | 'MATERIAL',
    sampleCodes: { code: string; label: string }[],
    onScan: (code: string) => void
  ) => {
    setScannerConfig({
      title,
      expectedType,
      sampleCodes,
      onScan
    });
    setScannerOpen(true);
  };

  // --- WORKFLOW 1: PUTAWAY ---
  const [putawayStep, setPutawayStep] = useState<1 | 2>(1);
  const [selectedBatchForPutaway, setSelectedBatchForPutaway] = useState<BatchInventory | null>(null);
  const [targetLocationForPutaway, setTargetLocationForPutaway] = useState<WarehouseLocation | null>(null);

  // --- WORKFLOW 2: PICKING ---
  const [selectedIssueRequest, setSelectedIssueRequest] = useState<IssueRequest | null>(null);
  const [pickingItemIndex, setPickingItemIndex] = useState(0);
  const [pickingQty, setPickingQty] = useState(0);

  // --- WORKFLOW 3: INBOUND RECEIVING ---
  const [selectedPOOrder, setSelectedPOOrder] = useState<ReceivingOrder | null>(null);
  const [receivingItemIndex, setReceivingItemIndex] = useState(0);
  const [receivedQtyInput, setReceivedQtyInput] = useState(0);

  // --- WORKFLOW 4: BIN TRANSFER ---
  const [transferBatch, setTransferBatch] = useState<BatchInventory | null>(null);
  const [destLocation, setDestLocation] = useState<WarehouseLocation | null>(null);

  // --- WORKFLOW 5: QUICK COUNT ---
  const [countLocation, setCountLocation] = useState<WarehouseLocation | null>(null);
  const [countedItems, setCountedItems] = useState<{ [batchId: string]: number }>({});

  // --- WORKFLOW 5A: REAL MMS1 BATCH AUDIT (UC-18 / INV-06) ---
  const [batchAuditPlansPDA, setBatchAuditPlansPDA] = useState<BatchAuditPlanSummary[]>([]);
  const [selectedBatchAuditPlanPDA, setSelectedBatchAuditPlanPDA] = useState<BatchAuditPlanDetailResponse | null>(null);
  const [isLoadingBatchAuditPDA, setIsLoadingBatchAuditPDA] = useState(false);
  const [activeBatchItemPDA, setActiveBatchItemPDA] = useState<BatchAuditDetailItem | null>(null);
  const [pdaBatchAuditCountQty, setPdaBatchAuditCountQty] = useState<number>(0);
  const [pdaBatchAuditLocationText, setPdaBatchAuditLocationText] = useState<string>('');
  const [pdaBatchAuditScanText, setPdaBatchAuditScanText] = useState<string>('');
  const [pdaBatchAuditNote, setPdaBatchAuditNote] = useState<string>('');
  const [isSubmittingBatchCountPDA, setIsSubmittingBatchCountPDA] = useState(false);
  const [batchCountFeedbackMsg, setBatchCountFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const pdaBatchAuditInputRef = React.useRef<HTMLInputElement>(null);
  const pdaBatchAuditQtyRef = React.useRef<HTMLInputElement>(null);

  const loadBatchAuditPlansPDA = async () => {
    setIsLoadingBatchAuditPDA(true);
    try {
      const res = await batchAuditApi.getPlans({ statusCode: 1, pageSize: 50 });
      setBatchAuditPlansPDA(res.items || []);
    } catch (err) {
      console.error('Lỗi tải kế hoạch kiểm kê batch PDA:', err);
    } finally {
      setIsLoadingBatchAuditPDA(false);
    }
  };

  const selectBatchAuditPlanPDA = async (planId: number) => {
    setIsLoadingBatchAuditPDA(true);
    try {
      const res = await batchAuditApi.getPlanDetail(planId);
      setSelectedBatchAuditPlanPDA(res);
      setActiveBatchItemPDA(null);
      setPdaBatchAuditScanText('');
      setPdaBatchAuditCountQty(0);
      setPdaBatchAuditNote('');
      setBatchCountFeedbackMsg(null);
    } catch (err) {
      console.error('Lỗi tải chi tiết kế hoạch batch PDA:', err);
    } finally {
      setIsLoadingBatchAuditPDA(false);
    }
  };

  const handleScanBatchAuditCode = (rawText: string) => {
    if (!selectedBatchAuditPlanPDA || !rawText.trim()) return;
    const cleanId = parseInt(rawText.replace(/[^\d]/g, '').trim(), 10);
    if (!cleanId) {
      soundManager.playErrorBuzzer();
      setBatchCountFeedbackMsg({ type: 'error', text: 'Mã vạch Batch không hợp lệ.' });
      return;
    }

    const matched = selectedBatchAuditPlanPDA.batches.find(b => b.batchId === cleanId);
    if (matched) {
      soundManager.playSuccessBeep();
      setActiveBatchItemPDA(matched);
      setPdaBatchAuditCountQty(matched.actualQuantity !== null && matched.actualQuantity !== undefined ? matched.actualQuantity : 0);
      setPdaBatchAuditLocationText(matched.locationActual || matched.locationSnapshot || '');
      setBatchCountFeedbackMsg({ type: 'success', text: `Đã nhận diện Lô #${matched.batchId} - ${matched.materialId}` });
      setTimeout(() => {
        pdaBatchAuditQtyRef.current?.focus();
        pdaBatchAuditQtyRef.current?.select();
      }, 100);
    } else {
      soundManager.playErrorBuzzer();
      setBatchCountFeedbackMsg({ type: 'error', text: `Lô #${cleanId} KHÔNG thuộc kế hoạch kiểm kê này!` });
    }
  };

  const handleSubmitBatchCountPDA = async () => {
    if (!selectedBatchAuditPlanPDA || !activeBatchItemPDA) return;
    if (pdaBatchAuditCountQty < 0) {
      soundManager.playErrorBuzzer();
      setBatchCountFeedbackMsg({ type: 'error', text: 'Số lượng đếm không được là số âm.' });
      return;
    }

    setIsSubmittingBatchCountPDA(true);
    try {
      const res = await batchAuditApi.logCount(selectedBatchAuditPlanPDA.plan.planId, {
        batchId: activeBatchItemPDA.batchId,
        actualQuantity: pdaBatchAuditCountQty,
        locationCode: pdaBatchAuditLocationText || undefined,
        note: pdaBatchAuditNote || undefined
      });

      if (res.ok) {
        soundManager.playSuccessBeep();
        setBatchCountFeedbackMsg({
          type: 'success',
          text: `Đã lưu số đếm: ${pdaBatchAuditCountQty} ${activeBatchItemPDA.unit || ''} (Trạng thái: ${res.auditStatus})`
        });
        const updated = await batchAuditApi.getPlanDetail(selectedBatchAuditPlanPDA.plan.planId);
        setSelectedBatchAuditPlanPDA(updated);
        setActiveBatchItemPDA(null);
        setPdaBatchAuditScanText('');
        setPdaBatchAuditCountQty(0);
        setPdaBatchAuditNote('');
        setTimeout(() => {
          pdaBatchAuditInputRef.current?.focus();
        }, 150);
      } else {
        soundManager.playErrorBuzzer();
        setBatchCountFeedbackMsg({ type: 'error', text: res.message || 'Lỗi khi lưu kết quả đếm.' });
      }
    } catch (err: any) {
      soundManager.playErrorBuzzer();
      setBatchCountFeedbackMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Lỗi lưu kết quả đếm.' });
    } finally {
      setIsSubmittingBatchCountPDA(false);
    }
  };

  // --- WORKFLOW 5B: REAL MMS1 CYCLE COUNT (UC-27 / INV-08) ---
  const [cyclePlansPDA, setCyclePlansPDA] = useState<CycleCountPlanSummary[]>([]);
  const [selectedCyclePlanPDA, setSelectedCyclePlanPDA] = useState<CycleCountPlanDetail | null>(null);
  const [isCyclePlanLoadingPDA, setIsCyclePlanLoadingPDA] = useState(false);
  const [activeCycleBatchPDA, setActiveCycleBatchPDA] = useState<CycleCountBatchItem | null>(null);
  const [cycleCountInputPDA, setCycleCountInputPDA] = useState<number>(0);
  const [cycleCountLocationPDA, setCycleCountLocationPDA] = useState<string>('');
  const [pdaLocationScanText, setPdaLocationScanText] = useState<string>('');
  const [pdaBatchScanText, setPdaBatchScanText] = useState<string>('');
  const pdaLocationInputRef = React.useRef<HTMLInputElement>(null);
  const pdaBatchInputRef = React.useRef<HTMLInputElement>(null);
  const pdaCountInputRef = React.useRef<HTMLInputElement>(null);
  const [mmsLocationsPDA, setMmsLocationsPDA] = useState<WarehouseLocationOption[]>([]);
  const [isSubmittingCountPDA, setIsSubmittingCountPDA] = useState(false);
  const [lastCreatedChildBatchPDA, setLastCreatedChildBatchPDA] = useState<{
    newBatchId: number;
    parentBatchId: number;
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    locationCode: string;
    createdAt: string;
  } | null>(null);

  // Auto focus current step input on PDA
  useEffect(() => {
    if (activePDAMode !== 'CYCLE_COUNT' || !selectedCyclePlanPDA?.plan) return;

    const timer = setTimeout(() => {
      if (!cycleCountLocationPDA) {
        pdaLocationInputRef.current?.focus();
      } else if (!activeCycleBatchPDA) {
        pdaBatchInputRef.current?.focus();
      } else {
        pdaCountInputRef.current?.focus();
        pdaCountInputRef.current?.select();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [activePDAMode, selectedCyclePlanPDA?.plan, cycleCountLocationPDA, activeCycleBatchPDA]);

  const loadMmsLocationsPDA = async () => {
    try {
      const data = await cycleCountService.getLocations();
      setMmsLocationsPDA(data || []);
    } catch (err) {
      console.warn('PDA error loading MMS1 locations:', err);
    }
  };

  const loadCyclePlansPDA = async () => {
    setIsCyclePlanLoadingPDA(true);
    try {
      const data = await cycleCountService.getPlans();
      setCyclePlansPDA(data || []);
      loadMmsLocationsPDA();
    } catch (err) {
      console.warn('PDA error loading cycle count plans:', err);
    } finally {
      setIsCyclePlanLoadingPDA(false);
    }
  };

  const loadCyclePlanDetailPDA = async (planId: number, keepContext = false) => {
    setIsCyclePlanLoadingPDA(true);
    try {
      const data = await cycleCountService.getPlanDetail(planId);
      setSelectedCyclePlanPDA(data);
      if (!keepContext) {
        setActiveCycleBatchPDA(null);
        setCycleCountInputPDA(0);
        setCycleCountLocationPDA('');
      }
    } catch (err) {
      console.warn('PDA error loading cycle plan detail:', err);
    } finally {
      setIsCyclePlanLoadingPDA(false);
    }
  };

  const handleSubmitCountedPDA = async (planId: number) => {
    if (!window.confirm(`XÁC NHẬN BÁO ĐÃ KIỂM XONG cho Kế Hoạch #${planId}?\n\nKế hoạch sẽ chuyển sang trạng thái CHỜ TRƯỞNG PHÒNG DUYỆT.`)) return;

    setIsSubmittingCountPDA(true);
    try {
      const res = await cycleCountService.submitCounted(planId);
      soundManager.playSuccessBeep();
      showBanner('success', res.message || 'Đã gửi báo cáo kiểm xong thành công! Đang chờ Trưởng phòng duyệt.');
      setSelectedCyclePlanPDA(null);
      setCycleCountLocationPDA('');
      setActiveCycleBatchPDA(null);
      await loadCyclePlansPDA();
    } catch (err: any) {
      soundManager.playErrorBuzzer();
      showBanner('error', err.message || 'Lỗi gửi báo cáo kiểm xong.');
    } finally {
      setIsSubmittingCountPDA(false);
    }
  };

  // --- WORKFLOW 6: LOOKUP ---
  const [lookupResult, setLookupResult] = useState<{
    type: 'BATCH' | 'LOCATION' | 'MATERIAL';
    data: any;
  } | null>(null);

  // Filter queues
  const pendingPutawayBatches = batches.filter(
    b => b.locationCode === 'TEMP-INBOUND' || b.locationCode === 'QUARANTINE' || b.locationCode.startsWith('TEMP')
  );
  const approvedIssueOrders = issueRequests.filter(
    r => r.status === 'APPROVED' || r.status === 'PICKING'
  );
  const pendingReceivingOrders = receivingOrders.filter(
    r => r.status === 'WAITING_QC' || r.status === 'TEMPORARY_RECEIVED' || r.status === 'DRAFT'
  );

  const handleToggleSound = () => {
    const s = soundManager.toggleSound();
    setSoundEnabled(s);
  };

  // --- PUTAWAY HANDLERS ---
  const handlePutawayScanBatch = (scannedCode: string) => {
    const found = batches.find(
      b => b.batchNumber.toLowerCase() === scannedCode.toLowerCase() ||
           b.id.toLowerCase() === scannedCode.toLowerCase()
    );

    if (!found) {
      showBanner('error', `Không tìm thấy mã Lô: ${scannedCode}`);
      return;
    }

    setSelectedBatchForPutaway(found);
    const suggested = locations.find(l => l.status === 'EMPTY' || l.status === 'PARTIAL') || locations[0];
    setTargetLocationForPutaway(suggested);
    setPutawayStep(2);
    showBanner('success', `Đã nhận diện Lô ${found.batchNumber}. Quét mã Kệ để cất hàng.`);
  };

  const handlePutawayScanLocation = (scannedCode: string) => {
    const foundLoc = locations.find(
      l => l.code.toLowerCase() === scannedCode.toLowerCase() ||
           l.id.toLowerCase() === scannedCode.toLowerCase()
    );

    if (!foundLoc) {
      showBanner('error', `Không tìm thấy Vị trí Kệ: ${scannedCode}`);
      return;
    }

    setTargetLocationForPutaway(foundLoc);
    showBanner('success', `Kệ hợp lệ: ${foundLoc.code} (${foundLoc.warehouse})`);
  };

  const handleConfirmPutaway = () => {
    if (!selectedBatchForPutaway || !targetLocationForPutaway) return;

    transferLocation(
      selectedBatchForPutaway.id,
      targetLocationForPutaway.id,
      `Cất kệ PDA bởi ${currentUser.fullName}`
    );

    soundManager.playCompleteChime();
    showBanner('success', `Đã cất thành công Lô ${selectedBatchForPutaway.batchNumber} vào Kệ ${targetLocationForPutaway.code}!`);
    
    setSelectedBatchForPutaway(null);
    setTargetLocationForPutaway(null);
    setPutawayStep(1);
  };

  // --- PICKING HANDLERS ---
  const [previewPickingOrder, setPreviewPickingOrder] = useState<IssueRequest | null>(null);
  const [previewLines, setPreviewLines] = useState<any[]>([]);
  const [isLoadingPreviewLines, setIsLoadingPreviewLines] = useState(false);
  const [isStartingPicking, setIsStartingPicking] = useState(false);
  const [pickingFilterTab, setPickingFilterTab] = useState<'ALL' | 'APPROVED' | 'PICKING'>('ALL');

  const handleOpenPreviewPickingOrder = async (order: IssueRequest) => {
    setPreviewPickingOrder(order);
    setIsLoadingPreviewLines(true);
    try {
      const detail = await outboundService.getPickingRequest(Number(order.id));
      if (detail && detail.lines && detail.lines.length > 0) {
        setPreviewLines(detail.lines);
      } else {
        setPreviewLines([]);
      }
    } catch (err) {
      console.error('Error loading lines for preview:', err);
      try {
        const fallback = await outboundService.getRequestDetail(Number(order.id));
        setPreviewLines(fallback?.lines || []);
      } catch {
        setPreviewLines([]);
      }
    } finally {
      setIsLoadingPreviewLines(false);
    }
  };

  // --- REALTIME OUTBOUND PICKING STATE & HANDLERS (OUT-06 / OUT-07 / OUT-08) ---
  const [realtimePickingLines, setRealtimePickingLines] = useState<any[]>([]);
  const [activePickingLineIndex, setActivePickingLineIndex] = useState<number>(0);
  const [pickableBatches, setPickableBatches] = useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);
  const [selectedPickBatch, setSelectedPickBatch] = useState<any | null>(null);
  const [scannedBatchBarcode, setScannedBatchBarcode] = useState<string>('');
  const [pickBatchQty, setPickBatchQty] = useState<number>(0);
  const [isSubmittingPickBatch, setIsSubmittingPickBatch] = useState<boolean>(false);
  const [isCompletingOrder, setIsCompletingOrder] = useState<boolean>(false);

  const loadBatchesForLine = async (requestId: number, lineId: number, remQty: number) => {
    setIsLoadingBatches(true);
    setSelectedPickBatch(null);
    setScannedBatchBarcode('');
    setPickBatchQty(0);
    try {
      const data = await outboundService.getPickableBatches(requestId, lineId);
      const batchList = Array.isArray(data) ? data : (data?.items || []);
      setPickableBatches(batchList);
    } catch (err) {
      console.error('Error loading pickable batches:', err);
      setPickableBatches([]);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handleVerifyScannedBatch = (barcodeRaw: string) => {
    const clean = barcodeRaw.trim();
    if (!clean) return;

    if (!selectedIssueRequest || !realtimePickingLines[activePickingLineIndex]) {
      showBanner('error', 'Chưa chọn phiếu hoặc dòng vật tư.');
      return;
    }

    const currentLine = realtimePickingLines[activePickingLineIndex];
    const remQty = currentLine.remainingQuantity ?? Math.max(0, (currentLine.requestedQuantity || currentLine.quantity || 0) - (currentLine.issuedQuantity || 0));

    // Tìm kiếm trong danh sách Lô của dòng hiện tại
    const normalized = clean.toUpperCase().replace(/^BAT-/, '').replace(/^LÔ-/, '').replace(/^LO-/, '').trim();
    const matched = pickableBatches.find(b => {
      const bId = b.batchId.toString();
      const bNum = (b.batchNumber || '').toUpperCase();
      const bLoc = (b.locationCode || '').toUpperCase();
      return bId === normalized || bId === clean || bNum === clean.toUpperCase() || bLoc === clean.toUpperCase();
    });

    if (matched) {
      soundManager.playSuccessBeep();
      setSelectedPickBatch(matched);
      const defaultQty = Math.min(remQty, matched.availableQuantity || 0);
      setPickBatchQty(defaultQty);
      setScannedBatchBarcode('');
      showBanner('success', `✓ Đã quét khớp Lô #${matched.batchId} tại vị trí Kệ ${matched.locationCode || 'N/A'} (Tồn: ${matched.availableQuantity?.toLocaleString('vi-VN')} ${currentLine.unit})`);
    } else {
      soundManager.playErrorBuzzer();
      showBanner('error', `❌ Mã quét "${clean}" KHÔNG KHỚP với bất kỳ Lô hàng hợp lệ nào của vật tư ${currentLine.materialName} (${currentLine.materialId})!`);
      setScannedBatchBarcode('');
    }
  };

  const handleSelectPickingLine = (index: number) => {
    setActivePickingLineIndex(index);
    if (selectedIssueRequest && realtimePickingLines[index]) {
      const line = realtimePickingLines[index];
      const rem = Math.max(0, (line.requestedQuantity || line.quantity || 0) - (line.issuedQuantity || 0));
      loadBatchesForLine(Number(selectedIssueRequest.id), line.lineId, rem);
    }
  };

  const handleConfirmStartPicking = async () => {
    if (!previewPickingOrder) return;
    setIsStartingPicking(true);
    try {
      // Nếu là phiếu chờ soạn (APPROVED), gọi API ghi nhận bắt đầu soạn hàng trên hệ thống
      if (previewPickingOrder.status === 'APPROVED') {
        await outboundService.startPicking(Number(previewPickingOrder.id));
        showBanner('success', `Đã ghi nhận bắt đầu soạn hàng cho phiếu ${previewPickingOrder.code}!`);
        soundManager.playSuccessBeep();
        if (refreshIssueRequests) {
          refreshIssueRequests();
        }
      }

      // Lấy chi tiết đơn hàng đầy đủ từ CSDL
      let detailedLines = previewLines;
      if (!detailedLines || detailedLines.length === 0) {
        try {
          const detail = await outboundService.getPickingRequest(Number(previewPickingOrder.id));
          detailedLines = detail.lines || [];
        } catch {
          detailedLines = [];
        }
      }

      const lines = detailedLines.map((ln, idx) => ({
        lineId: ln.lineId || idx + 1,
        materialId: ln.materialId || '',
        materialCode: ln.materialId || '',
        materialName: ln.materialName || ln.materialId || 'Vật tư',
        unit: ln.unit || 'Cái',
        requestedQuantity: ln.requestedQuantity ?? ln.quantity ?? 0,
        issuedQuantity: ln.issuedQuantity ?? 0,
        remainingQuantity: Math.max(0, (ln.requestedQuantity ?? ln.quantity ?? 0) - (ln.issuedQuantity ?? 0)),
        availableQuantity: ln.availableQuantity ?? 0,
        destinationBravoCode: ln.destinationBravoCode,
        note: ln.note
      }));

      setRealtimePickingLines(lines);
      const activeOrder: IssueRequest = {
        ...previewPickingOrder,
        status: 'PICKING',
        items: lines.map(ln => ({
          id: ln.lineId.toString(),
          materialId: ln.materialId,
          materialCode: ln.materialId,
          materialName: ln.materialName,
          unit: ln.unit,
          requestedQuantity: ln.requestedQuantity,
          approvedQuantity: ln.requestedQuantity,
          issuedQuantity: ln.issuedQuantity
        }))
      };

      setSelectedIssueRequest(activeOrder);
      setPreviewPickingOrder(null);

      // Tự động tìm dòng đầu tiên chưa soạn đủ để tải Lô
      const firstIncompleteIdx = lines.findIndex(ln => ln.remainingQuantity > 0);
      const startIdx = firstIncompleteIdx !== -1 ? firstIncompleteIdx : 0;
      setActivePickingLineIndex(startIdx);
      if (lines[startIdx]) {
        loadBatchesForLine(Number(previewPickingOrder.id), lines[startIdx].lineId, lines[startIdx].remainingQuantity);
      }
    } catch (err: any) {
      console.error('Error starting pick:', err);
      showBanner('error', err.message || 'Lỗi khi bắt đầu soạn hàng');
      soundManager.playErrorBuzzer();
    } finally {
      setIsStartingPicking(false);
    }
  };

  const handleConfirmPickBatch = async () => {
    if (!selectedIssueRequest || !realtimePickingLines[activePickingLineIndex] || !selectedPickBatch) {
      showBanner('error', 'Vui lòng chọn Lô hàng để lấy.');
      return;
    }
    const currentLine = realtimePickingLines[activePickingLineIndex];
    if (pickBatchQty <= 0) {
      showBanner('error', 'Số lượng lấy phải lớn hơn 0.');
      return;
    }
    if (pickBatchQty > (selectedPickBatch.availableQuantity || selectedPickBatch.quantity || 0)) {
      showBanner('error', `Số lượng lấy (${pickBatchQty}) vượt quá tồn khả dụng của Lô (${selectedPickBatch.availableQuantity || selectedPickBatch.quantity}).`);
      return;
    }

    setIsSubmittingPickBatch(true);
    try {
      await outboundService.pickBatch(Number(selectedIssueRequest.id), currentLine.lineId, {
        batchId: selectedPickBatch.batchId || selectedPickBatch.id,
        quantity: pickBatchQty,
        expectedBatchQuantity: selectedPickBatch.availableQuantity || selectedPickBatch.quantity,
        expectedLocationCode: selectedPickBatch.locationCode
      });

      soundManager.playSuccessBeep();
      showBanner('success', `Đã nhặt ${pickBatchQty.toLocaleString('vi-VN')} ${currentLine.unit || 'Cái'} từ Lô #${selectedPickBatch.batchId || selectedPickBatch.id} (Kệ ${selectedPickBatch.locationCode || 'N/A'})!`);

      // Cập nhật state realtime của dòng
      const updatedLines = [...realtimePickingLines];
      const updatedIssued = (currentLine.issuedQuantity || 0) + pickBatchQty;
      const updatedRemaining = Math.max(0, (currentLine.requestedQuantity || currentLine.quantity || 0) - updatedIssued);
      updatedLines[activePickingLineIndex] = {
        ...currentLine,
        issuedQuantity: updatedIssued,
        remainingQuantity: updatedRemaining
      };
      setRealtimePickingLines(updatedLines);

      // Cập nhật lại danh sách Lô
      if (updatedRemaining > 0) {
        loadBatchesForLine(Number(selectedIssueRequest.id), currentLine.lineId, updatedRemaining);
      } else {
        // Tự động chuyển sang dòng tiếp theo chưa nhặt đủ
        const nextIncompleteIndex = updatedLines.findIndex(ln => Math.max(0, (ln.requestedQuantity || ln.quantity || 0) - (ln.issuedQuantity || 0)) > 0);
        if (nextIncompleteIndex !== -1) {
          setActivePickingLineIndex(nextIncompleteIndex);
          const nextLine = updatedLines[nextIncompleteIndex];
          const nextRem = Math.max(0, (nextLine.requestedQuantity || nextLine.quantity || 0) - (nextLine.issuedQuantity || 0));
          loadBatchesForLine(Number(selectedIssueRequest.id), nextLine.lineId, nextRem);
        } else {
          setPickableBatches([]);
          setSelectedPickBatch(null);
          setPickBatchQty(0);
        }
      }
    } catch (err: any) {
      console.error('Error picking batch:', err);
      soundManager.playErrorBuzzer();
      showBanner('error', err.message || 'Lỗi khi ghi nhận nhặt Lô hàng.');
    } finally {
      setIsSubmittingPickBatch(false);
    }
  };

  const handleCompleteEntireOrder = async () => {
    if (!selectedIssueRequest) return;
    setIsCompletingOrder(true);
    try {
      await outboundService.completeGoodsIssue(Number(selectedIssueRequest.id));
      soundManager.playCompleteChime();
      showBanner('success', `🎉 Hoàn tất soạn toàn bộ đơn xuất ${selectedIssueRequest.code}! Đã chốt Sổ Cái thành công.`);
      setSelectedIssueRequest(null);
      setRealtimePickingLines([]);
      setPickableBatches([]);
      if (refreshIssueRequests) refreshIssueRequests();
    } catch (err: any) {
      console.error('Error completing goods issue:', err);
      soundManager.playErrorBuzzer();
      showBanner('error', err.message || 'Lỗi khi chốt xuất kho.');
    } finally {
      setIsCompletingOrder(false);
    }
  };

  // --- LOOKUP HANDLERS ---
  const handleLookupScan = (scannedCode: string) => {
    const clean = scannedCode.trim();
    
    const foundBatch = batches.find(b => b.batchNumber.toLowerCase() === clean.toLowerCase() || b.id.toLowerCase() === clean.toLowerCase());
    if (foundBatch) {
      setLookupResult({ type: 'BATCH', data: foundBatch });
      showBanner('success', `Tìm thấy Lô hàng: ${foundBatch.batchNumber}`);
      return;
    }

    const foundLoc = locations.find(l => l.code.toLowerCase() === clean.toLowerCase() || l.id.toLowerCase() === clean.toLowerCase());
    if (foundLoc) {
      const batchesInLoc = batches.filter(b => b.locationId === foundLoc.id || b.locationCode === foundLoc.code);
      setLookupResult({ type: 'LOCATION', data: { location: foundLoc, batches: batchesInLoc } });
      showBanner('success', `Tìm thấy Vị trí Kệ: ${foundLoc.code}`);
      return;
    }

    const foundMat = materials.find(m => m.code.toLowerCase() === clean.toLowerCase() || m.id.toLowerCase() === clean.toLowerCase());
    if (foundMat) {
      const batchesOfMat = batches.filter(b => b.materialId === foundMat.id);
      setLookupResult({ type: 'MATERIAL', data: { material: foundMat, batches: batchesOfMat } });
      showBanner('success', `Tìm thấy Vật tư SKU: ${foundMat.code}`);
      return;
    }

    showBanner('error', `Không tìm thấy dữ liệu cho mã: ${clean}`);
  };

  const getBatchSampleCodes = () => batches.slice(0, 5).map(b => ({
    code: b.batchNumber,
    label: `${b.materialName} (${b.quantity} ${b.unit})`
  }));

  const getLocationSampleCodes = () => {
    if (mmsLocationsPDA.length > 0) {
      return mmsLocationsPDA.slice(0, 15).map(l => ({
        code: l.locationCode,
        label: `${l.locationCode} - ${l.description || 'Ô kệ'} (Khu ${l.areaCode || 'Kho'})`
      }));
    }
    return locations.slice(0, 8).map(l => ({
      code: l.code,
      label: `${l.code} (${l.warehouse})`
    }));
  };

  const getPOSampleCodes = () => receivingOrders.slice(0, 4).map(r => ({
    code: r.code,
    label: `${r.supplier} (${r.items.length} món)`
  }));

  return (
    <div className={`min-h-[85vh] rounded-2xl overflow-hidden flex flex-col font-sans transition-colors duration-200 ${
      isDarkMode 
        ? 'pda-dark-mode bg-black text-zinc-100 shadow-2xl border border-zinc-800' 
        : 'bg-slate-100 text-slate-900 shadow-sm border border-slate-200'
    }`}>
      
      {/* 📱 TOP HANDHELD DEVICE STATUS BAR (KỀM NGHĨA INDUSTRIAL PDA) */}
      <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b transition-colors ${
        isDarkMode 
          ? 'bg-zinc-950 border-zinc-800 text-zinc-300' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold font-mono bg-[#007D3C] text-white shadow-xs">
            <Smartphone className="w-3.5 h-3.5" />
            <span>KỀM NGHĨA PDA</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="font-bold text-slate-900">{currentUser.fullName}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] border border-slate-200 font-bold">
              {currentUser.id} • {currentUser.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Online / Offline Status */}
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-emerald-50 text-[#007D3C] border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#007D3C] animate-pulse"></span>
              <Wifi className="w-3 h-3 text-[#007D3C]" />
              <span>ONLINE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
              <WifiOff className="w-3 h-3 text-amber-600" />
              <span>OFFLINE (Đệm: {offlineQueueCount})</span>
            </div>
          )}

          {/* LAN Printer 10.17.16.102:8080 Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono text-[11px] bg-amber-50 border border-amber-200 text-[#F7941D] font-bold" title="Máy in tem nhãn HTTP LAN: 10.17.16.102:8080">
            <Printer className="w-3 h-3 text-[#F7941D]" />
            <span>10.17.16.102:8080</span>
          </div>

          {/* Battery */}
          <div className="hidden md:flex items-center gap-1 text-slate-600 font-mono text-[11px] px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <BatteryCharging className="w-3.5 h-3.5 text-[#007D3C]" />
            <span>98%</span>
          </div>

          {/* OLED Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-700 text-amber-300 hover:bg-zinc-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={isDarkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Nền Đen OLED'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-[#007D3C]'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Âm thanh máy quét: BẬT' : 'Âm thanh: TẮT'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {onExitToDesktop && (
            <button
              onClick={onExitToDesktop}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs border border-slate-200 cursor-pointer transition-colors"
            >
              Về Desktop
            </button>
          )}
        </div>
      </div>

      {/* 🔔 LIVE NOTIFICATION BANNER */}
      {statusBanner && (
        <div className={`px-4 py-2.5 text-xs font-extrabold flex items-center justify-between border-b ${
          statusBanner.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
          statusBanner.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
          'bg-slate-50 text-slate-800 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#007D3C] shrink-0" /> :
             statusBanner.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" /> :
             <Info className="w-4 h-4 text-[#F7941D] shrink-0" />}
            <span>{statusBanner.message}</span>
          </div>
          <button onClick={() => setStatusBanner(null)} className="cursor-pointer p-1 text-slate-500 hover:text-slate-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 📦 BODY AREA */}
      <div className="flex-1 p-3 sm:p-5 overflow-y-auto max-w-4xl mx-auto w-full">

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 0: MAIN PDA HOME MENU
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'MENU' && (
          <div className="space-y-4">
            {/* Quick Laser Trigger Banner */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
              isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-2 font-mono">
                  <span>TRẠM QUÉT CẦM TAY KỀM NGHĨA (LASER 2D BARCODE)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thao tác quét mã trực tiếp trên giá kệ & sàn kho. Phím bấm lớn tối ưu công thái học (Ergonomics).
                </p>
              </div>

              <button
                onClick={() => openScanner(
                  'Tra Cứu Nhanh Mọi Mã Vạch',
                  'ANY',
                  [...getBatchSampleCodes(), ...getLocationSampleCodes()],
                  handleLookupScan
                )}
                className="px-5 py-3 bg-[#007D3C] hover:bg-[#009647] active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs border border-emerald-600/40"
              >
                <Barcode className="w-4 h-4" />
                <span>QUÉT NHANH MÃ VẠCH (F2)</span>
              </button>
            </div>

            {/* 6 Touch Tiles Grid for PDA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* 1. Cất kệ (Putaway) */}
              <button
                onClick={() => {
                  setActivePDAMode('PUTAWAY');
                  setPutawayStep(1);
                  setSelectedBatchForPutaway(null);
                }}
                className="p-4 rounded-xl bg-white hover:bg-slate-100/80 active:scale-98 border border-slate-200 hover:border-slate-400 text-left transition-all group flex items-start gap-3.5 shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      1. Cất Hàng Vào Kệ (Putaway)
                    </span>
                    {pendingPutawayBatches.length > 0 && (
                      <span className="bg-slate-100 text-slate-800 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-200">
                        {pendingPutawayBatches.length} Lô
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Quét Lô đã QC Pass → Quét mã Kệ lưu trữ (LOC-02).
                  </p>
                </div>
              </button>

              {/* 2. Soạn hàng xuất (Picking) */}
              <button
                onClick={() => {
                  setActivePDAMode('PICKING');
                  setSelectedIssueRequest(null);
                }}
                className="p-4 rounded-xl bg-white hover:bg-slate-100/80 active:scale-98 border border-slate-200 hover:border-slate-400 text-left transition-all group flex items-start gap-3.5 shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      2. Soạn Hàng Xuất (Picking)
                    </span>
                    {approvedIssueOrders.length > 0 && (
                      <span className="bg-slate-100 text-slate-800 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-200">
                        {approvedIssueOrders.length} Đơn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Chỉ đường theo kệ, lấy hàng FIFO/FEFO theo lệnh xuất (OUT-07).
                  </p>
                </div>
              </button>

              {/* 3. Nhận hàng & PO (Inbound) */}
              <button
                onClick={() => {
                  setActivePDAMode('RECEIVING');
                  setSelectedPOOrder(null);
                }}
                className="p-4 rounded-xl bg-white hover:bg-slate-100/80 active:scale-98 border border-slate-200 hover:border-slate-400 text-left transition-all group flex items-start gap-3.5 shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      3. Nhận Hàng Cửa Nhập
                    </span>
                    {pendingReceivingOrders.length > 0 && (
                      <span className="bg-slate-100 text-slate-800 font-mono font-bold text-xs px-2 py-0.5 rounded border border-slate-200">
                        {pendingReceivingOrders.length} Phiếu
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Quét PO, kiểm đếm số lượng & in tem tiếp nhận (INB-01).
                  </p>
                </div>
              </button>

              {/* 4. Đổi vị trí kệ (Transfer) */}
              <button
                onClick={() => {
                  setActivePDAMode('TRANSFER');
                  setTransferBatch(null);
                  setDestLocation(null);
                }}
                className="p-4 rounded-xl bg-white hover:bg-slate-100/80 active:scale-98 border border-slate-200 hover:border-slate-400 text-left transition-all group flex items-start gap-3.5 shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-900">
                    4. Chuyển Kệ (Bin Transfer)
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Quét kệ cũ → Quét lô → Quét kệ mới để di dời (LOC-03).
                  </p>
                </div>
              </button>

              {/* 5. Kiểm kê nhanh (Cycle Count) */}
              <button
                onClick={() => {
                  setActivePDAMode('COUNT');
                  setCountLocation(null);
                  setCountedItems({});
                }}
                className="p-4 rounded-xl bg-white hover:bg-slate-100/80 active:scale-98 border border-slate-200 hover:border-slate-400 text-left transition-all group flex items-start gap-3.5 shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-900">
                    5. Kiểm Kê Giá Kệ
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Quét mã ô kệ → Kiểm đếm đối chiếu tồn thực tế (INV-07).
                  </p>
                </div>
              </button>

              {/* 5A. Kiểm kê Theo Batch (UC-18 / INV-06) */}
              <button
                onClick={() => {
                  setActivePDAMode('BATCH_AUDIT');
                  setSelectedBatchAuditPlanPDA(null);
                  setActiveBatchItemPDA(null);
                  loadBatchAuditPlansPDA();
                }}
                className="p-4 rounded-xl bg-purple-50/80 hover:bg-purple-100/90 active:scale-98 border border-purple-300 hover:border-purple-500 text-left transition-all group flex items-start gap-3.5 shadow-2xs cursor-pointer ring-1 ring-purple-500/20"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Barcode className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-purple-900">
                      5A. Quét Kiểm Kê Lô (Batch)
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-purple-600 text-white px-1.5 py-0.2 rounded">
                      UC-18
                    </span>
                  </div>
                  <p className="text-xs text-purple-700/80 mt-1">
                    Quét mã Barcode Lô → Kiểm đếm mù thực tế hiện trường theo kế hoạch.
                  </p>
                </div>
              </button>

              {/* 5B. Kiểm kê Cycle Count Theo Vật Tư (UC-27 / INV-08) */}
              <button
                onClick={() => {
                  setActivePDAMode('CYCLE_COUNT');
                  setSelectedCyclePlanPDA(null);
                  setActiveCycleBatchPDA(null);
                  loadCyclePlansPDA();
                }}
                className="p-4 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 active:scale-98 border border-blue-300 hover:border-blue-500 text-left transition-all group flex items-start gap-3.5 shadow-2xs cursor-pointer ring-1 ring-blue-500/20"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-blue-900">
                      5B. Kiểm Kê Cycle Count
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-blue-600 text-white px-1.5 py-0.2 rounded">
                      UC-27
                    </span>
                  </div>
                  <p className="text-xs text-blue-700/80 mt-1">
                    Chọn kế hoạch vật tư → Quét kệ & nhập số lượng thực tế đếm (B2).
                  </p>
                </div>
              </button>

              {/* 6. Tra cứu nhanh (Lookup) */}
              <button
                onClick={() => {
                  setActivePDAMode('LOOKUP');
                  setLookupResult(null);
                }}
                className="p-4 rounded-xl bg-white hover:bg-slate-100/80 active:scale-98 border border-slate-200 hover:border-slate-400 text-left transition-all group flex items-start gap-3.5 shadow-2xs cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200">
                  <Search className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-slate-900">
                    6. Tra Cứu Barcode
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Xem tồn, hạn dùng, vị trí hiện tại của mọi SKU & Lô (INV-01).
                  </p>
                </div>
              </button>

            </div>

            {/* Quick Tips */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Sẵn sàng kết nối súng quét Laser vật lý hoặc Camera Barcode trên thiết bị cầm tay.</span>
              </div>
              <button
                onClick={() => soundManager.playSuccessBeep()}
                className="text-slate-700 hover:underline font-mono text-[11px] cursor-pointer"
              >
                Test Loa Beep
              </button>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 1: PDA PUTAWAY (CẤT HÀNG VÀO KỆ)
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'PUTAWAY' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                onClick={() => setActivePDAMode('MENU')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Về Menu PDA
              </button>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">CẤT HÀNG LÊN KỆ (PUTAWAY)</h3>
                <p className="text-[11px] text-slate-500 font-mono">Bước {putawayStep}/2</p>
              </div>
            </div>

            {/* Step 1: Scan Batch */}
            {putawayStep === 1 && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-700 mx-auto flex items-center justify-center border border-slate-200">
                    <Barcode className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">BƯỚC 1: QUÉT MÃ LÔ / TEM KIỆN HÀNG</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Dùng súng Laser quét tem nhãn trên kiện hàng hoặc bấm nút quét bên dưới.
                  </p>

                  <button
                    onClick={() => openScanner(
                      'Quét Mã Lô Cần Cất Kệ',
                      'BATCH',
                      getBatchSampleCodes(),
                      handlePutawayScanBatch
                    )}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>MỞ MÁY QUÉT / CHỌN MÃ LÔ</span>
                  </button>
                </div>

                {/* Queue of pending batches */}
                <div>
                  <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Danh sách Lô chờ xếp kệ ({pendingPutawayBatches.length}):
                  </h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {pendingPutawayBatches.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handlePutawayScanBatch(b.batchNumber)}
                        className="p-3 bg-white hover:bg-slate-100/70 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-sm text-slate-900">
                            {b.batchNumber}
                          </div>
                          <div className="text-xs text-slate-700 font-semibold">{b.materialName}</div>
                          <div className="text-[11px] text-slate-500">
                            Vị trí tạm: <span className="text-slate-800 font-mono font-semibold">{b.locationCode}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-slate-900">
                            {b.quantity} {b.unit}
                          </span>
                          <div className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1">
                            Bấm chọn
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Scan Location */}
            {putawayStep === 2 && selectedBatchForPutaway && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Lô đã chọn:</span>
                    <span className="font-mono font-bold text-sm text-slate-900">{selectedBatchForPutaway.batchNumber}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">{selectedBatchForPutaway.materialName}</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Số lượng:</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedBatchForPutaway.quantity} {selectedBatchForPutaway.unit}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg">
                      <span className="text-slate-500 block text-[10px]">Hạn dùng:</span>
                      <span className="font-mono text-slate-800 font-semibold">{selectedBatchForPutaway.expiryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 mx-auto flex items-center justify-center border border-slate-200">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900">BƯỚC 2: QUÉT MÃ VỊ TRÍ KỆ</h4>

                  {targetLocationForPutaway && (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl inline-block">
                      <span className="text-xs text-slate-500 block">Vị trí Kệ đề xuất:</span>
                      <span className="font-mono text-xl font-extrabold text-slate-900 tracking-wider">
                        {targetLocationForPutaway.code}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        ({targetLocationForPutaway.warehouse} - Còn trống {targetLocationForPutaway.capacity - targetLocationForPutaway.occupied} ô)
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={() => openScanner(
                        'Quét Mã Vạch Kệ Để Lưu Kho',
                        'LOCATION',
                        getLocationSampleCodes(),
                        handlePutawayScanLocation
                      )}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                    >
                      <Barcode className="w-4 h-4" />
                      <span>QUÉT MÃ KỆ THỰC TẾ</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setPutawayStep(1)}
                    className="flex-1 py-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleConfirmPutaway}
                    className="flex-2 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>XÁC NHẬN CẤT VÀO KỆ</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 2: PDA PICKING ASSISTANT
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'PICKING' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                onClick={() => {
                  if (selectedIssueRequest) setSelectedIssueRequest(null);
                  else setActivePDAMode('MENU');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> {selectedIssueRequest ? 'Đổi đơn khác' : 'Về Menu PDA'}
              </button>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">SOẠN HÀNG XUẤT (PICKING)</h3>
                <p className="text-[11px] text-slate-500 font-mono">FIFO / FEFO Route</p>
              </div>
            </div>

            {!selectedIssueRequest && (
              <div className="space-y-3">
                {/* Status Filter Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 dark:bg-zinc-800 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPickingFilterTab('ALL')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      pickingFilterTab === 'ALL'
                        ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                    }`}
                  >
                    Tất Cả ({approvedIssueOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickingFilterTab('APPROVED')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      pickingFilterTab === 'APPROVED'
                        ? 'bg-white dark:bg-zinc-700 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                    }`}
                  >
                    Chờ Soạn ({approvedIssueOrders.filter(o => o.status === 'APPROVED').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickingFilterTab('PICKING')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                      pickingFilterTab === 'PICKING'
                        ? 'bg-white dark:bg-zinc-700 text-amber-700 dark:text-amber-400 shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                    }`}
                  >
                    Đang Soạn ({approvedIssueOrders.filter(o => o.status === 'PICKING').length})
                  </button>
                </div>

                <div className="space-y-2">
                  {approvedIssueOrders
                    .filter(order => {
                      if (pickingFilterTab === 'APPROVED') return order.status === 'APPROVED';
                      if (pickingFilterTab === 'PICKING') return order.status === 'PICKING';
                      return true;
                    })
                    .map(order => (
                      <div
                        key={order.id}
                        onClick={() => handleOpenPreviewPickingOrder(order)}
                        className={`p-4 rounded-xl cursor-pointer transition-all space-y-2 shadow-2xs border ${
                          order.status === 'PICKING'
                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 hover:bg-amber-50'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900 dark:text-zinc-100">
                              {order.code}
                            </span>
                            {order.status === 'PICKING' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 animate-pulse">
                                ⚡ ĐANG SOẠN
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                                ⏳ CHỜ SOẠN
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 font-mono">
                            {order.type === 'PLANNING' ? 'Định Mức' : 'Vượt/Ngoài'}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-800 dark:text-zinc-200 text-xs sm:text-sm line-clamp-1">
                          {order.purpose}
                        </h4>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                          <span className="truncate max-w-[200px]">Xưởng: <strong className="text-slate-700 dark:text-zinc-200">{order.department}</strong></span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                            {order.status === 'PICKING' ? 'Tiếp tục soạn →' : 'Xem chi tiết & Soạn →'}
                          </span>
                        </div>
                      </div>
                    ))}

                  {approvedIssueOrders.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Hiện không có đơn xuất kho nào ở trạng thái Chờ soạn hàng hoặc Đang soạn hàng.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════
                MODAL XEM CHI TIẾT & BẤM BẮT ĐẦU SOẠN HÀNG
            ═════════════════════════════════════════════════════════════ */}
            {previewPickingOrder && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full p-5 border border-slate-200 dark:border-zinc-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 dark:text-zinc-100 text-base">
                          {previewPickingOrder.code}
                        </h3>
                        {previewPickingOrder.status === 'PICKING' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            ⚡ ĐANG SOẠN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ⏳ CHỜ SOẠN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {previewPickingOrder.createdAt}
                      </p>
                    </div>
                    <button
                      onClick={() => setPreviewPickingOrder(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Thông tin phiếu */}
                  <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs space-y-1.5">
                    <div>- Phân xưởng: <strong className="text-slate-900 dark:text-zinc-100">{previewPickingOrder.department}</strong></div>
                    <div>- Người lập: <strong className="text-slate-900 dark:text-zinc-100">{previewPickingOrder.requester}</strong></div>
                    <div>- Thời gian cần: <span className="font-mono text-slate-700 dark:text-zinc-300">{previewPickingOrder.requiredDate}</span></div>
                    <div>- Mục đích: <span className="text-slate-700 dark:text-zinc-300">{previewPickingOrder.purpose}</span></div>
                  </div>

                  {/* Danh sách vật tư */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Vật Tư Cần Lấy ({previewLines.length} loại):</span>
                      {isLoadingPreviewLines && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
                    </div>

                    {isLoadingPreviewLines ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mb-1.5" />
                        Đang tải danh sách vật tư từ CSDL...
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                        {previewLines.map((ln, idx) => (
                          <div key={ln.lineId || idx} className="p-2.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-zinc-100">{ln.materialName || ln.materialId}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Mã: {ln.materialId} {ln.bravoId ? `• Bravo: ${ln.bravoId}` : ''}
                              </div>
                            </div>
                            <div className="text-right font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                              {ln.quantity?.toLocaleString('vi-VN')} {ln.unit || 'ĐVT'}
                            </div>
                          </div>
                        ))}
                        {previewLines.length === 0 && (
                          <div className="p-4 text-center text-xs text-slate-400">
                            Chưa có danh mục vật tư chi tiết.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nút hành động */}
                  <div className="pt-2 space-y-2">
                    {previewPickingOrder.status === 'APPROVED' ? (
                      <button
                        type="button"
                        disabled={isStartingPicking}
                        onClick={handleConfirmStartPicking}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider transition-all border border-emerald-400/30 ring-2 ring-emerald-500/20"
                      >
                        {isStartingPicking ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                            <span>ĐANG GHI NHẬN HỆ THỐNG...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpFromLine className="w-4 h-4 text-emerald-200 animate-pulse" />
                            <span>BẮT ĐẦU SOẠN HÀNG (GHI NHẬN HỆ THỐNG)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isStartingPicking}
                        onClick={handleConfirmStartPicking}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider transition-all border border-amber-400/30 ring-2 ring-amber-500/20"
                      >
                        <ArrowRight className="w-4 h-4 text-amber-200 animate-pulse" />
                        <span>TIẾP TỤC SOẠN HÀNG</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPreviewPickingOrder(null)}
                      className="w-full py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors text-center"
                    >
                      Đóng / Quay Lại Danh Sách
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedIssueRequest && (
              <div className="space-y-4">
                {/* Header thông tin đơn */}
                <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Đang soạn đơn:</span>
                      <strong className="font-mono text-slate-900 dark:text-zinc-100 font-extrabold text-sm">{selectedIssueRequest.code}</strong>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        ⚡ ĐANG SOẠN
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Phân xưởng: {selectedIssueRequest.department || 'Xưởng sản xuất'}
                    </div>
                  </div>

                  {/* Tiến độ tổng quát */}
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-mono">
                      {realtimePickingLines.filter(l => l.remainingQuantity === 0).length}/{realtimePickingLines.length} MÓN ĐÃ XONG
                    </div>
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Tổng đã soạn: {realtimePickingLines.reduce((sum, l) => sum + (l.issuedQuantity || 0), 0).toLocaleString('vi-VN')} / {realtimePickingLines.reduce((sum, l) => sum + (l.requestedQuantity || l.quantity || 0), 0).toLocaleString('vi-VN')} Cái
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH CÁC MÃ VẬT TƯ TRONG PHIẾU (NHÂN VIÊN TỰ CHỌN MÃ SOẠN) */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span>1. Danh mục vật tư cần lấy ({realtimePickingLines.length} loại) - Chạm để chọn:</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {realtimePickingLines.map((ln, idx) => {
                      const isSelected = idx === activePickingLineIndex;
                      const isCompleted = (ln.remainingQuantity ?? Math.max(0, (ln.requestedQuantity || ln.quantity || 0) - (ln.issuedQuantity || 0))) === 0;

                      return (
                        <div
                          key={ln.lineId || idx}
                          onClick={() => handleSelectPickingLine(idx)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                            isSelected
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                              : isCompleted
                              ? 'bg-slate-50 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 opacity-75'
                              : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                                isCompleted ? 'bg-emerald-600 text-white' : isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200'
                              }`}>
                                {isCompleted ? '✓' : idx + 1}
                              </span>
                              <strong className="text-slate-900 dark:text-zinc-100 truncate block font-bold">
                                {ln.materialName || ln.materialId}
                              </strong>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono pl-6.5">
                              Mã: {ln.materialId} {ln.bravoId ? `• Bravo: ${ln.bravoId}` : ''}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono text-xs">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ln.issuedQuantity || 0}</span>
                              <span className="text-slate-400"> / </span>
                              <strong className="text-slate-800 dark:text-zinc-200">{ln.requestedQuantity ?? ln.quantity}</strong> {ln.unit || 'Cái'}
                            </div>
                            <div>
                              {isCompleted ? (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                                  ✓ ĐÃ ĐỦ
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 rounded">
                                  Còn thiếu: {(ln.remainingQuantity ?? ((ln.requestedQuantity || ln.quantity) - (ln.issuedQuantity || 0))).toLocaleString('vi-VN')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* KHU VỰC SOẠN HÀNG CỦA DÒNG ĐANG CHỌN */}
                {realtimePickingLines[activePickingLineIndex] && (() => {
                  const currentLine = realtimePickingLines[activePickingLineIndex];
                  const remQty = currentLine.remainingQuantity ?? Math.max(0, (currentLine.requestedQuantity || currentLine.quantity || 0) - (currentLine.issuedQuantity || 0));
                  const isLineDone = remQty === 0;

                  return (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-4 shadow-sm">
                      {/* Tiêu đề dòng đang lấy */}
                      <div className="border-b border-slate-100 dark:border-zinc-800 pb-3 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            2. Đang nhặt món #{activePickingLineIndex + 1}:
                          </span>
                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-zinc-100">
                            {currentLine.materialName}
                          </h4>
                          <div className="text-xs text-slate-500 font-mono">
                            Mã: {currentLine.materialId} • ĐVT: {currentLine.unit}
                          </div>
                        </div>

                        {/* Số liệu dòng */}
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Cần lấy:</div>
                          <div className="text-base font-black font-mono text-slate-900 dark:text-zinc-100">
                            {currentLine.requestedQuantity ?? currentLine.quantity} {currentLine.unit}
                          </div>
                          <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            Còn thiếu: {remQty.toLocaleString('vi-VN')} {currentLine.unit}
                          </div>
                        </div>
                      </div>

                      {/* CHỈ DẪN VỊ TRÍ KỆ & GỢI Ý LÔ THEO FIFO (CHỈ DẪN THAM KHẢO, KHÔNG CHO BẤM CHỌN) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider">
                            📍 Vị Trí Ô Kệ Chỉ Dẫn (Xếp theo FIFO):
                          </span>
                          {isLoadingBatches && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />}
                        </div>

                        {isLoadingBatches ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mx-auto mb-1" />
                            Đang tìm vị trí Ô kệ và Lô hàng theo FIFO...
                          </div>
                        ) : pickableBatches.length === 0 ? (
                          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900 text-center text-xs text-amber-700 dark:text-amber-300">
                            ⚠️ Không tìm thấy Lô hàng khả dụng đạt chuẩn QC trong kho cho mã này.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Lô gợi ý số 1 theo FIFO */}
                            {pickableBatches[0] && (
                              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-zinc-800/50 border-slate-200 dark:border-zinc-700">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider flex items-center gap-1">
                                    ⭐ GỢI Ý VỊ TRÍ FIFO (LÔ NHẬP CŨ NHẤT)
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-500">
                                    Lô #{pickableBatches[0].batchId}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">📍 VỊ TRÍ KỆ ĐẾN LẤY:</div>
                                    <div className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                                      {pickableBatches[0].locationCode || 'Khu Lưu Trữ'}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] text-slate-400 uppercase font-bold">TỒN KHẢ DỤNG:</div>
                                    <div className="font-mono text-lg font-black text-slate-900 dark:text-zinc-100">
                                      {pickableBatches[0].availableQuantity?.toLocaleString('vi-VN')} {currentLine.unit}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Danh sách các vị trí Kệ khác để tham khảo */}
                            {pickableBatches.length > 1 && (
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800/40 p-2 rounded-lg border border-slate-200 dark:border-zinc-700">
                                <span className="font-bold">Các kệ khác có hàng: </span>
                                {pickableBatches.slice(1).map((b, bIdx) => (
                                  <span key={b.batchId || bIdx} className="font-mono font-semibold text-slate-700 dark:text-zinc-300 mr-2">
                                    • {b.locationCode || 'N/A'} (Lô #{b.batchId}: {b.availableQuantity} {currentLine.unit})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* KHU VỰC BẮT BUỘC QUÉT MÃ LÔ TẠI HIỆN TRƯỜNG (BARCODE SCAN VERIFICATION) */}
                      {!isLineDone && (
                        <div className="space-y-3 pt-2">
                          <div className="p-3.5 bg-gradient-to-r from-slate-900 to-zinc-900 text-white rounded-xl border border-slate-700 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                <Barcode className="w-4 h-4 text-emerald-400" />
                                3. QUÉT MÃ LÔ TẠI KỆ (BẮT BUỘC):
                              </span>
                              <span className="text-[10px] text-zinc-400">Dùng súng quét PDA hoặc Camera</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <input
                                  type="text"
                                  placeholder="Bắn tia súng quét hoặc nhập mã Lô..."
                                  value={scannedBatchBarcode}
                                  onChange={(e) => setScannedBatchBarcode(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleVerifyScannedBatch(scannedBatchBarcode);
                                    }
                                  }}
                                  className="w-full py-2.5 px-3 bg-black/60 border border-emerald-500/80 rounded-lg text-white font-mono font-bold text-sm placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleVerifyScannedBatch(scannedBatchBarcode)}
                                className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shrink-0"
                              >
                                Xác Nhận Mã
                              </button>

                              <button
                                type="button"
                                onClick={() => openScanner(
                                  `Quét Mã Lô Vật Tư: ${currentLine.materialName}`,
                                  'BATCH',
                                  pickableBatches.map(b => ({
                                    code: b.batchId.toString(),
                                    label: `Lô #${b.batchId} - Kệ ${b.locationCode || 'N/A'} (Tồn: ${b.availableQuantity})`
                                  })),
                                  (code) => handleVerifyScannedBatch(code)
                                )}
                                className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg cursor-pointer shrink-0"
                                title="Mở Camera Quét Mã"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            </div>

                            <p className="text-[10px] text-zinc-400 italic">
                              * Nhân viên bắt buộc phải quét đúng tem Barcode Lô hàng tại hiện trường mới có thể ghi nhận số lượng nhặt.
                            </p>
                          </div>

                          {/* KHI ĐÃ QUÉT KHỚP LÔ THÀNH CÔNG -> HIỂN THỊ Ô NHẬP SỐ LƯỢNG & NÚT XÁC NHẬN */}
                          {selectedPickBatch ? (
                            <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-400 dark:border-emerald-700 space-y-3 animate-fadeIn">
                              <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
                                <div>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                                    ✓ ĐÃ KHỚP LÔ #{selectedPickBatch.batchId}
                                  </span>
                                  <div className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-1">
                                    Vị trí Kệ: <span className="font-mono text-emerald-700 dark:text-emerald-400">{selectedPickBatch.locationCode || 'N/A'}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-[10px] text-slate-400 uppercase font-bold">TỒN KHẢ DỤNG:</div>
                                  <div className="font-mono text-base font-black text-slate-900 dark:text-zinc-100">
                                    {selectedPickBatch.availableQuantity?.toLocaleString('vi-VN')} {currentLine.unit}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase">
                                    Số lượng lấy:
                                  </span>
                                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                    Còn thiếu: {remQty.toLocaleString('vi-VN')} {currentLine.unit}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPickBatchQty(Math.max(1, pickBatchQty - 10))}
                                    className="px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 font-bold text-xs cursor-pointer active:scale-95"
                                  >
                                    -10
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPickBatchQty(Math.max(1, pickBatchQty - 1))}
                                    className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 font-bold text-xs cursor-pointer active:scale-95"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>

                                  <input
                                    type="number"
                                    min={1}
                                    max={selectedPickBatch.availableQuantity}
                                    value={pickBatchQty || ''}
                                    onChange={(e) => setPickBatchQty(Math.max(0, Math.min(Number(e.target.value), selectedPickBatch.availableQuantity)))}
                                    className="flex-1 py-2 px-2 text-center font-mono text-lg font-black bg-white dark:bg-zinc-900 border border-emerald-500 rounded-lg text-slate-900 dark:text-zinc-100 ring-2 ring-emerald-500/20"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => setPickBatchQty(Math.min(selectedPickBatch.availableQuantity, pickBatchQty + 1))}
                                    className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 font-bold text-xs cursor-pointer active:scale-95"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPickBatchQty(Math.min(selectedPickBatch.availableQuantity, pickBatchQty + 10))}
                                    className="px-2.5 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 font-bold text-xs cursor-pointer active:scale-95"
                                  >
                                    +10
                                  </button>
                                </div>

                                {/* Phím chọn nhanh */}
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPickBatchQty(Math.min(remQty, selectedPickBatch.availableQuantity))}
                                    className="flex-1 py-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-100 border border-slate-300 dark:border-zinc-600 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
                                  >
                                    Lấy đủ còn thiếu ({Math.min(remQty, selectedPickBatch.availableQuantity)})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPickBatchQty(selectedPickBatch.availableQuantity)}
                                    className="flex-1 py-1.5 bg-white dark:bg-zinc-900 hover:bg-slate-100 border border-slate-300 dark:border-zinc-600 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
                                  >
                                    Lấy hết Lô ({selectedPickBatch.availableQuantity})
                                  </button>
                                </div>

                                {/* Nút bấm xác nhận nhặt */}
                                <button
                                  type="button"
                                  disabled={isSubmittingPickBatch || pickBatchQty <= 0}
                                  onClick={handleConfirmPickBatch}
                                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider transition-all border border-emerald-400/30 ring-2 ring-emerald-500/20"
                                >
                                  {isSubmittingPickBatch ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                                      <span>ĐANG GHI NHẬN LÔ...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                      <span>XÁC NHẬN NHẶT {pickBatchQty.toLocaleString('vi-VN')} {currentLine.unit} TỪ LÔ #{selectedPickBatch.batchId}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-100 dark:bg-zinc-800/40 rounded-xl border border-slate-200 dark:border-zinc-700 text-center text-xs text-slate-500 dark:text-zinc-400">
                              🔒 Vui lòng dùng súng quét mã Barcode Lô hàng tại kệ để mở khóa thao tác nhặt.
                            </div>
                          )}
                        </div>
                      )}

                      {/* ĐÃ SOẠN ĐỦ MÓN NÀY */}
                      {isLineDone && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 text-center space-y-1">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                          <div className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">
                            Đã soạn đủ số lượng cho món này! ({currentLine.requestedQuantity ?? currentLine.quantity} {currentLine.unit})
                          </div>
                          <div className="text-xs text-slate-500">
                            Vui lòng chọn món tiếp theo ở danh sách phía trên.
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* NÚT HOÀN TẤT TOÀN BỘ ĐƠN XUẤT KHO KHI TẤT CẢ CÁC MÓN ĐÃ SOẠN XONG */}
                {realtimePickingLines.length > 0 && realtimePickingLines.every(l => (l.remainingQuantity ?? Math.max(0, (l.requestedQuantity || l.quantity || 0) - (l.issuedQuantity || 0))) === 0) ? (
                  <button
                    type="button"
                    disabled={isCompletingOrder}
                    onClick={handleCompleteEntireOrder}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider transition-all ring-4 ring-emerald-500/30 animate-bounce"
                  >
                    {isCompletingOrder ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>ĐANG ĐÓNG CHỨNG TỪ & CHỐT SỔ CÁI...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>🎉 HOÀN TẤT TOÀN BỘ ĐƠN XUẤT (CHỐT SỔ CÁI)</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedIssueRequest(null)}
                    className="w-full py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors text-center"
                  >
                    Tạm Dừng & Quay Lại Danh Sách Phiếu
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 3: PDA RECEIVING (NHẬN HÀNG CỬA NHẬP)
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'RECEIVING' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                onClick={() => {
                  if (selectedPOOrder) setSelectedPOOrder(null);
                  else setActivePDAMode('MENU');
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> {selectedPOOrder ? 'Chọn PO khác' : 'Về Menu PDA'}
              </button>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">NHẬN HÀNG THEO PO</h3>
                <p className="text-[11px] text-slate-500 font-mono">INB-01 / INB-08</p>
              </div>
            </div>

            {!selectedPOOrder && (
              <div className="space-y-3">
                <button
                  onClick={() => openScanner(
                    'Quét Mã Đơn Hàng PO',
                    'PO',
                    getPOSampleCodes(),
                    (scannedCode) => {
                      const found = receivingOrders.find(r => r.code.toLowerCase() === scannedCode.toLowerCase() || (r.poNumber && r.poNumber.toLowerCase() === scannedCode.toLowerCase()));
                      if (found) {
                        setSelectedPOOrder(found);
                        showBanner('success', `Đã mở đơn PO: ${found.code}`);
                      } else {
                        showBanner('error', `Không tìm thấy PO mã: ${scannedCode}`);
                      }
                    }
                  )}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Barcode className="w-4 h-4" />
                  <span>QUÉT MÃ PO / CHỨNG TỪ NHẬP</span>
                </button>

                <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Hoặc chọn PO từ danh sách ({pendingReceivingOrders.length}):
                </h5>

                <div className="space-y-2">
                  {pendingReceivingOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setSelectedPOOrder(order);
                        setReceivingItemIndex(0);
                        if (order.items[0]) setReceivedQtyInput(order.items[0].poQuantity);
                      }}
                      className="p-3.5 bg-white hover:bg-slate-100/70 border border-slate-200 rounded-xl cursor-pointer transition-all space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900">{order.code}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                          PO: {order.poNumber || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-800 font-semibold">{order.supplier}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                        <span>{order.items.length} mặt hàng</span>
                        <span className="text-slate-800 font-bold">Bấm để nhận →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPOOrder && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">{selectedPOOrder.code}</span>
                    <span className="text-xs text-slate-700 font-bold">{selectedPOOrder.supplier}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Món {receivingItemIndex + 1} / {selectedPOOrder.items.length}: {selectedPOOrder.items[receivingItemIndex]?.materialName}
                  </h4>
                </div>

                {selectedPOOrder.items[receivingItemIndex] && (() => {
                  const item = selectedPOOrder.items[receivingItemIndex];
                  return (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Số lượng trên PO:</span>
                        <strong className="text-slate-900 font-mono">{item.poQuantity} {item.unit}</strong>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block">Số lượng thực nhận (PDA):</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setReceivedQtyInput(Math.max(0, receivedQtyInput - 1))}
                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={receivedQtyInput}
                            onChange={(e) => setReceivedQtyInput(Number(e.target.value))}
                            className="flex-1 bg-white border border-slate-300 text-center font-mono text-lg font-extrabold text-slate-900 py-1.5 rounded-lg"
                          />
                          <button
                            onClick={() => setReceivedQtyInput(receivedQtyInput + 1)}
                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Label Print */}
                      <button
                        onClick={() => {
                          setActiveBarcodePrint({
                            title: 'TEM NHẬN HÀNG TẠM (INB-08)',
                            batchNumber: item.batchNumber || `TEMP-${Date.now().toString().slice(-6)}`,
                            materialName: item.materialName,
                            materialCode: item.materialCode,
                            locationCode: 'TEMP-INBOUND',
                            quantity: receivedQtyInput || item.poQuantity,
                            unit: item.unit,
                            expiryDate: '2027-12-31',
                            poNumber: selectedPOOrder.poNumber
                          });
                          soundManager.playSuccessBeep();
                          showBanner('success', 'Đã mở lệnh in tem Barcode!');
                        }}
                        className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>IN TEM MÃ VẠCH TẠM (INB-08)</span>
                      </button>

                      {/* Confirm */}
                      <button
                        onClick={() => {
                          soundManager.playSuccessBeep();
                          if (receivingItemIndex < selectedPOOrder.items.length - 1) {
                            setReceivingItemIndex(receivingItemIndex + 1);
                            const next = selectedPOOrder.items[receivingItemIndex + 1];
                            setReceivedQtyInput(next.poQuantity);
                            showBanner('info', 'Đã lưu món. Chuyển sang món tiếp theo!');
                          } else {
                            soundManager.playCompleteChime();
                            showBanner('success', `Đã hoàn tất nhận hàng phiếu ${selectedPOOrder.code}! Tự động chuyển QC.`);
                            setSelectedPOOrder(null);
                          }
                        }}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {receivingItemIndex < selectedPOOrder.items.length - 1
                            ? 'XÁC NHẬN & SANG MÓN TIẾP'
                            : 'HOÀN TẤT NHẬP & GỬI PHIẾU QC'}
                        </span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 4: PDA BIN TRANSFER (ĐIỀU CHUYỂN KỆ)
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'TRANSFER' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                onClick={() => setActivePDAMode('MENU')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Về Menu PDA
              </button>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">ĐIỀU CHUYỂN KỆ (TRANSFER)</h3>
                <p className="text-[11px] text-slate-500 font-mono">LOC-03</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  BƯỚC 1: LÔ HÀNG CẦN CHUYỂN
                </span>
                
                {transferBatch ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-mono font-bold text-slate-900">{transferBatch.batchNumber}</div>
                    <div className="font-bold text-slate-800 text-sm">{transferBatch.materialName}</div>
                    <div className="text-xs text-slate-500">
                      Kệ hiện tại: <strong className="text-slate-800 font-mono">{transferBatch.locationCode}</strong> (Tồn: {transferBatch.quantity} {transferBatch.unit})
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Chưa quét mã Lô cần chuyển.</p>
                )}

                <button
                  onClick={() => openScanner(
                    'Quét Mã Lô Cần Chuyển',
                    'BATCH',
                    getBatchSampleCodes(),
                    (code) => {
                      const found = batches.find(b => b.batchNumber.toLowerCase() === code.toLowerCase() || b.id.toLowerCase() === code.toLowerCase());
                      if (found) {
                        setTransferBatch(found);
                        showBanner('success', `Đã chọn Lô ${found.batchNumber}`);
                      } else {
                        showBanner('error', `Không tìm thấy Lô ${code}`);
                      }
                    }
                  )}
                  className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Barcode className="w-4 h-4" /> Quét Mã Lô Hàng
                </button>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  BƯỚC 2: VỊ TRÍ KỆ MỚI ĐẾN
                </span>

                {destLocation ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-mono text-lg font-extrabold text-slate-900">{destLocation.code}</div>
                    <div className="text-xs text-slate-700">{destLocation.warehouse}</div>
                    <div className="text-[11px] text-slate-500">Trạng thái: {destLocation.status}</div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Chưa quét mã Kệ đích đến.</p>
                )}

                <button
                  onClick={() => openScanner(
                    'Quét Mã Kệ Đích Đến',
                    'LOCATION',
                    getLocationSampleCodes(),
                    (code) => {
                      const found = locations.find(l => l.code.toLowerCase() === code.toLowerCase() || l.id.toLowerCase() === code.toLowerCase());
                      if (found) {
                        setDestLocation(found);
                        showBanner('success', `Đã chọn Kệ đích: ${found.code}`);
                      } else {
                        showBanner('error', `Không tìm thấy Kệ ${code}`);
                      }
                    }
                  )}
                  className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-4 h-4" /> Quét Mã Kệ Đích
                </button>
              </div>
            </div>

            {transferBatch && destLocation && (
              <button
                onClick={() => {
                  transferLocation(transferBatch.id, destLocation.id, `Chuyển kệ PDA bởi ${currentUser.fullName}`);
                  soundManager.playCompleteChime();
                  showBanner('success', `Đã chuyển Lô ${transferBatch.batchNumber} sang Kệ ${destLocation.code}!`);
                  setTransferBatch(null);
                  setDestLocation(null);
                }}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>XÁC NHẬN CHUYỂN VỊ TRÍ KỆ</span>
              </button>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 5: PDA STOCK COUNT (KIỂM KÊ)
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'COUNT' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                onClick={() => setActivePDAMode('MENU')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Về Menu PDA
              </button>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">KIỂM KÊ THEO Ô KỆ</h3>
                <p className="text-[11px] text-slate-500 font-mono">INV-07</p>
              </div>
            </div>

            {!countLocation && (
              <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-2xs">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-700 mx-auto flex items-center justify-center border border-slate-200">
                  <MapPin className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base">QUÉT MÃ Ô KỆ ĐỂ BẮT ĐẦU KIỂM ĐẾM</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Quét mã vạch dán trên thanh dầm kệ (VD: K01-T1-01) để lấy danh sách hàng hệ thống.
                </p>

                <button
                  onClick={() => openScanner(
                    'Quét Mã Vạch Kệ Cần Kiểm Kê',
                    'LOCATION',
                    getLocationSampleCodes(),
                    (code) => {
                      const found = locations.find(l => l.code.toLowerCase() === code.toLowerCase() || l.id.toLowerCase() === code.toLowerCase());
                      if (found) {
                        setCountLocation(found);
                        showBanner('success', `Bắt đầu kiểm kê Kệ ${found.code}`);
                      } else {
                        showBanner('error', `Không tìm thấy Kệ ${code}`);
                      }
                    }
                  )}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Barcode className="w-4 h-4" />
                  <span>QUÉT MÃ Ô KỆ CẦN KIỂM</span>
                </button>
              </div>
            )}

            {countLocation && (() => {
              const batchesInThisBin = batches.filter(
                b => b.locationId === countLocation.id || b.locationCode === countLocation.code
              );

              return (
                <div className="space-y-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">ĐANG KIỂM KÊ KỆ:</span>
                      <span className="font-mono text-lg font-extrabold text-slate-900">{countLocation.code}</span>
                      <span className="text-xs text-slate-500 ml-2">({countLocation.warehouse})</span>
                    </div>
                    <button
                      onClick={() => setCountLocation(null)}
                      className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      Đổi kệ khác
                    </button>
                  </div>

                  <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Các lô hàng đang có trên kệ ({batchesInThisBin.length}):
                  </h5>

                  <div className="space-y-2.5">
                    {batchesInThisBin.map((b) => {
                      const counted = countedItems[b.id] !== undefined ? countedItems[b.id] : b.quantity;
                      const diff = counted - b.quantity;

                      return (
                        <div key={b.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-slate-900">{b.batchNumber}</span>
                            <span className="text-xs text-slate-500 font-mono">Tồn máy: {b.quantity} {b.unit}</span>
                          </div>
                          <div className="text-sm font-bold text-slate-800">{b.materialName}</div>

                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                            <span className="text-xs text-slate-600 font-semibold">Thực tế đếm:</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setCountedItems({ ...countedItems, [b.id]: Math.max(0, counted - 1) })}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono text-base font-extrabold text-slate-900 w-10 text-center">
                                {counted}
                              </span>
                              <button
                                onClick={() => setCountedItems({ ...countedItems, [b.id]: counted + 1 })}
                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold cursor-pointer"
                              >
                                +
                              </button>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono border ${
                                diff === 0 ? 'bg-slate-100 text-slate-800 border-slate-200' :
                                diff > 0 ? 'bg-slate-200 text-slate-900 border-slate-300' :
                                'bg-rose-100 text-rose-700 border-rose-200'
                              }`}>
                                {diff === 0 ? 'KHỚP' : diff > 0 ? `+${diff}` : `${diff}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      soundManager.playCompleteChime();
                      showBanner('success', `Đã lưu kết quả kiểm kê Kệ ${countLocation.code}!`);
                      setCountLocation(null);
                      setCountedItems({});
                    }}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>LƯU KẾT QUẢ KIỂM KÊ KỆ</span>
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 5A: PDA KIỂM KÊ THEO BATCH (UC-18 / INV-06)
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'BATCH_AUDIT' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                onClick={() => {
                  if (activeBatchItemPDA) {
                    setActiveBatchItemPDA(null);
                  } else if (selectedBatchAuditPlanPDA) {
                    setSelectedBatchAuditPlanPDA(null);
                  } else {
                    setActivePDAMode('MENU');
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />{' '}
                {activeBatchItemPDA ? 'Đổi Lô' : selectedBatchAuditPlanPDA ? 'Đổi Kế Hoạch' : 'Về Menu PDA'}
              </button>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">KIỂM KÊ THEO LÔ (BATCH)</h3>
                <p className="text-[11px] text-purple-600 font-mono font-bold">UC-18 / INV-06</p>
              </div>
            </div>

            {/* Feedback Message */}
            {batchCountFeedbackMsg && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs ${
                  batchCountFeedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-300'
                }`}
              >
                {batchCountFeedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{batchCountFeedbackMsg.text}</span>
              </div>
            )}

            {/* BƯỚC 1: CHỌN KẾ HOẠCH KIỂM KÊ ĐANG MỞ */}
            {!selectedBatchAuditPlanPDA && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Kế hoạch kiểm kê đang mở ({batchAuditPlansPDA.length}):
                  </span>
                  <button
                    onClick={loadBatchAuditPlansPDA}
                    disabled={isLoadingBatchAuditPDA}
                    className="text-xs text-purple-600 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBatchAuditPDA ? 'animate-spin' : ''}`} />
                    <span>Làm mới</span>
                  </button>
                </div>

                {isLoadingBatchAuditPDA ? (
                  <div className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600 mb-2" />
                    <span>Đang tải kế hoạch...</span>
                  </div>
                ) : batchAuditPlansPDA.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                    Hiện không có kế hoạch kiểm kê batch nào đang mở. Vui lòng liên hệ Trưởng phòng kho lập kế hoạch!
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {batchAuditPlansPDA.map(p => (
                      <div
                        key={p.planId}
                        onClick={() => selectBatchAuditPlanPDA(p.planId)}
                        className="p-4 bg-white hover:bg-purple-50/50 active:scale-98 rounded-2xl border border-slate-200 hover:border-purple-300 shadow-2xs cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-purple-700">
                            #PLAN-{p.planId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Đang kiểm
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-sm">
                          {p.planName}
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                          <span>Tiến độ: <strong className="text-slate-800">{p.countedBatches} / {p.totalBatches} Lô</strong></span>
                          <span>Người lập: <strong className="text-slate-700">{p.createdBy}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BƯỚC 2: QUÉT VÀ ĐẾM MÙ LÔ HÀNG (KHI ĐÃ CHỌN KẾ HOẠCH) */}
            {selectedBatchAuditPlanPDA && (
              <div className="space-y-4">
                {/* Plan Info Strip */}
                <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-200 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-extrabold text-purple-950">
                      {selectedBatchAuditPlanPDA.plan.planName}
                    </div>
                    <div className="text-[11px] text-purple-700 mt-0.5">
                      Tiến độ: <strong>{selectedBatchAuditPlanPDA.plan.countedBatches}/{selectedBatchAuditPlanPDA.plan.totalBatches} Lô</strong> | Lệch: <strong className="text-rose-600">{selectedBatchAuditPlanPDA.plan.discrepantBatches}</strong>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs bg-purple-200 text-purple-900 px-2 py-1 rounded-lg">
                    #{selectedBatchAuditPlanPDA.plan.planId}
                  </span>
                </div>

                {/* GIAI ĐOẠN 2.1: QUÉT BARCODE LÔ NẾU CHƯA CHỌN LÔ NÀO */}
                {!activeBatchItemPDA && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Quét Barcode / Nhập Mã Lô (#Batch ID):
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Barcode className="w-5 h-5 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            ref={pdaBatchAuditInputRef}
                            type="text"
                            autoFocus
                            placeholder="Quét mã vạch hoặc nhập ID (VD: 12791)..."
                            value={pdaBatchAuditScanText}
                            onChange={e => setPdaBatchAuditScanText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                handleScanBatchAuditCode(pdaBatchAuditScanText);
                              }
                            }}
                            className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border-2 border-purple-200 rounded-xl text-sm font-mono font-bold focus:bg-white focus:outline-none focus:border-purple-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleScanBatchAuditCode(pdaBatchAuditScanText)}
                          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          Xác Nhận
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        * Dùng đầu đọc Laser quét tem trên thùng hoặc gõ mã Lô và nhấn Enter.
                      </p>
                    </div>

                    {/* Danh sách các Lô trong kế hoạch để chọn nhanh */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Danh sách Lô thuộc kế hoạch ({selectedBatchAuditPlanPDA.batches.length}):
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {selectedBatchAuditPlanPDA.batches.map(b => (
                          <div
                            key={b.detailId}
                            onClick={() => {
                              setActiveBatchItemPDA(b);
                              setPdaBatchAuditCountQty(b.actualQuantity !== null && b.actualQuantity !== undefined ? b.actualQuantity : 0);
                              setPdaBatchAuditLocationText(b.locationActual || b.locationSnapshot || '');
                              setTimeout(() => {
                                pdaBatchAuditQtyRef.current?.focus();
                                pdaBatchAuditQtyRef.current?.select();
                              }, 100);
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              b.auditStatus === 'KHOP'
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : b.auditStatus === 'LECH_THIEU' || b.auditStatus === 'LECH_THUA'
                                ? 'bg-rose-50/50 border-rose-200'
                                : 'bg-white border-slate-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="space-y-0.5 max-w-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-purple-700">#{b.batchId}</span>
                                <span className="font-mono text-xs font-semibold text-slate-800">{b.materialId}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">{b.materialName}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>Kệ: {b.locationSnapshot || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              {b.auditStatus === 'KHOP' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Đã đếm: {b.actualQuantity}
                                </span>
                              )}
                              {(b.auditStatus === 'LECH_THIEU' || b.auditStatus === 'LECH_THUA') && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Đã đếm: {b.actualQuantity} (Lệch)
                                </span>
                              )}
                              {b.auditStatus === 'CHUA_KIEM' && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Chưa đếm
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* GIAI ĐOẠN 2.2: BÀN PHÍM ĐẾM MÙ (BLIND COUNT) KHI ĐÃ CHỌN LÔ */}
                {activeBatchItemPDA && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-100">
                    {/* Active Batch Card */}
                    <div className="p-4 bg-white rounded-2xl border-2 border-purple-500 shadow-md space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-base text-purple-700">
                          LÔ #{activeBatchItemPDA.batchId}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-mono font-bold text-xs rounded">
                          {activeBatchItemPDA.unit || 'Cái'}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        {activeBatchItemPDA.materialName || activeBatchItemPDA.materialId}
                      </div>
                      <div className="text-xs font-mono text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kệ dự kiến: <strong>{activeBatchItemPDA.locationSnapshot || 'N/A'}</strong></span>
                      </div>
                    </div>

                    {/* Blind Count Keypad */}
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                        Số lượng thực tế đếm được ({activeBatchItemPDA.unit || ''}):
                      </label>

                      {/* Display Box */}
                      <div className="flex items-center gap-2">
                        <input
                          ref={pdaBatchAuditQtyRef}
                          type="number"
                          step="any"
                          min={0}
                          value={pdaBatchAuditCountQty || ''}
                          onChange={e => setPdaBatchAuditCountQty(parseFloat(e.target.value) || 0)}
                          className="w-full text-center text-3xl font-black font-mono text-purple-900 py-3 bg-purple-50/50 border-2 border-purple-300 rounded-xl focus:bg-white focus:outline-none focus:border-purple-600"
                        />
                      </div>

                      {/* Quick Add Buttons */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 5, 10, 50, 100].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setPdaBatchAuditCountQty(prev => (prev || 0) + val)}
                            className="py-2.5 bg-slate-100 hover:bg-purple-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 active:scale-95 cursor-pointer"
                          >
                            +{val}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPdaBatchAuditCountQty(0)}
                          className="py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                        >
                          Xóa về 0
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdaBatchAuditCountQty(prev => Math.max(0, (prev || 0) - 1))}
                          className="py-2 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                        >
                          -1 đơn vị
                        </button>
                      </div>

                      {/* Location & Note */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Vị trí kệ thực tế:</label>
                          <input
                            type="text"
                            placeholder="VD: 01-02011"
                            value={pdaBatchAuditLocationText}
                            onChange={e => setPdaBatchAuditLocationText(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Ghi chú (rách/móp...):</label>
                          <input
                            type="text"
                            placeholder="Ghi chú nếu có..."
                            value={pdaBatchAuditNote}
                            onChange={e => setPdaBatchAuditNote(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      {/* Big Submit Button */}
                      <button
                        type="button"
                        onClick={handleSubmitBatchCountPDA}
                        disabled={isSubmittingBatchCountPDA}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50 mt-2"
                      >
                        {isSubmittingBatchCountPDA ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>ĐANG LƯU...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>LƯU KẾT QUẢ ĐẾM</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 5B: PDA CYCLE COUNT THEO VẬT TƯ (UC-27 / INV-08)
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'CYCLE_COUNT' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                onClick={() => {
                  if (selectedCyclePlanPDA) {
                    setSelectedCyclePlanPDA(null);
                  } else {
                    setActivePDAMode('MENU');
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> {selectedCyclePlanPDA ? 'Đổi Kế Hoạch' : 'Về Menu PDA'}
              </button>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">KIỂM KÊ CYCLE COUNT</h3>
                <p className="text-[11px] text-blue-600 font-mono font-bold">UC-27 / INV-08</p>
              </div>
            </div>

            {/* Step A: Select Plan */}
            {!selectedCyclePlanPDA && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Chọn kế hoạch kiểm kê đang mở ({cyclePlansPDA.length}):
                  </span>
                  <button
                    onClick={loadCyclePlansPDA}
                    className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    Làm mới
                  </button>
                </div>

                {isCyclePlanLoadingPDA ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                    Đang tải danh sách kế hoạch kiểm kê...
                  </div>
                ) : cyclePlansPDA.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Không có kế hoạch kiểm kê nào đang mở. Vui lòng lập kế hoạch trên Web trước.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {cyclePlansPDA.map(plan => (
                      <div
                        key={plan.planId}
                        onClick={() => loadCyclePlanDetailPDA(plan.planId)}
                        className="p-4 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-500 rounded-2xl transition-all cursor-pointer shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-extrabold text-blue-800 text-xs">
                            Kế Hoạch #{plan.planId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            {plan.batchCount} Batch
                          </span>
                        </div>

                        <div className="font-mono font-bold text-sm text-slate-900">
                          {plan.materialId}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-1">
                          {plan.materialName || '—'}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 font-mono">
                          <span className="text-slate-500">Tồn HT: <strong>{plan.systemQuantity}</strong></span>
                          <span className="text-blue-700 font-bold">Đã đếm: {plan.actualQuantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step B: Location-First Scanning & Multi-Batch Partial Counting */}
            {selectedCyclePlanPDA && selectedCyclePlanPDA.plan && (
              <div className="space-y-4">
                {/* Plan Header Info */}
                <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-blue-800 dark:text-blue-400 text-xs">
                      Kế Hoạch #{selectedCyclePlanPDA.plan.planId}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 font-bold">
                      Tồn HT: {selectedCyclePlanPDA.plan.systemQuantity.toLocaleString()} {selectedCyclePlanPDA.plan.unit}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {selectedCyclePlanPDA.plan.materialId}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-zinc-400 font-medium">
                    {selectedCyclePlanPDA.plan.materialName}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-zinc-800 font-mono">
                    <span className="text-slate-500 dark:text-zinc-400">
                      Đã đếm lũy kế: <strong className="text-blue-700 dark:text-blue-400">{selectedCyclePlanPDA.plan.actualQuantity.toLocaleString()}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400">
                      Tiến độ: <strong className="text-emerald-700 dark:text-emerald-400">{selectedCyclePlanPDA.batches.filter(b => b.isCounted).length}/{selectedCyclePlanPDA.batches.length} Batch</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmittingCountPDA}
                    onClick={() => handleSubmitCountedPDA(selectedCyclePlanPDA.plan!.planId)}
                    className="w-full mt-2 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider transition-all border border-emerald-400/30 ring-2 ring-emerald-500/20"
                  >
                    <FileCheck className="w-4 h-4 text-emerald-200 animate-pulse" />
                    <span>Xác Nhận Đã Kiểm Xong (Gửi TP Duyệt)</span>
                  </button>
                </div>

                {/* STEPPER PROGRESS INDICATOR */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 dark:bg-zinc-800 rounded-2xl text-[11px] font-bold">
                  {/* Step 1 Tab */}
                  <div className={`py-2 px-1.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all ${
                    cycleCountLocationPDA 
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold' 
                      : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs'
                  }`}>
                    {cycleCountLocationPDA ? <Check className="w-3.5 h-3.5" /> : <span>1.</span>}
                    <span className="truncate">Quét Ô Kệ</span>
                  </div>

                  {/* Step 2 Tab */}
                  <div className={`py-2 px-1.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all ${
                    !cycleCountLocationPDA
                      ? 'text-slate-400 dark:text-zinc-600'
                      : activeCycleBatchPDA
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs'
                  }`}>
                    {activeCycleBatchPDA ? <Check className="w-3.5 h-3.5" /> : <span>2.</span>}
                    <span className="truncate">Quét Batch</span>
                  </div>

                  {/* Step 3 Tab */}
                  <div className={`py-2 px-1.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all ${
                    activeCycleBatchPDA && cycleCountLocationPDA
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs'
                      : 'text-slate-400 dark:text-zinc-600'
                  }`}>
                    <span>3.</span>
                    <span className="truncate">Đếm Số Lượng</span>
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    BƯỚC 1: QUÉT & XÁC ĐỊNH VỊ TRÍ Ô KỆ ĐANG ĐỨNG KIỂM
                ═════════════════════════════════════════════════════════════ */}
                <div className={`transition-all ${
                  !cycleCountLocationPDA 
                    ? 'p-4 bg-white dark:bg-zinc-900 border-2 border-emerald-500 ring-4 ring-emerald-500/20 rounded-2xl shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-150' 
                    : 'p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl shadow-2xs'
                }`}>
                  {cycleCountLocationPDA ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">Kệ Kiểm:</span>
                          <span className="font-mono text-sm font-extrabold text-emerald-900 dark:text-emerald-200">{cycleCountLocationPDA}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCycleCountLocationPDA('');
                          setActiveCycleBatchPDA(null);
                          setCycleCountInputPDA(0);
                          showBanner('info', 'Đã hủy chọn vị trí. Vui lòng quét ô kệ tiếp theo.');
                        }}
                        className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        Đổi Kệ
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> BƯỚC 1: QUÉT MÃ Ô KỆ (MMS1)
                        </span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                          Chờ súng quét / gõ mã
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Quét mã vạch dán trên thanh dầm kệ (VD: 01-01011, 02-01032...) trước khi đếm.
                      </p>

                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          if (!pdaLocationScanText.trim()) return;
                          const code = pdaLocationScanText.trim().toUpperCase();
                          setCycleCountLocationPDA(code);
                          setPdaLocationScanText('');
                          soundManager.playSuccessBeep();
                          showBanner('success', `Đã ghi nhận vị trí Kệ: ${code}`);
                        }}
                        className="space-y-2.5"
                      >
                        <div className="relative">
                          <Barcode className="w-5 h-5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            ref={pdaLocationInputRef}
                            type="text"
                            value={pdaLocationScanText}
                            onChange={e => setPdaLocationScanText(e.target.value)}
                            placeholder="Bắn súng quét hoặc gõ mã ô kệ..."
                            className="w-full pl-10 pr-24 py-3.5 border-2 border-emerald-600 dark:border-emerald-500 rounded-xl font-mono uppercase font-black text-sm bg-emerald-50/40 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-500/30"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg text-xs font-black uppercase cursor-pointer shadow-sm active:scale-95 border border-emerald-400/30 ring-1 ring-emerald-500/20"
                          >
                            Xác Nhận
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => openScanner(
                            'Quét Mã Vạch Ô Kệ Kiểm Kê (MMS1)',
                            'LOCATION',
                            getLocationSampleCodes(),
                            (code) => {
                              setCycleCountLocationPDA(code);
                              soundManager.playSuccessBeep();
                              showBanner('success', `Đã ghi nhận vị trí Kệ: ${code}`);
                            }
                          )}
                          className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-blue-600" /> Bật Camera Quét Ô Kệ
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    BƯỚC 2: QUÉT MÃ LÔ BATCH CẦN KIỂM ĐẾM
                ═════════════════════════════════════════════════════════════ */}
                {cycleCountLocationPDA && (
                  <div className={`transition-all ${
                    !activeCycleBatchPDA 
                      ? 'p-4 bg-white dark:bg-zinc-900 border-2 border-emerald-500 ring-4 ring-emerald-500/20 rounded-2xl shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-150' 
                      : 'p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl shadow-2xs'
                  }`}>
                    {activeCycleBatchPDA ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase block">Đang đếm Lô Batch:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm font-extrabold text-blue-950 dark:text-blue-200">#{activeCycleBatchPDA.batchId}</span>
                              <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-mono font-bold">(Tồn: {activeCycleBatchPDA.systemQuantity} {activeCycleBatchPDA.unit})</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCycleBatchPDA(null);
                            setCycleCountInputPDA(0);
                          }}
                          className="px-2.5 py-1 bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-600 dark:text-blue-400 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          Đổi Lô
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Barcode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> BƯỚC 2: QUÉT MÃ LÔ BATCH TRÊN THÙNG
                          </span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            Chờ súng quét barcode lô
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          Bắn súng quét vào tem nhãn dán trên thùng hàng để bắt đầu đếm.
                        </p>

                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            if (!pdaBatchScanText.trim()) return;
                            const cleanCode = pdaBatchScanText.trim().toLowerCase();
                            const found = selectedCyclePlanPDA.batches.find(
                              b => b.batchId.toString() === cleanCode || (b.bravoId && b.bravoId.toLowerCase() === cleanCode)
                            );
                            if (found) {
                              setActiveCycleBatchPDA(found);
                              setCycleCountInputPDA(0);
                              setPdaBatchScanText('');
                              soundManager.playSuccessBeep();
                              showBanner('success', `Đã nhận diện Batch #${found.batchId}`);
                            } else {
                              soundManager.playErrorBuzzer();
                              showBanner('error', `Mã Barcode ${pdaBatchScanText} không thuộc kế hoạch kiểm kê này!`);
                            }
                          }}
                          className="space-y-2.5"
                        >
                          <div className="relative">
                            <Barcode className="w-5 h-5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              ref={pdaBatchInputRef}
                              type="text"
                              value={pdaBatchScanText}
                              onChange={e => setPdaBatchScanText(e.target.value)}
                              placeholder="Bắn súng quét barcode dán trên thùng..."
                              className="w-full pl-10 pr-24 py-3.5 border-2 border-emerald-600 dark:border-emerald-500 rounded-xl font-mono uppercase font-black text-sm bg-emerald-50/40 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-4 focus:ring-emerald-500/30"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-lg text-xs font-black uppercase cursor-pointer shadow-sm active:scale-95 border border-emerald-400/30 ring-1 ring-emerald-500/20"
                            >
                              Xác Nhận
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => openScanner(
                              'Quét Mã Lô Batch Cần Đếm',
                              'BATCH',
                              selectedCyclePlanPDA.batches.map(b => ({ code: b.batchId.toString(), label: `Batch #${b.batchId} (${b.bravoId || '—'})` })),
                              (code) => {
                                const found = selectedCyclePlanPDA.batches.find(
                                  b => b.batchId.toString() === code || (b.bravoId && b.bravoId.toLowerCase() === code.toLowerCase())
                                );
                                if (found) {
                                  setActiveCycleBatchPDA(found);
                                  setCycleCountInputPDA(0);
                                  soundManager.playSuccessBeep();
                                  showBanner('success', `Đã nhận diện Batch #${found.batchId}`);
                                } else {
                                  soundManager.playErrorBuzzer();
                                  showBanner('error', `Không tìm thấy Batch ${code} trong kế hoạch này.`);
                                }
                              }
                            )}
                            className="w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Camera className="w-4 h-4 text-emerald-600" /> Bật Camera Quét Barcode Thùng
                          </button>
                        </form>

                        {/* Danh sách batch cards (CHỈ HIỂN THỊ THAM KHẢO TIẾN ĐỘ) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {selectedCyclePlanPDA.batches.map(b => {
                            return (
                              <div
                                key={b.detailId}
                                className={`p-2.5 rounded-xl border select-none space-y-1 ${
                                  b.isCounted
                                    ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white">
                                    Batch #{b.batchId}
                                  </span>
                                  {b.isCounted ? (
                                    <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-[9px] font-bold">
                                      Đã đếm {b.countTimes} lần
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400 rounded text-[9px]">
                                      Chờ quét mã
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-zinc-400">
                                  <span>Tồn máy: <strong>{b.systemQuantity.toLocaleString()} {b.unit}</strong></span>
                                  {b.isCounted && (
                                    <span className="text-[#007D3C] dark:text-emerald-400 font-bold">
                                      Đã ghi: {b.actualQuantity.toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                <div className="pt-1 flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => setActiveBarcodePrint({
                                      title: 'TEM NHÃN VẬT TƯ & LÔ HÀNG',
                                      batchNumber: String(b.batchId),
                                      batchId: b.batchId,
                                      materialCode: selectedCyclePlanPDA.plan!.materialId,
                                      materialName: selectedCyclePlanPDA.plan!.materialName || '',
                                      quantity: b.actualQuantity > 0 ? b.actualQuantity : b.systemQuantity,
                                      unit: b.unit || selectedCyclePlanPDA.plan!.unit || '',
                                      locationCode: cycleCountLocationPDA || b.locationCode || 'Hiện trường',
                                      poNumber: `CYCLE-COUNT (Lô #${b.batchId})`,
                                      expiryDate: 'N/A'
                                    })}
                                    className="px-2.5 py-1 bg-white dark:bg-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-600 text-slate-800 dark:text-white border border-slate-300 dark:border-zinc-600 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Printer className="w-3 h-3 text-[#F7941D]" />
                                    <span>In Tem Lô #{b.batchId}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-3 border-t border-slate-200 dark:border-zinc-700">
                          <button
                            type="button"
                            disabled={isSubmittingCountPDA}
                            onClick={() => handleSubmitCountedPDA(selectedCyclePlanPDA.plan!.planId)}
                            className="w-full py-3.5 bg-[#007D3C] hover:bg-[#006631] active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider transition-all border border-emerald-600"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>Xác Nhận Đã Kiểm Xong Kế Hoạch #{selectedCyclePlanPDA.plan.planId}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    BƯỚC 3: NHẬP SỐ LƯỢNG THỰC TẾ 1 THÙNG & TÁCH LÔ CON
                ═════════════════════════════════════════════════════════════ */}
                {cycleCountLocationPDA && activeCycleBatchPDA && (
                  <form
                    onSubmit={async e => {
                      e.preventDefault();
                      if (isSubmittingCountPDA) return;
                      if (cycleCountInputPDA <= 0) {
                        soundManager.playErrorBuzzer();
                        showBanner('error', 'Vui lòng nhập số lượng thực tế trong thùng (> 0) trước khi xác nhận đếm!');
                        return;
                      }
                      setIsSubmittingCountPDA(true);
                      try {
                        const targetPlanId = selectedCyclePlanPDA.plan!.planId;
                        const targetDetailId = activeCycleBatchPDA.detailId;
                        const targetBatchId = activeCycleBatchPDA.batchId;
                        const targetUnit = activeCycleBatchPDA.unit || selectedCyclePlanPDA.plan!.unit || '';
                        const targetLoc = cycleCountLocationPDA || activeCycleBatchPDA.locationCode || 'Hiện trường';
                        const countedQty = cycleCountInputPDA;
                        const materialId = selectedCyclePlanPDA.plan!.materialId;
                        const materialName = selectedCyclePlanPDA.plan!.materialName || '';

                        const res = await cycleCountService.logCount(targetPlanId, {
                          detailId: targetDetailId,
                          batchId: targetBatchId,
                          actualQuantity: countedQty,
                          unit: targetUnit,
                          locationCode: targetLoc
                        });

                        const childBatchId = res.newBatchId || targetBatchId;

                        const newBatchObj = {
                          newBatchId: childBatchId,
                          parentBatchId: targetBatchId,
                          materialId: materialId,
                          materialName: materialName,
                          quantity: countedQty,
                          unit: targetUnit,
                          locationCode: targetLoc,
                          createdAt: formatTime(new Date(), true)
                        };
                        setLastCreatedChildBatchPDA(newBatchObj);
                        soundManager.playSuccessBeep();
                        showBanner('success', `Đã ghi nhận ${countedQty} ${targetUnit}! Lô con mới: #${childBatchId}`);
                        
                        // 1. Reset số lượng kiểm về 0
                        setCycleCountInputPDA(0);

                        // 2. Chuyển ngay active batch về null để màn hình sẵn sàng cho thùng tiếp theo
                        setActiveCycleBatchPDA(null);

                        // 3. Xuất hiện luôn pop up in tem
                        setActiveBarcodePrint({
                          title: 'TEM NHÃN VẬT TƯ & LÔ HÀNG',
                          batchNumber: String(childBatchId),
                          batchId: childBatchId,
                          materialCode: materialId,
                          materialName: materialName,
                          quantity: countedQty,
                          unit: targetUnit,
                          locationCode: targetLoc,
                          poNumber: `CYCLE-COUNT (Lô Con #${childBatchId})`,
                          expiryDate: 'N/A'
                        });

                        await loadCyclePlanDetailPDA(targetPlanId, true);
                      } catch (err: any) {
                        soundManager.playErrorBuzzer();
                        showBanner('error', err.message || 'Lỗi ghi nhận kiểm đếm.');
                      } finally {
                        setIsSubmittingCountPDA(false);
                      }
                    }}
                    className="p-4 bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-2xl shadow-md space-y-3.5 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase block">
                          BƯỚC 3: ĐẾM THÙNG THỰC TẾ CHO BATCH #{activeCycleBatchPDA.batchId}:
                        </span>
                        <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          Tồn máy snapshot: <strong className="font-mono text-slate-900 dark:text-white">{activeCycleBatchPDA.systemQuantity.toLocaleString()} {activeCycleBatchPDA.unit}</strong>
                          {activeCycleBatchPDA.countTimes > 0 && (
                            <span className="ml-2 text-emerald-600 font-bold">• Đã đếm: {activeCycleBatchPDA.actualQuantity.toLocaleString()} {activeCycleBatchPDA.unit}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Touch Counter Component */}
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl space-y-2.5">
                      <label className="text-[11px] uppercase font-bold text-slate-700 dark:text-zinc-300 block">
                        Số lượng thực tế trong thùng / kiện này ({activeCycleBatchPDA.unit || 'Cái'}):
                      </label>

                      {/* Main Stepper Input */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSubmittingCountPDA}
                          onClick={() => setCycleCountInputPDA(Math.max(0, cycleCountInputPDA - 1))}
                          className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-white font-extrabold text-2xl cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center disabled:opacity-50"
                        >
                          -
                        </button>
                        <input
                          ref={pdaCountInputRef}
                          type="number"
                          step="any"
                          disabled={isSubmittingCountPDA}
                          value={cycleCountInputPDA === 0 ? '' : cycleCountInputPDA}
                          placeholder="0"
                          onChange={e => setCycleCountInputPDA(parseFloat(e.target.value) || 0)}
                          className="flex-1 bg-white dark:bg-zinc-900 border-2 border-blue-600 dark:border-blue-500 text-center font-mono text-3xl font-extrabold text-blue-700 dark:text-blue-400 py-2 rounded-xl focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50"
                          autoFocus
                        />
                        <button
                          type="button"
                          disabled={isSubmittingCountPDA}
                          onClick={() => setCycleCountInputPDA(cycleCountInputPDA + 1)}
                          className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-white font-extrabold text-2xl cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick Presets for Warehouse Staff */}
                      <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                        {[1, 5, 10, 50, 100].map(val => (
                          <button
                            key={val}
                            type="button"
                            disabled={isSubmittingCountPDA}
                            onClick={() => setCycleCountInputPDA(cycleCountInputPDA + val)}
                            className="py-2 bg-white dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
                          >
                            +{val}
                          </button>
                        ))}
                      </div>

                      {/* Quick Fill Full Batch or Clear */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-zinc-700">
                        <button
                          type="button"
                          disabled={isSubmittingCountPDA}
                          onClick={() => setCycleCountInputPDA(activeCycleBatchPDA.systemQuantity)}
                          className="flex-1 py-1.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer disabled:opacity-50"
                        >
                          Đếm Hết Tồn ({activeCycleBatchPDA.systemQuantity} {activeCycleBatchPDA.unit})
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingCountPDA}
                          onClick={() => setCycleCountInputPDA(0)}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-700 hover:bg-slate-300 text-slate-700 dark:text-zinc-200 text-[11px] font-bold rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          Xóa Về 0
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmittingCountPDA}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider transition-all border border-emerald-400/30 ring-2 ring-emerald-500/20"
                    >
                      {isSubmittingCountPDA ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-200" />
                          <span>ĐANG GHI NHẬN & TÁCH THÙNG...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-200 animate-pulse" />
                          <span>XÁC NHẬN SỐ ĐẾM & TÁCH THÙNG NÀY</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    HIỂN THỊ LÔ CON MỚI VỪA ĐƯỢC HỆ THỐNG SINH RA (NEW BATCH CARD)
                ═════════════════════════════════════════════════════════════ */}
                {lastCreatedChildBatchPDA && (
                  <div className="p-4 bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-transparent dark:from-emerald-950/40 dark:via-blue-950/40 border-2 border-emerald-500/60 dark:border-emerald-500/40 rounded-2xl shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                            ĐÃ TÁCH & SINH LÔ CON MỚI THÀNH CÔNG!
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Lô con kế thừa quan hệ từ Lô cha #{lastCreatedChildBatchPDA.parentBatchId}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setLastCreatedChildBatchPDA(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Khối thông tin Lô con */}
                    <div className="p-3 bg-white dark:bg-zinc-900/90 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">MÃ LÔ CON MỚI</span>
                          <span className="text-xl font-mono font-black text-blue-700 dark:text-blue-400">
                            #{lastCreatedChildBatchPDA.newBatchId}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">SỐ LƯỢNG ĐÃ ĐẾM</span>
                          <span className="text-base font-mono font-black text-emerald-700 dark:text-emerald-400">
                            +{lastCreatedChildBatchPDA.quantity.toLocaleString()} {lastCreatedChildBatchPDA.unit}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Vị trí Ô Kệ:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700 inline-block">
                            📍 {lastCreatedChildBatchPDA.locationCode}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Giờ đếm:</span>
                          <span className="font-mono text-slate-600 dark:text-zinc-400 text-[11px]">
                            ⏰ {lastCreatedChildBatchPDA.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nút In Tem Lô Con Mới */}
                    <button
                      type="button"
                      onClick={async () => {
                        showBanner('info', `Đang gửi HTTP POST in Lô #${lastCreatedChildBatchPDA.newBatchId} đến 10.17.16.102:8080...`);
                        const printRes = await printService.sendPrintLabel({
                          batch: lastCreatedChildBatchPDA.newBatchId,
                          msnv: currentUser?.username || currentUser?.id || '00',
                          kho: 'vt'
                        });
                        showBanner('success', printRes.message);
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2.5 cursor-pointer uppercase tracking-wider transition-all border border-emerald-400/30 ring-2 ring-emerald-500/20"
                    >
                      <Printer className="w-5 h-5 shrink-0 text-emerald-200 animate-pulse" />
                      <span>IN TEM LÔ CON #{lastCreatedChildBatchPDA.newBatchId} (10.17.16.102:8080)</span>
                    </button>
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    NHẬT KÝ CÁC THÙNG ĐÃ ĐẾM THỰC TẾ (COUNT LOGS HISTORY TABLE)
                ═════════════════════════════════════════════════════════════ */}
                {selectedCyclePlanPDA.logs && selectedCyclePlanPDA.logs.length > 0 && (
                  <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        BẢNG NHẬT KÝ CÁC THÙNG ĐÃ ĐẾM ({selectedCyclePlanPDA.logs.length} LƯỢT)
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-zinc-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 font-bold border-b border-slate-200 dark:border-zinc-700 text-[11px]">
                            <th className="py-2.5 px-2 text-center w-8">STT</th>
                            <th className="py-2.5 px-2.5">Lô Con Mới</th>
                            <th className="py-2.5 px-2.5">Vị Trí Kệ</th>
                            <th className="py-2.5 px-2.5 text-right">Số Lượng</th>
                            <th className="py-2.5 px-2.5">Người Đếm</th>
                            <th className="py-2.5 px-2.5 text-center">Thời Gian</th>
                            <th className="py-2.5 px-2 text-center">In Tem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono">
                          {selectedCyclePlanPDA.logs.map((log, idx) => {
                            const isJustCreated = lastCreatedChildBatchPDA?.newBatchId === log.batchId;
                            return (
                              <tr
                                key={log.logId || idx}
                                className={`transition-colors ${
                                  isJustCreated
                                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-bold'
                                    : 'hover:bg-blue-50/40 dark:hover:bg-zinc-800/40'
                                }`}
                              >
                                <td className="py-2.5 px-2 text-center text-slate-400 font-sans text-[11px]">
                                  {idx + 1}
                                </td>
                                <td className="py-2.5 px-2.5">
                                  <div className="flex items-center gap-1">
                                    <span className="font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                                      Lô #{log.batchId}
                                    </span>
                                    {isJustCreated && (
                                      <span className="px-1 py-0.2 bg-emerald-500 text-white rounded text-[9px] font-sans font-extrabold uppercase">
                                        MỚI
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-2.5">
                                  <span className="font-bold text-slate-800 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-750">
                                    {log.locationCode || 'Hiện trường'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2.5 text-right font-extrabold text-emerald-700 dark:text-emerald-400 font-mono text-sm">
                                  +{log.quantity.toLocaleString()} <span className="text-[10px] font-sans font-semibold text-slate-500">{log.unit}</span>
                                </td>
                                <td className="py-2.5 px-2.5 font-sans text-slate-600 dark:text-zinc-400 text-xs">
                                  {log.createdBy}
                                </td>
                                <td className="py-2.5 px-2.5 text-center text-[11px] text-slate-400">
                                  {formatTime(log.createdAt)}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    title="In tem mã vạch dán thùng này (10.17.16.102:8080)"
                                    onClick={async () => {
                                      showBanner('info', `Đang gửi HTTP POST in Lô #${log.batchId} đến 10.17.16.102:8080...`);
                                      const printRes = await printService.sendPrintLabel({
                                        batch: log.batchId,
                                        msnv: currentUser?.username || currentUser?.id || '00',
                                        kho: 'vt'
                                      });
                                      showBanner('success', printRes.message);
                                    }}
                                    className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 font-sans font-bold text-xs mx-auto shadow-2xs"
                                  >
                                    <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span>In tem</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-200 dark:border-zinc-700 font-bold text-xs">
                            <td colSpan={3} className="py-2.5 px-3 text-slate-700 dark:text-zinc-300 font-sans">
                              Tổng cộng ({selectedCyclePlanPDA.logs.length} lượt đếm):
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-700 dark:text-emerald-400 text-sm font-extrabold">
                              +{selectedCyclePlanPDA.logs.reduce((sum, l) => sum + (l.quantity || 0), 0).toLocaleString()} {selectedCyclePlanPDA.plan.unit}
                            </td>
                            <td colSpan={3}></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* NÚT HOÀN TẤT KỆ NÀY ĐỂ CHUYỂN SANG Ô KỆ TIẾP THEO */}
                {cycleCountLocationPDA && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playCompleteChime();
                        showBanner('info', `Đã xong Kệ ${cycleCountLocationPDA}. Mời quét ô kệ tiếp theo.`);
                        setCycleCountLocationPDA('');
                        setActiveCycleBatchPDA(null);
                        setCycleCountInputPDA(0);
                      }}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>HOÀN TẤT KỆ NÀY → QUÉT Ô KỆ TIẾP THEO</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW 6: PDA LOOKUP
        ═════════════════════════════════════════════════════════════════════ */}
        {activePDAMode === 'LOOKUP' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <button
                onClick={() => setActivePDAMode('MENU')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Về Menu PDA
              </button>
              <div className="text-right">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">TRA CỨU BARCODE TỨC THỜI</h3>
                <p className="text-[11px] text-slate-500 font-mono">INV-01 / INV-02</p>
              </div>
            </div>

            <button
              onClick={() => openScanner(
                'Tra Cứu Bất Kỳ Barcode Nào',
                'ANY',
                [...getBatchSampleCodes(), ...getLocationSampleCodes()],
                handleLookupScan
              )}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Barcode className="w-4 h-4" />
              <span>BẤM ĐỂ QUÉT BARCODE CẦN TRA CỨU</span>
            </button>

            {lookupResult && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    KẾT QUẢ TRA CỨU ({lookupResult.type})
                  </span>
                  <button onClick={() => setLookupResult(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {lookupResult.type === 'BATCH' && (() => {
                  const b: BatchInventory = lookupResult.data;
                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="font-mono text-xl font-extrabold text-slate-900">{b.batchNumber}</div>
                        <div className="text-base font-bold text-slate-800">{b.materialName}</div>
                        <div className="text-xs text-slate-500">SKU: <strong className="text-slate-700">{b.materialCode}</strong></div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-slate-500 block text-[10px]">Vị trí Kệ:</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">{b.locationCode}</span>
                          <span className="text-[10px] text-slate-500 block">({b.warehouse})</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-slate-500 block text-[10px]">Tồn khả dụng:</span>
                          <span className="font-bold text-slate-900 text-sm">{b.quantity} {b.unit}</span>
                          <span className="text-[10px] text-slate-500 block">Trạng thái: {b.status}</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-slate-500 block text-[10px]">Hạn sử dụng:</span>
                          <span className="font-mono font-bold text-slate-800">{b.expiryDate}</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-slate-500 block text-[10px]">Đơn giá:</span>
                          <span className="font-mono text-slate-800 font-semibold">{b.unitCost?.toLocaleString()} đ</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setTransferBatch(b);
                            setActivePDAMode('TRANSFER');
                          }}
                          className="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Chuyển Kệ Lô Này
                        </button>
                        <button
                          onClick={() => {
                            setActiveBarcodePrint({
                              title: 'TEM NHÃN LÔ HÀNG',
                              batchNumber: b.batchNumber,
                              materialName: b.materialName,
                              materialCode: b.materialCode,
                              locationCode: b.locationCode,
                              quantity: b.quantity,
                              unit: b.unit,
                              expiryDate: b.expiryDate,
                              poNumber: b.poNumber
                            });
                          }}
                          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          In Lại Tem Lô
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {lookupResult.type === 'LOCATION' && (() => {
                  const loc = lookupResult.data.location;
                  const bList: BatchInventory[] = lookupResult.data.batches;
                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="font-mono text-xl font-extrabold text-slate-900">{loc.code}</div>
                        <div className="text-xs text-slate-600">{loc.warehouse} (Dãy {loc.rack}, Tầng {loc.tier}, Ô {loc.bin})</div>
                      </div>

                      <div className="text-xs font-bold text-slate-600">
                        Danh sách {bList.length} lô đang nằm ở ô này:
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {bList.map(b => (
                          <div key={b.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                            <div>
                              <span className="font-mono font-bold text-slate-900">{b.batchNumber}</span>
                              <span className="text-slate-700 block">{b.materialName}</span>
                            </div>
                            <span className="font-bold text-slate-900">{b.quantity} {b.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 📷 GLOBAL HANDHELD BARCODE SCANNER MODAL */}
      <HandheldScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={scannerConfig.onScan}
        title={scannerConfig.title}
        expectedType={scannerConfig.expectedType}
        sampleCodes={scannerConfig.sampleCodes}
      />
    </div>
  );
};
