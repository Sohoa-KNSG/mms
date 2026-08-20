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
  RefreshCw,
  Check,
  History
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { soundManager } from '../utils/audioFeedback';
import { HandheldScannerModal } from './HandheldScannerModal';
import { BatchInventory, WarehouseLocation, ReceivingOrder, IssueRequest } from '../types';
import {
  cycleCountService,
  CycleCountPlanSummary,
  CycleCountPlanDetail,
  CycleCountBatchItem,
  WarehouseLocationOption
} from '../services/cycleCountService';
import { printService } from '../services/printService';

export type PDAMode =
  | 'MENU'
  | 'PUTAWAY'
  | 'PICKING'
  | 'RECEIVING'
  | 'TRANSFER'
  | 'COUNT'
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

  // --- WORKFLOW 5B: REAL MMS1 CYCLE COUNT (UC-27 / INV-08) ---
  const [cyclePlansPDA, setCyclePlansPDA] = useState<CycleCountPlanSummary[]>([]);
  const [selectedCyclePlanPDA, setSelectedCyclePlanPDA] = useState<CycleCountPlanDetail | null>(null);
  const [isCyclePlanLoadingPDA, setIsCyclePlanLoadingPDA] = useState(false);
  const [activeCycleBatchPDA, setActiveCycleBatchPDA] = useState<CycleCountBatchItem | null>(null);
  const [cycleCountInputPDA, setCycleCountInputPDA] = useState<number>(0);
  const [cycleCountLocationPDA, setCycleCountLocationPDA] = useState<string>('');
  const [mmsLocationsPDA, setMmsLocationsPDA] = useState<WarehouseLocationOption[]>([]);
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

  const loadCyclePlanDetailPDA = async (planId: number) => {
    setIsCyclePlanLoadingPDA(true);
    try {
      const data = await cycleCountService.getPlanDetail(planId);
      setSelectedCyclePlanPDA(data);
      if (data.batches && data.batches.length > 0) {
        setActiveCycleBatchPDA(data.batches[0]);
        setCycleCountInputPDA(data.batches[0].actualQuantity || data.batches[0].systemQuantity);
        setCycleCountLocationPDA(data.batches[0].locationCode || '');
      }
    } catch (err) {
      console.warn('PDA error loading cycle plan detail:', err);
    } finally {
      setIsCyclePlanLoadingPDA(false);
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
  const handleStartPickingOrder = (order: IssueRequest) => {
    setSelectedIssueRequest(order);
    setPickingItemIndex(0);
    const firstItem = order.items[0];
    setPickingQty(firstItem ? (firstItem.approvedQuantity || firstItem.requestedQuantity) : 0);
  };

  const handleConfirmPickStep = () => {
    if (!selectedIssueRequest) return;
    soundManager.playSuccessBeep();

    if (pickingItemIndex < selectedIssueRequest.items.length - 1) {
      const nextIndex = pickingItemIndex + 1;
      setPickingItemIndex(nextIndex);
      const nextItem = selectedIssueRequest.items[nextIndex];
      setPickingQty(nextItem ? (nextItem.approvedQuantity || nextItem.requestedQuantity) : 0);
      showBanner('info', `Đã xác nhận lấy món ${pickingItemIndex + 1}. Di chuyển sang món tiếp theo!`);
    } else {
      const pickingDetails = selectedIssueRequest.items.map(item => {
        const matchBatch = batches.find(b => b.materialId === item.materialId && b.quantity > 0) || batches[0];
        return {
          itemId: item.id,
          batchId: matchBatch ? matchBatch.id : '',
          quantity: item.approvedQuantity || item.requestedQuantity
        };
      }).filter(p => p.batchId !== '');

      issueGoods(selectedIssueRequest.id, pickingDetails);
      soundManager.playCompleteChime();
      showBanner('success', `Hoàn tất soạn toàn bộ đơn xuất ${selectedIssueRequest.code}!`);
      setSelectedIssueRequest(null);
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
        : 'bg-[#02180e] text-emerald-100 shadow-2xl border border-[#083a24]'
    }`}>
      
      {/* 📱 TOP HANDHELD DEVICE STATUS BAR (KỀM NGHĨA INDUSTRIAL PDA) */}
      <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b transition-colors ${
        isDarkMode 
          ? 'bg-zinc-950 border-zinc-800 text-zinc-300' 
          : 'bg-[#01120a] border-[#083a24] text-emerald-200'
      }`}>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold font-mono bg-[#007D3C] text-white shadow-sm">
            <Smartphone className="w-3.5 h-3.5" />
            <span>KỀM NGHĨA PDA</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
            <span className="hidden sm:inline text-emerald-700">|</span>
            <span className="font-bold text-white">{currentUser.fullName}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#063b25] text-emerald-300 text-[10px] border border-emerald-700/60">
              {currentUser.id} • {currentUser.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Online / Offline Status */}
          {isOnline ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>ONLINE</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/60 animate-pulse">
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span>OFFLINE (Đệm: {offlineQueueCount})</span>
            </div>
          )}

          {/* LAN Printer 10.17.16.102:8080 Status */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg font-mono text-[11px] bg-[#063b25] border border-emerald-700 text-[#F7941D]" title="Máy in tem nhãn HTTP LAN: 10.17.16.102:8080">
            <Printer className="w-3 h-3 text-[#F7941D]" />
            <span>10.17.16.102:8080</span>
          </div>

          {/* Battery */}
          <div className="hidden md:flex items-center gap-1 text-emerald-300 font-mono text-[11px] px-2 py-1 bg-[#063b25]/80 rounded-lg border border-emerald-700/60">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span>98%</span>
          </div>

          {/* OLED Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-zinc-900 border-zinc-700 text-amber-300 hover:bg-zinc-800'
                : 'bg-[#063b25] border-emerald-700 text-emerald-300 hover:bg-[#08482e]'
            }`}
            title={isDarkMode ? 'Chuyển sang Chế độ Sáng' : 'Chuyển sang Chế độ Nền Đen OLED Tương Phản Cao'}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-[#063b25] border-emerald-700 text-emerald-300'
                : 'bg-[#02180e] border-emerald-900 text-emerald-800'
            }`}
            title={soundEnabled ? 'Âm thanh máy quét: BẬT' : 'Âm thanh: TẮT'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {onExitToDesktop && (
            <button
              onClick={onExitToDesktop}
              className="px-3 py-1 bg-[#063b25] hover:bg-[#08482e] text-emerald-200 font-bold rounded-lg text-xs border border-emerald-700 cursor-pointer transition-colors"
            >
              Về Desktop
            </button>
          )}
        </div>
      </div>

      {/* 🔔 LIVE NOTIFICATION BANNER */}
      {statusBanner && (
        <div className={`px-4 py-2.5 text-xs font-extrabold flex items-center justify-between border-b ${
          statusBanner.type === 'success' ? 'bg-emerald-900 text-white border-emerald-700' :
          statusBanner.type === 'error' ? 'bg-rose-900 text-white border-rose-700' :
          'bg-[#063b25] text-emerald-100 border-emerald-600'
        }`}>
          <div className="flex items-center gap-2">
            {statusBanner.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> :
             statusBanner.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> :
             <Info className="w-4 h-4 text-[#F7941D] shrink-0" />}
            <span>{statusBanner.message}</span>
          </div>
          <button onClick={() => setStatusBanner(null)} className="cursor-pointer p-1">
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
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
              isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-[#06301d]/90 border-emerald-800/80'
            }`}>
              <div>
                <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2 font-mono">
                  <span>TRẠM QUÉT CẦM TAY KỀM NGHĨA (LASER 2D BARCODE)</span>
                </h2>
                <p className="text-xs text-emerald-300/80 mt-0.5">
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
                className="px-5 py-3 bg-[#007D3C] hover:bg-[#009647] active:scale-95 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/60 border border-emerald-600/40"
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
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between shadow-2xs">
                  <span>Chọn 1 đề nghị xuất kho đã duyệt để bắt đầu lộ trình lấy hàng:</span>
                  <span className="font-bold text-slate-900">{approvedIssueOrders.length} đơn sẵn sàng</span>
                </div>

                <div className="space-y-2">
                  {approvedIssueOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => handleStartPickingOrder(order)}
                      className="p-4 bg-white hover:bg-slate-100/70 border border-slate-200 rounded-xl cursor-pointer transition-all space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-slate-900">{order.code}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-200">
                          {order.type === 'PLANNING' ? 'Theo BOM' : 'Ngoài định mức'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{order.purpose}</h4>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Xưởng: <strong className="text-slate-700">{order.department}</strong></span>
                        <span className="font-bold text-slate-800">{order.items.length} món cần lấy →</span>
                      </div>
                    </div>
                  ))}
                  {approvedIssueOrders.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Hiện không có đơn xuất kho nào ở trạng thái Chờ soạn hàng.
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedIssueRequest && (
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="text-xs text-slate-500">Đang soạn đơn: </span>
                    <strong className="font-mono text-slate-900">{selectedIssueRequest.code}</strong>
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    MÓN {pickingItemIndex + 1} / {selectedIssueRequest.items.length}
                  </span>
                </div>

                {selectedIssueRequest.items[pickingItemIndex] && (() => {
                  const currentItem = selectedIssueRequest.items[pickingItemIndex];
                  const matchingBatch = batches.find(b => b.materialId === currentItem.materialId && b.quantity > 0) || batches[0];
                  
                  return (
                    <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                      {/* Target Location */}
                      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold block mb-1">
                          📍 VỊ TRÍ KỆ CẦN ĐẾN LẤY HÀNG:
                        </span>
                        <div className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                          {matchingBatch ? matchingBatch.locationCode : 'K01-T2-01'}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-1 block">
                          Kho: {matchingBatch ? matchingBatch.warehouse : 'Kho Tổng'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-500">Mã SKU: {currentItem.materialCode}</span>
                          <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Lô FIFO: {matchingBatch ? matchingBatch.batchNumber : 'BAT-01'}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900">{currentItem.materialName}</h4>
                      </div>

                      {/* Required Qty */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Số lượng cần lấy:</span>
                          <span className="text-lg font-black text-slate-900">
                            {currentItem.approvedQuantity || currentItem.requestedQuantity} {currentItem.unit}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPickingQty(Math.max(1, pickingQty - 1))}
                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base cursor-pointer"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-lg font-black text-slate-900 w-10 text-center">
                            {pickingQty}
                          </span>
                          <button
                            onClick={() => setPickingQty(pickingQty + 1)}
                            className="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-base cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => openScanner(
                            `Quét Mã Kệ hoặc Lô (${matchingBatch?.locationCode})`,
                            'ANY',
                            [
                              { code: matchingBatch?.locationCode || 'K01-T1-01', label: 'Vị trí Kệ' },
                              { code: matchingBatch?.batchNumber || 'BAT-01', label: 'Mã Lô' }
                            ],
                            (code) => {
                              showBanner('success', `Đã quét khớp mã: ${code}`);
                            }
                          )}
                          className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Barcode className="w-4 h-4" />
                          <span>QUÉT KIỂM TRA MÃ KỆ / MÃ LÔ</span>
                        </button>

                        <button
                          onClick={handleConfirmPickStep}
                          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {pickingItemIndex < selectedIssueRequest.items.length - 1
                              ? 'XÁC NHẬN LẤY & CHUYỂN MÓN TIẾP'
                              : 'HOÀN TẤT TOÀN BỘ ĐƠN XUẤT'}
                          </span>
                        </button>
                      </div>

                    </div>
                  );
                })()}
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
                </div>

                {/* STEPPER PROGRESS INDICATOR */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 dark:bg-zinc-800 rounded-2xl text-[11px] font-bold">
                  {/* Step 1 Tab */}
                  <div className={`py-2 px-1.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all ${
                    cycleCountLocationPDA 
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold' 
                      : 'bg-blue-600 text-white shadow-xs'
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
                      : 'bg-blue-600 text-white shadow-xs'
                  }`}>
                    {activeCycleBatchPDA ? <Check className="w-3.5 h-3.5" /> : <span>2.</span>}
                    <span className="truncate">Quét Batch</span>
                  </div>

                  {/* Step 3 Tab */}
                  <div className={`py-2 px-1.5 rounded-xl text-center flex items-center justify-center gap-1 transition-all ${
                    activeCycleBatchPDA && cycleCountLocationPDA
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 dark:text-zinc-600'
                  }`}>
                    <span>3.</span>
                    <span className="truncate">Đếm Số Lượng</span>
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    BƯỚC 1: QUÉT & XÁC ĐỊNH VỊ TRÍ Ô KỆ ĐANG ĐỨNG KIỂM
                ═════════════════════════════════════════════════════════════ */}
                <div className={`p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-2xs space-y-3 transition-all ${
                  !cycleCountLocationPDA 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-slate-200 dark:border-zinc-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> BƯỚC 1: QUÉT MÃ Ô KỆ (CSDL MMS1)
                    </span>
                    {cycleCountLocationPDA && (
                      <button
                        type="button"
                        onClick={() => {
                          setCycleCountLocationPDA('');
                          setActiveCycleBatchPDA(null);
                          setCycleCountInputPDA(0);
                          showBanner('info', 'Đã hủy chọn vị trí. Vui lòng quét ô kệ tiếp theo.');
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        Đổi Kệ Khác
                      </button>
                    )}
                  </div>

                  {cycleCountLocationPDA ? (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase block">
                          Đang đứng kiểm tại Ô Kệ:
                        </span>
                        <span className="font-mono text-lg font-extrabold text-emerald-900 dark:text-emerald-200">
                          {cycleCountLocationPDA}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ĐÃ XÁC ĐỊNH
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500 dark:text-zinc-400">
                        Quét mã vạch dán trên thanh dầm kệ (VD: 01-01011, 02-01032...) trước khi đếm các kiện hàng.
                      </p>

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
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                      >
                        <Barcode className="w-5 h-5" /> BẤM ĐỂ QUÉT MÃ VẠCH Ô KỆ
                      </button>

                      {/* Quick picker input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cycleCountLocationPDA}
                          onChange={e => setCycleCountLocationPDA(e.target.value)}
                          placeholder="Hoặc gõ mã ô kệ (VD: 01-01011)..."
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-zinc-700 rounded-xl font-mono uppercase font-bold text-xs bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100"
                        />
                        {cycleCountLocationPDA && (
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.playSuccessBeep();
                              showBanner('success', `Đã xác nhận vị trí Kệ: ${cycleCountLocationPDA}`);
                            }}
                            className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                          >
                            Chọn
                          </button>
                        )}
                      </div>

                      {/* Quick Location Chips from MMS1 */}
                      {mmsLocationsPDA.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold block">
                            GỢI Ý Ô KỆ THỰC TẾ (MMS1):
                          </span>
                          <div className="flex gap-1.5 overflow-x-auto pb-1">
                            {mmsLocationsPDA.slice(0, 8).map(loc => (
                              <button
                                key={loc.locationCode}
                                type="button"
                                onClick={() => {
                                  setCycleCountLocationPDA(loc.locationCode);
                                  soundManager.playSuccessBeep();
                                  showBanner('success', `Đã chọn vị trí: ${loc.locationCode}`);
                                }}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-mono font-bold text-slate-700 dark:text-zinc-300 shrink-0 cursor-pointer"
                              >
                                {loc.locationCode}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ═════════════════════════════════════════════════════════════
                    BƯỚC 2: QUÉT MÃ LÔ BATCH CẦN KIỂM ĐẾM
                ═════════════════════════════════════════════════════════════ */}
                {cycleCountLocationPDA && (
                  <div className={`p-4 bg-white dark:bg-zinc-900 border rounded-2xl shadow-2xs space-y-3 transition-all ${
                    !activeCycleBatchPDA 
                      ? 'border-blue-500 ring-2 ring-blue-500/20' 
                      : 'border-slate-200 dark:border-zinc-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> BƯỚC 2: QUÉT MÃ LÔ BATCH CẦN ĐẾM
                      </span>
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
                              showBanner('success', `Đã chọn Batch #${found.batchId}`);
                            } else {
                              soundManager.playErrorBuzzer();
                              showBanner('error', `Không tìm thấy Batch ${code} trong kế hoạch này.`);
                            }
                          }
                        )}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> Quét Barcode
                      </button>
                    </div>

                    {/* Danh sách batch cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedCyclePlanPDA.batches.map(b => {
                        const isSelected = activeCycleBatchPDA?.detailId === b.detailId;
                        return (
                          <div
                            key={b.detailId}
                            onClick={() => {
                              setActiveCycleBatchPDA(b);
                              setCycleCountInputPDA(0);
                              soundManager.playSuccessBeep();
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20'
                                : b.isCounted
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                                Batch #{b.batchId}
                              </span>
                              {b.isCounted ? (
                                <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-[10px] font-bold">
                                  Đã đếm {b.countTimes} lần
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-400 rounded text-[10px]">
                                  Chưa đếm
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-zinc-400">
                              <span>Tồn máy: <strong>{b.systemQuantity.toLocaleString()} {b.unit}</strong></span>
                              {b.isCounted && (
                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                  Đã ghi: {b.actualQuantity.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ═════════════════════════════════════════════════════════════
                    BƯỚC 3: NHẬP SỐ LƯỢNG THỰC TẾ 1 THÙNG & TÁCH LÔ CON
                ═════════════════════════════════════════════════════════════ */}
                {cycleCountLocationPDA && activeCycleBatchPDA && (
                  <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-blue-500 rounded-2xl shadow-md space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                      <div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase block">
                          BƯỚC 3: ĐẾM THÙNG THỰC TẾ CHO BATCH:
                        </span>
                        <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
                          #{activeCycleBatchPDA.batchId}
                        </span>
                        {activeCycleBatchPDA.bravoId && (
                          <span className="text-xs text-slate-500 font-mono ml-1.5">
                            ({activeCycleBatchPDA.bravoId})
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Vị trí kiểm:</span>
                        <span className="font-mono text-xs font-extrabold text-blue-700 dark:text-blue-400">
                          {cycleCountLocationPDA}
                        </span>
                      </div>
                    </div>

                    {/* Progress of current batch */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-600 dark:text-zinc-400">Tồn máy snapshot:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{activeCycleBatchPDA.systemQuantity.toLocaleString()} {activeCycleBatchPDA.unit}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-slate-600 dark:text-zinc-400">Đã đếm lũy kế:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">{activeCycleBatchPDA.actualQuantity.toLocaleString()} {activeCycleBatchPDA.unit} ({activeCycleBatchPDA.countTimes} lần đếm)</span>
                      </div>
                    </div>

                    {/* Touch Counter Component */}
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl space-y-3">
                      <label className="text-[11px] uppercase font-bold text-slate-700 dark:text-zinc-300 block">
                        Số lượng thực tế trong thùng / kiện này ({activeCycleBatchPDA.unit || 'Cái'}):
                      </label>

                      {/* Main Stepper Input */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCycleCountInputPDA(Math.max(0, cycleCountInputPDA - 1))}
                          className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-white font-extrabold text-xl cursor-pointer shadow-2xs active:scale-95"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="any"
                          value={cycleCountInputPDA}
                          onChange={e => setCycleCountInputPDA(parseFloat(e.target.value) || 0)}
                          className="flex-1 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-center font-mono text-3xl font-extrabold text-blue-700 dark:text-blue-400 py-2 rounded-xl focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setCycleCountInputPDA(cycleCountInputPDA + 1)}
                          className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-white font-extrabold text-xl cursor-pointer shadow-2xs active:scale-95"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick Presets for Warehouse Staff */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {[1, 5, 10, 50, 100].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCycleCountInputPDA(cycleCountInputPDA + val)}
                            className="py-1.5 bg-white dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 cursor-pointer"
                          >
                            +{val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="button"
                      disabled={cycleCountInputPDA <= 0}
                      onClick={async () => {
                        try {
                          const res = await cycleCountService.logCount(selectedCyclePlanPDA.plan!.planId, {
                            detailId: activeCycleBatchPDA.detailId,
                            batchId: activeCycleBatchPDA.batchId,
                            actualQuantity: cycleCountInputPDA,
                            unit: activeCycleBatchPDA.unit,
                            locationCode: cycleCountLocationPDA || activeCycleBatchPDA.locationCode
                          });
                          soundManager.playSuccessBeep();
                          const newBatchObj = {
                            newBatchId: res.newBatchId || 0,
                            parentBatchId: activeCycleBatchPDA.batchId,
                            materialId: selectedCyclePlanPDA.plan!.materialId,
                            materialName: selectedCyclePlanPDA.plan!.materialName || '',
                            quantity: cycleCountInputPDA,
                            unit: activeCycleBatchPDA.unit || selectedCyclePlanPDA.plan!.unit || '',
                            locationCode: cycleCountLocationPDA || activeCycleBatchPDA.locationCode || 'Hiện trường',
                            createdAt: new Date().toLocaleTimeString('vi-VN')
                          };
                          setLastCreatedChildBatchPDA(newBatchObj);
                          showBanner('success', `Đã ghi nhận ${cycleCountInputPDA} ${activeCycleBatchPDA.unit || ''}! Lô con mới: #${res.newBatchId}`);
                          setCycleCountInputPDA(0);
                          loadCyclePlanDetailPDA(selectedCyclePlanPDA.plan!.planId);
                        } catch (err: any) {
                          soundManager.playErrorBuzzer();
                          showBanner('error', err.message || 'Lỗi ghi nhận kiểm đếm.');
                        }
                      }}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>XÁC NHẬN SỐ ĐẾM & TÁCH THÙNG NÀY</span>
                    </button>
                  </div>
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
                        setActiveBarcodePrint({
                          materialCode: lastCreatedChildBatchPDA.materialId,
                          materialName: lastCreatedChildBatchPDA.materialName,
                          quantity: lastCreatedChildBatchPDA.quantity,
                          unit: lastCreatedChildBatchPDA.unit,
                          locationCode: lastCreatedChildBatchPDA.locationCode,
                          poNumber: `CYCLE-COUNT (Lô Con #${lastCreatedChildBatchPDA.newBatchId})`,
                          expiryDate: 'N/A'
                        });
                        showBanner('info', `Đang gửi HTTP POST in Lô #${lastCreatedChildBatchPDA.newBatchId} đến 10.17.16.102:8080...`);
                        const printRes = await printService.sendPrintLabel({
                          batch: lastCreatedChildBatchPDA.newBatchId,
                          msnv: currentUser?.username || currentUser?.id || '00',
                          kho: currentUser?.department || 'K01'
                        });
                        showBanner('success', printRes.message);
                      }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
                    >
                      <Printer className="w-4 h-4" />
                      <span>IN TEM LÔ CON MỚI (# {lastCreatedChildBatchPDA.newBatchId}) DÁN THÙNG</span>
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
                                  {new Date(log.createdAt).toLocaleTimeString()}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  <button
                                    type="button"
                                    title="In tem mã vạch dán thùng này (10.17.16.102:8080)"
                                    onClick={async () => {
                                      setActiveBarcodePrint({
                                        materialCode: selectedCyclePlanPDA.plan!.materialId,
                                        materialName: selectedCyclePlanPDA.plan!.materialName,
                                        quantity: log.quantity,
                                        unit: log.unit || selectedCyclePlanPDA.plan!.unit,
                                        locationCode: log.locationCode || 'Hiện trường',
                                        poNumber: `CYCLE-COUNT (Lô Con #${log.batchId})`,
                                        expiryDate: 'N/A'
                                      });
                                      showBanner('info', `Đang gửi HTTP POST in Lô #${log.batchId} đến 10.17.16.102:8080...`);
                                      const printRes = await printService.sendPrintLabel({
                                        batch: log.batchId,
                                        msnv: currentUser?.username || currentUser?.id || '00',
                                        kho: currentUser?.department || 'K01'
                                      });
                                      showBanner('success', printRes.message);
                                    }}
                                    className="p-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
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
