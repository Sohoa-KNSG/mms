import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Barcode,
  Package,
  Layers,
  MapPin,
  Check,
  X,
  FileCheck,
  ChevronRight,
  ArrowRight,
  Loader2,
  Calendar,
  Building2,
  AlertCircle,
  Trash2,
  Scale
} from 'lucide-react';
import { useWarehouse } from '../../../app/providers/warehouseStore';
import {
  cycleCountService,
  CycleCountPlanSummary,
  CycleCountPlanDetail,
  CycleCountBatchItem,
  CycleCountMaterialOption,
  WarehouseLocationOption
} from '../../../features/cycle-count/api/cycleCountApi';
import { printService } from '../../../infrastructure/printing/printClient';
import { formatDate, formatTime, formatDateTime } from '../../../shared/utils/dateUtils';
import { HandheldScannerModal } from '../../handheld/components/HandheldScannerModal';

export type CyclePlanStatus = 'COUNTING' | 'PENDING_APPROVAL' | 'APPROVED';

export const getPlanStatus = (plan?: { statusCode?: string | null; approvedBy?: string | null; finishedAt?: string | null } | null): CyclePlanStatus => {
  if (!plan) return 'COUNTING';
  const s = String(plan.statusCode ?? '').trim().toLowerCase();
  if (s === '2' || s === 'approved' || s === 'done' || s === 'hoan_thanh') return 'APPROVED';
  if (s === '1' || s === 'pending_approval' || s === 'cho_duyet' || s === 'da_kiem_xong') return 'PENDING_APPROVAL';
  return 'COUNTING';
};

export const getPlanStatusBadge = (status: CyclePlanStatus) => {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'ĐÃ DUYỆT (CHỐT SỔ)',
        shortLabel: 'Đã Duyệt',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
        dotClass: 'bg-emerald-500'
      };
    case 'PENDING_APPROVAL':
      return {
        label: 'ĐÃ KIỂM XONG (CHỜ DUYỆT)',
        shortLabel: 'Chờ Duyệt',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
        dotClass: 'bg-blue-500 animate-pulse'
      };
    case 'COUNTING':
    default:
      return {
        label: 'ĐANG KIỂM ĐẾM',
        shortLabel: 'Đang Đếm',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
        dotClass: 'bg-amber-500'
      };
  }
};

export const isPlanFinished = (plan?: { statusCode?: string | null; approvedBy?: string | null; finishedAt?: string | null } | null): boolean => {
  const st = getPlanStatus(plan);
  return st === 'APPROVED';
};

export const CycleCountModule: React.FC = () => {
  const { currentUser, setActiveBarcodePrint } = useWarehouse();

  // Cycle Plans state
  const [cyclePlans, setCyclePlans] = useState<CycleCountPlanSummary[]>([]);
  const [cyclePlanSearch, setCyclePlanSearch] = useState('');
  const [cyclePlanFilterStatus, setCyclePlanFilterStatus] = useState<string>('ALL');
  const [isCyclePlansLoading, setIsCyclePlansLoading] = useState(false);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<CycleCountPlanDetail | null>(null);
  const [isPlanDetailLoading, setIsPlanDetailLoading] = useState(false);

  // Modal 1: Create Plan
  const [isCreatingCyclePlan, setIsCreatingCyclePlan] = useState(false);
  const [materialOptions, setMaterialOptions] = useState<CycleCountMaterialOption[]>([]);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedMaterialOption, setSelectedMaterialOption] = useState<CycleCountMaterialOption | null>(null);
  const [newPlanMaterialId, setNewPlanMaterialId] = useState('');
  const [newPlanBookQty, setNewPlanBookQty] = useState<number>(0);
  const [isCreatingPlanSubmitting, setIsCreatingPlanSubmitting] = useState(false);

  // Modal 2: Count and Split Batch
  const [activeCountBatch, setActiveCountBatch] = useState<CycleCountBatchItem | null>(null);
  const [countActualQty, setCountActualQty] = useState<number>(0);
  const [countLocationCode, setCountLocationCode] = useState<string>('');
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocationOption[]>([]);
  const [isSubmittingCount, setIsSubmittingCount] = useState(false);

  // Sticky / Remember Location for consecutive box counts
  const [lastUsedLocationCode, setLastUsedLocationCode] = useState<string>(() => {
    try {
      return sessionStorage.getItem('mms_last_count_location') || '';
    } catch {
      return '';
    }
  });
  const [rememberLocation, setRememberLocation] = useState(true);
  const [isLocationScannerOpen, setIsLocationScannerOpen] = useState(false);

  // Success Created Child Batch Notification
  const [lastCreatedChildBatch, setLastCreatedChildBatch] = useState<{
    newBatchId: number;
    parentBatchId: number;
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    locationCode: string;
    createdAt: string;
  } | null>(null);

  // Active View Tab inside Plan
  const [planSubTab, setPlanSubTab] = useState<'batches' | 'logs' | 'reconciliation'>('batches');

  const loadCyclePlans = async (search?: string) => {
    setIsCyclePlansLoading(true);
    try {
      const data = await cycleCountService.getPlans(search);
      setCyclePlans(data || []);
      if (data && data.length > 0 && !selectedPlanDetail) {
        loadPlanDetail(data[0].planId);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách kế hoạch kiểm kê:', err);
    } finally {
      setIsCyclePlansLoading(false);
    }
  };

  const loadPlanDetail = async (planId: number) => {
    setIsPlanDetailLoading(true);
    try {
      const data = await cycleCountService.getPlanDetail(planId);
      setSelectedPlanDetail(data);
    } catch (err) {
      console.warn('Lỗi tải chi tiết kế hoạch kiểm kê:', err);
    } finally {
      setIsPlanDetailLoading(false);
    }
  };

  const loadMaterialOptions = async (query?: string) => {
    try {
      const data = await cycleCountService.getMaterials(query);
      setMaterialOptions(data || []);
    } catch (err) {
      console.warn('Lỗi tải danh mục vật tư kiểm kê:', err);
    }
  };

  const loadWarehouseLocations = async () => {
    try {
      const data = await cycleCountService.getLocations();
      setWarehouseLocations(data || []);
    } catch (err) {
      console.warn('Lỗi tải danh mục ô kệ kho:', err);
    }
  };

  useEffect(() => {
    loadCyclePlans(cyclePlanSearch);
    loadWarehouseLocations();
  }, []);

  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanMaterialId.trim()) {
      alert('Vui lòng chọn hoặc nhập mã vật tư cần kiểm kê!');
      return;
    }

    setIsCreatingPlanSubmitting(true);
    try {
      const res = await cycleCountService.createPlan({
        materialId: newPlanMaterialId.trim(),
        bookQuantity: newPlanBookQty > 0 ? newPlanBookQty : 0
      });

      alert(`Đã khởi tạo thành công Kế hoạch kiểm kê #${res.planId} cho vật tư [${newPlanMaterialId}] với ${res.batchCount || 0} lô snapshot từ MMS1!`);
      setIsCreatingCyclePlan(false);
      loadCyclePlans(cyclePlanSearch);
      if (res.planId) {
        loadPlanDetail(res.planId);
      }
    } catch (err: any) {
      alert('Lỗi tạo kế hoạch kiểm kê: ' + (err.message || err));
    } finally {
      setIsCreatingPlanSubmitting(false);
    }
  };

  const handleOpenCountModal = (batch: CycleCountBatchItem) => {
    setActiveCountBatch(batch);
    setCountActualQty(0);

    // Ưu tiên:
    // 1. Nếu có rememberLocation và lastUsedLocationCode -> giữ nguyên vị trí đã chọn trước đó
    // 2. Nếu batch có locationCode chuẩn trong danh mục -> dùng batch.locationCode
    // 3. Nếu không -> dùng vị trí đầu tiên trong danh mục warehouseLocations
    let targetLoc = '';
    if (rememberLocation && lastUsedLocationCode) {
      targetLoc = lastUsedLocationCode;
    } else if (batch.locationCode) {
      targetLoc = batch.locationCode;
    } else if (warehouseLocations.length > 0) {
      targetLoc = warehouseLocations[0].locationCode;
    }
    setCountLocationCode(targetLoc);
  };

  const handleLogCountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanDetail?.plan || !activeCountBatch) return;

    if (countActualQty <= 0) {
      alert('Số lượng thực đếm của từng thùng phải lớn hơn 0! (Các lô/thùng không đếm hoặc bằng 0 sẽ được tự động xử lý khi Chốt Kiểm Kê)');
      return;
    }

    setIsSubmittingCount(true);
    try {
      const res = await cycleCountService.logCount(selectedPlanDetail.plan.planId, {
        detailId: activeCountBatch.detailId,
        batchId: activeCountBatch.batchId,
        actualQuantity: countActualQty,
        locationCode: countLocationCode || undefined
      });

      if (rememberLocation && countLocationCode) {
        setLastUsedLocationCode(countLocationCode);
        try {
          sessionStorage.setItem('mms_last_count_location', countLocationCode);
        } catch {}
      }

      const countedQty = countActualQty;
      const childBatchId = res.newBatchId || activeCountBatch.batchId;
      const targetLocDesc = warehouseLocations.find(l => l.locationCode === countLocationCode)?.description || countLocationCode;
      
      setLastCreatedChildBatch({
        newBatchId: childBatchId,
        parentBatchId: activeCountBatch.batchId,
        materialId: selectedPlanDetail.plan.materialId,
        materialName: selectedPlanDetail.plan.materialName || '',
        quantity: countedQty,
        unit: activeCountBatch.unit || selectedPlanDetail.plan.unit || '',
        locationCode: targetLocDesc || activeCountBatch.locationName || activeCountBatch.locationCode || 'Hiện trường',
        createdAt: formatTime(new Date(), true)
      });

      // 1. Reset số lượng kiểm về 0
      setCountActualQty(0);

      // 2. Xuất hiện luôn pop up in tem
      setActiveBarcodePrint({
        title: 'TEM NHÃN VẬT TƯ & LÔ HÀNG',
        batchNumber: String(childBatchId),
        batchId: childBatchId,
        materialCode: selectedPlanDetail.plan.materialId,
        materialName: selectedPlanDetail.plan.materialName || '',
        quantity: countedQty,
        unit: activeCountBatch.unit || selectedPlanDetail.plan.unit || '',
        locationCode: targetLocDesc || activeCountBatch.locationName || activeCountBatch.locationCode || 'Hiện trường',
        poNumber: `CYCLE-COUNT (Lô Con #${childBatchId})`,
        expiryDate: 'N/A'
      });
        console.log('DEBUG: setActiveBarcodePrint called', { title: 'TEM NHÃN VẬT TƯ & LÔ HÀNG', batchId: childBatchId, materialCode: selectedPlanDetail.plan.materialId, quantity: countedQty });
      setActiveCountBatch(null);
      loadPlanDetail(selectedPlanDetail.plan.planId);
      loadCyclePlans(cyclePlanSearch);
    } catch (err: any) {
      alert('Lỗi ghi nhận kiểm đếm: ' + (err.message || err));
    } finally {
      setIsSubmittingCount(false);
    }
  };

  const handleSubmitCounted = async (planId: number) => {
    if (!window.confirm('Xác nhận BÁO CÁO ĐÃ KIỂM XONG để chuyển sang trạng thái CHỜ TRƯỞNG PHÒNG DUYỆT?')) return;

    setIsSubmittingCount(true);
    try {
      const res = await cycleCountService.submitCounted(planId);
      alert(res.message || 'Đã gửi báo cáo kiểm xong thành công.');
      loadPlanDetail(planId);
      loadCyclePlans(cyclePlanSearch);
    } catch (err: any) {
      alert('Lỗi gửi báo cáo: ' + (err.message || err));
    } finally {
      setIsSubmittingCount(false);
    }
  };

  const handleApprovePlan = async (planId: number) => {
    if (!window.confirm('TRƯỞNG PHÒNG PHÊ DUYỆT: Bạn có chắc chắn muốn PHÊ DUYỆT & CHỐT SỔ kế hoạch kiểm kê này? Những lô gốc còn dư số lượng sẽ tự động ghi giảm tồn do thất thoát (Chốt cặn).')) return;

    setIsSubmittingCount(true);
    try {
      const res = await cycleCountService.approvePlan(planId);
      alert(res.message || 'Trưởng phòng đã phê duyệt và chốt sổ kế hoạch thành công.');
      loadPlanDetail(planId);
      loadCyclePlans(cyclePlanSearch);
    } catch (err: any) {
      alert('Lỗi phê duyệt kế hoạch: ' + (err.message || err));
    } finally {
      setIsSubmittingCount(false);
    }
  };

  const handleReopenPlan = async (planId: number) => {
    if (!window.confirm('TRƯỞNG PHÒNG YÊU CẦU KIỂM LẠI: Mở lại kế hoạch kiểm kê này về trạng thái ĐANG KIỂM ĐẾM để nhân viên quét đếm lại?')) return;

    setIsSubmittingCount(true);
    try {
      const res = await cycleCountService.reopenPlan(planId);
      alert(res.message || 'Đã mở lại kế hoạch kiểm kê để nhân viên quét đếm lại.');
      loadPlanDetail(planId);
      loadCyclePlans(cyclePlanSearch);
    } catch (err: any) {
      alert('Lỗi mở lại kế hoạch: ' + (err.message || err));
    } finally {
      setIsSubmittingCount(false);
    }
  };

  const handleDeletePlan = async (planId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA Kế hoạch kiểm kê #${planId}? Thao tác này chỉ áp dụng khi kế hoạch chưa phát sinh lượt đếm thực tế nào.`)) return;

    try {
      const res = await cycleCountService.deletePlan(planId);
      alert(res.message || 'Đã xóa kế hoạch kiểm kê thành công.');
      if (selectedPlanDetail?.plan?.planId === planId) {
        setSelectedPlanDetail(null);
      }
      await loadCyclePlans();
    } catch (err: any) {
      alert('Lỗi xóa kế hoạch: ' + (err.message || err));
    }
  };

  const filteredPlans = cyclePlans.filter(p => {
    if (cyclePlanFilterStatus !== 'ALL') {
      const st = getPlanStatus(p);
      if (cyclePlanFilterStatus !== st) return false;
    }
    if (cyclePlanSearch) {
      const q = cyclePlanSearch.toLowerCase();
      return (
        p.planId.toString().includes(q) ||
        p.materialId.toLowerCase().includes(q) ||
        (p.materialName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countingCount = cyclePlans.filter(p => getPlanStatus(p) === 'COUNTING').length;
  const pendingApprovalCount = cyclePlans.filter(p => getPlanStatus(p) === 'PENDING_APPROVAL').length;
  const approvedCount = cyclePlans.filter(p => getPlanStatus(p) === 'APPROVED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-[#007D3C] text-xs font-bold uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" /> Cycle Counting & Realtime Audit (Kềm Nghĩa WMS)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Kiểm Kê Xoay Vòng Cycle Count Theo Vật Tư (UC-27 / INV-08)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình 3 bước: Lập kế hoạch & Quét đếm PDA ➔ Nhân viên báo kiểm xong ➔ Trưởng phòng phê duyệt & Chốt sổ cặn thất thoát.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadCyclePlans(cyclePlanSearch)}
            disabled={isCyclePlansLoading}
            className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCyclePlansLoading ? 'animate-spin' : ''}`} />
            Làm mới ({cyclePlans.length})
          </button>
          <button
            onClick={() => {
              setIsCreatingCyclePlan(true);
              setSelectedMaterialOption(null);
              setNewPlanMaterialId('');
              setNewPlanBookQty(0);
              setMaterialSearchQuery('');
              loadMaterialOptions();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Lập Kế Hoạch Kiểm Kê Mới (B1)
          </button>
        </div>
      </div>

      {/* Smartlog Top Metrics Strip: 4 Boxes for 3-Step Lifecycle */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Kế Hoạch</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 mt-0.5 block">
              {cyclePlans.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* 1. Counting */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">1. Đang Kiểm Đếm</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-700 mt-0.5 block">
              {countingCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Pending Manager Approval */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">2. Chờ Trưởng Phòng Duyệt</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-blue-700 mt-0.5 block">
              {pendingApprovalCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Approved & Closed */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#007D3C] uppercase tracking-wider block">3. Đã Duyệt & Chốt Sổ</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#007D3C] mt-0.5 block">
              {approvedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#007D3C] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Instant Print Label Banner Notification */}
      {lastCreatedChildBatch && (
        <div className="bg-emerald-900 text-white p-4 sm:p-5 rounded-2xl border border-emerald-700 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-extrabold shadow-sm">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  ĐÃ TÁCH LÔ & GHI NHẬN KIỂM ĐẾM THÀNH CÔNG (B3)
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-700 text-emerald-100 px-2 py-0.5 rounded">
                  Lô Mới: #{lastCreatedChildBatch.newBatchId}
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-1">
                Lô gốc #{lastCreatedChildBatch.parentBatchId} ➔ Tách {lastCreatedChildBatch.quantity} {lastCreatedChildBatch.unit} [{lastCreatedChildBatch.materialId} - {lastCreatedChildBatch.materialName}] vào vị trí: <span className="font-mono text-emerald-300">{lastCreatedChildBatch.locationCode}</span>
              </p>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Tem kiểm kê đã sẵn sàng gửi tới máy in mạng LAN 10.17.16.102:8080 để dán lên thùng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={async () => {
                const res = await printService.sendPrintLabel({
                  batch: lastCreatedChildBatch.newBatchId,
                  msnv: currentUser?.id || '00',
                  kho: 'vt'
                });
                console.log('DEBUG: sendPrintLabel called for batch', lastCreatedChildBatch.newBatchId);
                alert(res.message);
              }}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 border border-emerald-300"
            >
              <Printer className="w-5 h-5" /> In Tem Lô #{lastCreatedChildBatch.newBatchId} (10.17.16.102:8080)
            </button>
            <button
              onClick={() => setLastCreatedChildBatch(null)}
              className="p-2.5 text-emerald-300 hover:text-white rounded-xl hover:bg-emerald-800/60 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Master Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Plans */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Danh Sách Kế Hoạch ({filteredPlans.length})</span>
            <div className="flex items-center gap-1">
              {[
                { key: 'ALL', label: 'Tất cả' },
                { key: 'COUNTING', label: 'Đang đếm' },
                { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
                { key: 'APPROVED', label: 'Đã duyệt' }
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => setCyclePlanFilterStatus(st.key)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    cyclePlanFilterStatus === st.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={cyclePlanSearch}
              onChange={e => {
                setCyclePlanSearch(e.target.value);
              }}
              placeholder="Tìm theo Mã Kế Hoạch, Mã SKU, Tên vật tư..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
            />
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {isCyclePlansLoading && cyclePlans.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Đang tải kế hoạch kiểm kê...</p>
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Không tìm thấy kế hoạch kiểm kê nào phù hợp.
              </div>
            ) : (
              filteredPlans.map(plan => {
                const isSelected = selectedPlanDetail?.plan?.planId === plan.planId;
                const status = getPlanStatus(plan);
                const badge = getPlanStatusBadge(status);
                const diff = (plan.actualQuantity || 0) - (plan.bookQuantity || 0);

                return (
                  <div
                    key={plan.planId}
                    onClick={() => loadPlanDetail(plan.planId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/40 border-[#007D3C] ring-2 ring-[#007D3C]/20 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 text-white">
                          KH #{plan.planId}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDate(plan.createdAt)}
                        </span>
                        {(status === 'COUNTING' && (plan.countLogCount || 0) === 0) && (
                          <button
                            onClick={(e) => handleDeletePlan(plan.planId, e)}
                            title="Xóa kế hoạch (chưa có lượt đếm)"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-900 truncate">
                      [{plan.materialId}] {plan.materialName || 'Vật tư'}
                    </div>

                    {/* Progress Stats */}
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="text-slate-500">Sổ sách: </span>
                        <span className="font-mono font-bold text-slate-800">{plan.bookQuantity} {plan.unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Thực đếm: </span>
                        <span className="font-mono font-bold text-[#007D3C]">{plan.actualQuantity || 0} {plan.unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Lệch: </span>
                        <span className={`font-mono font-bold ${
                          diff === 0 ? 'text-[#007D3C]' : diff > 0 ? 'text-[#007D3C]' : 'text-rose-600'
                        }`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Plan Detail & Batches Workspace */}
        <div className="lg:col-span-7 space-y-4">
          {isPlanDetailLoading && !selectedPlanDetail ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-[#007D3C] mx-auto mb-2" />
              <p className="text-xs text-slate-500">Đang tải chi tiết các lô hàng kiểm kê...</p>
            </div>
          ) : !selectedPlanDetail?.plan ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
              Vui lòng chọn một kế hoạch kiểm kê ở danh sách bên trái.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Header Card with 3-Step Actions */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#007D3C] uppercase tracking-wider">
                        CHI TIẾT KẾ HOẠCH #{selectedPlanDetail.plan.planId}
                      </span>
                      {(() => {
                        const status = getPlanStatus(selectedPlanDetail.plan);
                        const badge = getPlanStatusBadge(status);
                        return (
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.badgeClass}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                      [{selectedPlanDetail.plan.materialId}] {selectedPlanDetail.plan.materialName || 'Vật tư'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const status = getPlanStatus(selectedPlanDetail.plan);
                      const planId = selectedPlanDetail.plan.planId;

                      if (status === 'COUNTING') {
                        return (
                          <>
                            {(selectedPlanDetail.logs?.length || 0) === 0 && (
                              <button
                                onClick={() => handleDeletePlan(planId)}
                                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs"
                                title="Xóa kế hoạch kiểm kê này khi chưa có lượt đếm"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa Kế Hoạch
                              </button>
                            )}
                            <button
                              onClick={() => handleSubmitCounted(planId)}
                              disabled={isSubmittingCount}
                              className="px-4 py-2 bg-[#007D3C] hover:bg-[#006631] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-600"
                              title="Báo cáo đã quét đếm xong ngoài hiện trường, chuyển sang chờ Trưởng phòng duyệt"
                            >
                              <FileCheck className="w-3.5 h-3.5" /> Báo Cáo Đã Kiểm Xong (Chờ Duyệt)
                            </button>
                          </>
                        );
                      }

                      if (status === 'PENDING_APPROVAL') {
                        return (
                          <>
                            <button
                              onClick={() => handleReopenPlan(planId)}
                              disabled={isSubmittingCount}
                              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 active:scale-95 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                              title="Trưởng phòng yêu cầu mở lại kế hoạch để nhân viên quét đếm lại"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Yêu Cầu Kiểm Lại
                            </button>
                            <button
                              onClick={() => handleApprovePlan(planId)}
                              disabled={isSubmittingCount}
                              className="px-4 py-2 bg-[#007D3C] hover:bg-[#009647] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                              title="Trưởng phòng phê duyệt đối soát và chốt cặn thất thoát vào sổ cái"
                            >
                              <Check className="w-3.5 h-3.5" /> Trưởng Phòng Phê Duyệt & Chốt Sổ (INV-09)
                            </button>
                          </>
                        );
                      }

                      // APPROVED
                      return (
                        <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-[#007D3C] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-[#007D3C]" />
                          <span>Đã Phê Duyệt & Chốt Sổ (Bởi: <b>{selectedPlanDetail.plan.approvedBy || 'Trưởng phòng kho'}</b>)</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* 4-KPI Metric Box inside Detail */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Tồn Sổ Sách (Snapshot)</span>
                    <span className="text-base font-mono font-extrabold text-slate-900 mt-0.5 block">
                      {selectedPlanDetail.plan.bookQuantity} {selectedPlanDetail.plan.unit}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-[#007D3C] uppercase block">Thực Tế Đã Đếm</span>
                    <span className="text-base font-mono font-extrabold text-[#007D3C] mt-0.5 block">
                      {selectedPlanDetail.plan.actualQuantity || 0} {selectedPlanDetail.plan.unit}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Số Lô Hàng (Batches)</span>
                    <span className="text-base font-mono font-extrabold text-slate-900 mt-0.5 block">
                      {selectedPlanDetail.batches?.length || 0} Lô
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border ${
                    ((selectedPlanDetail.plan.actualQuantity || 0) - selectedPlanDetail.plan.bookQuantity) === 0
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    <span className="text-[10px] font-bold uppercase block">Chênh Lệch</span>
                    <span className="text-base font-mono font-extrabold mt-0.5 block">
                      {((selectedPlanDetail.plan.actualQuantity || 0) - selectedPlanDetail.plan.bookQuantity) > 0
                        ? `+${(selectedPlanDetail.plan.actualQuantity || 0) - selectedPlanDetail.plan.bookQuantity}`
                        : (selectedPlanDetail.plan.actualQuantity || 0) - selectedPlanDetail.plan.bookQuantity} {selectedPlanDetail.plan.unit}
                    </span>
                  </div>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <button
                    onClick={() => setPlanSubTab('batches')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      planSubTab === 'batches'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Danh Sách Lô Snapshot ({selectedPlanDetail.batches?.length || 0})
                  </button>
                  <button
                    onClick={() => setPlanSubTab('logs')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      planSubTab === 'logs'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Nhật Ký Quét Thùng & Lô Con ({selectedPlanDetail.logs?.length || 0})
                  </button>
                  <button
                    onClick={() => setPlanSubTab('reconciliation')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      planSubTab === 'reconciliation'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Báo Cáo Đối Soát & Thất Thoát
                  </button>
                </div>

                {/* Tab 1: Batch List */}
                {planSubTab === 'batches' && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                            <th className="py-2.5 px-3">Mã Lô (Batch ID)</th>
                            <th className="py-2.5 px-3">Vị Trí Kệ</th>
                            <th className="py-2.5 px-3 text-right">SL Sổ Sách</th>
                            <th className="py-2.5 px-3 text-right">SL Thực Đếm</th>
                            <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                            <th className="py-2.5 px-3 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedPlanDetail.batches?.map(batch => {
                            const isCounted = batch.isCounted || (batch.actualQuantity !== undefined && batch.actualQuantity !== null && batch.actualQuantity > 0);
                            const isPlanDone = isPlanFinished(selectedPlanDetail.plan);
                            return (
                              <tr key={batch.batchId} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  #{batch.batchId}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-700">
                                  <div className="flex flex-col items-start gap-0.5">
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#007D3C] border border-emerald-200 text-[11px] font-bold">
                                      {batch.locationName || batch.locationCode || 'Chưa gán'}
                                    </span>
                                    {batch.locationCode && batch.locationName && batch.locationCode !== batch.locationName && (
                                      <span className="text-[10px] text-slate-400 font-mono pl-0.5">
                                        ({batch.locationCode})
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                  {batch.systemQuantity} {batch.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#007D3C]">
                                  {batch.actualQuantity !== undefined && batch.actualQuantity !== null ? batch.actualQuantity : 0} {batch.unit}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    isCounted
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {isCounted ? 'Đã Đếm' : 'Chưa Đếm'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5 ml-auto">
                                    <button
                                      type="button"
                                      onClick={() => setActiveBarcodePrint({
                                        title: 'TEM NHÃN VẬT TƯ & LÔ HÀNG',
                                        batchNumber: String(batch.batchId),
                                        batchId: batch.batchId,
                                        materialCode: selectedPlanDetail.plan!.materialId,
                                        materialName: selectedPlanDetail.plan!.materialName || '',
                                        quantity: batch.actualQuantity > 0 ? batch.actualQuantity : batch.systemQuantity,
                                        unit: batch.unit || selectedPlanDetail.plan!.unit || '',
                                        locationCode: batch.locationName || batch.locationCode || 'Hiện trường',
                                        poNumber: `CYCLE-COUNT (Lô #${batch.batchId})`,
                                        expiryDate: 'N/A'
                                      })}
                                      className="px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer shadow-2xs"
                                      title="In Tem Nhãn Barcode"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-[#F7941D]" />
                                      <span>In Tem</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCountModal(batch)}
                                      disabled={isPlanDone}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                                        isPlanDone
                                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                          : isCounted
                                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                          : 'bg-[#007D3C] hover:bg-[#009647] text-white shadow-2xs'
                                      }`}
                                    >
                                      <Barcode className="w-3.5 h-3.5" />
                                      {isPlanDone ? 'Đã Chốt' : isCounted ? 'Đếm Thêm' : 'Đếm Thùng'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 2: Logs List */}
                {planSubTab === 'logs' && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                            <th className="py-2.5 px-3">Mã Lượt Quét</th>
                            <th className="py-2.5 px-3">Mã Lô (Batch ID)</th>
                            <th className="py-2.5 px-3">Vị Trí Kệ</th>
                            <th className="py-2.5 px-3 text-right">Số Lượng Thùng</th>
                            <th className="py-2.5 px-3">Người Đếm</th>
                            <th className="py-2.5 px-3">Thời Gian</th>
                            <th className="py-2.5 px-3 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(!selectedPlanDetail.logs || selectedPlanDetail.logs.length === 0) ? (
                            <tr>
                              <td colSpan={7} className="py-4 text-center text-slate-500">
                                Chưa có lượt quét thùng nào từ máy Handheld/PDA.
                              </td>
                            </tr>
                          ) : (
                            selectedPlanDetail.logs.map(log => (
                              <tr key={log.logId} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">#{log.logId}</td>
                                <td className="py-2.5 px-3 font-mono font-extrabold text-blue-700">LÔ #{log.batchId}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-700">{log.locationName || log.locationCode || 'Chưa gán'}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700 text-sm">
                                  {log.quantity} {log.unit || selectedPlanDetail.plan?.unit}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-semibold">{log.createdBy}</td>
                                <td className="py-2.5 px-3 text-slate-500">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setActiveBarcodePrint({
                                      title: 'TEM NHÃN VẬT TƯ & LÔ HÀNG',
                                      batchNumber: String(log.batchId),
                                      batchId: log.batchId,
                                      materialCode: selectedPlanDetail.plan!.materialId,
                                      materialName: selectedPlanDetail.plan!.materialName || '',
                                      quantity: log.quantity,
                                      unit: log.unit || selectedPlanDetail.plan!.unit || '',
                                      locationCode: log.locationName || log.locationCode || 'Hiện trường',
                                      poNumber: `CYCLE-COUNT (Lô #${log.batchId})`,
                                      expiryDate: 'N/A'
                                    })}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 ml-auto cursor-pointer shadow-xs"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>In Lại Tem</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 3: Reconciliation View */}
                {planSubTab === 'reconciliation' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-blue-600" /> Bảng Đối Soát 4 Chiều & Lịch Sử Phê Duyệt
                        </h4>
                        {(() => {
                          const status = getPlanStatus(selectedPlanDetail.plan);
                          const badge = getPlanStatusBadge(status);
                          return (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.badgeClass}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>

                      {(() => {
                        const status = getPlanStatus(selectedPlanDetail.plan);
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                            {/* Card 1 */}
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Nhân viên lập & đếm</span>
                              <span className="text-xs font-bold text-slate-800 block mt-1">
                                {selectedPlanDetail.plan?.createdBy || 'Admin'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {formatDateTime(selectedPlanDetail.plan?.createdAt)}
                              </span>
                            </div>

                            {/* Card 2 */}
                            <div className={`p-3 rounded-lg border ${
                              status === 'COUNTING'
                                ? 'bg-amber-50/60 border-amber-200'
                                : 'bg-blue-50/60 border-blue-200'
                            }`}>
                              <span className={`text-[10px] font-bold uppercase block ${
                                status === 'COUNTING' ? 'text-amber-600' : 'text-blue-600'
                              }`}>
                                2. Báo cáo kiểm xong
                              </span>
                              <span className={`text-xs font-bold block mt-1 ${
                                status === 'COUNTING' ? 'text-amber-800' : 'text-blue-800'
                              }`}>
                                {status === 'COUNTING' ? '🟡 Đang quét đếm' : '🔵 Đã báo kiểm xong'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {status !== 'COUNTING' && selectedPlanDetail.plan?.finishedAt
                                  ? formatDateTime(selectedPlanDetail.plan.finishedAt)
                                  : 'Chưa gửi báo cáo'}
                              </span>
                            </div>

                            {/* Card 3 */}
                            <div className={`p-3 rounded-lg border ${
                              status === 'APPROVED'
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : status === 'PENDING_APPROVAL'
                                ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-400/30'
                                : 'bg-slate-50 border-slate-200'
                            }`}>
                              <span className={`text-[10px] font-bold uppercase block ${
                                status === 'APPROVED' ? 'text-[#007D3C]' : status === 'PENDING_APPROVAL' ? 'text-blue-600' : 'text-slate-400'
                              }`}>
                                3. Trưởng phòng phê duyệt
                              </span>
                              <span className={`text-xs font-bold block mt-1 ${
                                status === 'APPROVED' ? 'text-[#007D3C]' : status === 'PENDING_APPROVAL' ? 'text-blue-800' : 'text-slate-500'
                              }`}>
                                {status === 'APPROVED'
                                  ? `🟢 Đã duyệt: ${selectedPlanDetail.plan?.approvedBy || 'Trưởng phòng'}`
                                  : status === 'PENDING_APPROVAL'
                                  ? '⏳ Đang chờ TP duyệt'
                                  : 'Chưa duyệt'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {status === 'APPROVED' && selectedPlanDetail.plan?.approvedAt
                                  ? formatDateTime(selectedPlanDetail.plan.approvedAt)
                                  : status === 'PENDING_APPROVAL'
                                  ? 'Chờ TP nhấn phê duyệt'
                                  : '---'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        Khi Trưởng phòng kho bấm nút <strong>"Phê Duyệt & Chốt Sổ (INV-09)"</strong>, hệ thống MMS sẽ gọi Stored Procedure <code className="font-mono bg-white px-1.5 py-0.5 rounded border">dbo.sp_wms_approve_cycle_count</code> để trừ dứt điểm các số lượng cặn còn dư trên các lô gốc về 0 (`ADJ_DWN`), đưa trạng thái tồn về `2` (đã xuất hết), và ghi nhận sự kiện thất thoát vào <code className="font-mono bg-white px-1.5 py-0.5 rounded border">tbl_batch_event (ma_event = 5)</code>.
                      </p>
                    </div>

                    {/* Action Bar inside Reconciliation Tab */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      {(() => {
                        const status = getPlanStatus(selectedPlanDetail.plan);
                        const planId = selectedPlanDetail.plan!.planId;

                        if (status === 'COUNTING') {
                          return (
                            <button
                              onClick={() => handleSubmitCounted(planId)}
                              disabled={isSubmittingCount}
                              className="px-4 py-2.5 bg-[#007D3C] hover:bg-[#006631] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-600"
                            >
                              <FileCheck className="w-4 h-4" /> Báo Cáo Đã Kiểm Xong (Chờ Trưởng Phòng Duyệt)
                            </button>
                          );
                        }

                        if (status === 'PENDING_APPROVAL') {
                          return (
                            <>
                              <button
                                onClick={() => handleReopenPlan(planId)}
                                disabled={isSubmittingCount}
                                className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 active:scale-95 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                              >
                                <RefreshCw className="w-4 h-4" /> Yêu Cầu Kiểm Lại
                              </button>
                              <button
                                onClick={() => handleApprovePlan(planId)}
                                disabled={isSubmittingCount}
                                className="px-5 py-2.5 bg-[#007D3C] hover:bg-[#009647] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                              >
                                <Check className="w-4 h-4" /> Trưởng Phòng Phê Duyệt & Chốt Sổ (INV-09)
                              </button>
                            </>
                          );
                        }

                        return (
                          <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-[#007D3C] text-xs font-bold rounded-xl flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Kế hoạch đã được phê duyệt và hoàn tất đối soát sổ cái.</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create Plan Dialog (Step 1) */}
      {isCreatingCyclePlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                <Plus className="w-4 h-4" /> BƯỚC 1: LẬP KẾ HOẠCH KIỂM KÊ
              </div>
              <button onClick={() => setIsCreatingCyclePlan(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Chọn Vật Tư Cần Kiểm Kê:
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={materialSearchQuery}
                    onChange={e => {
                      setMaterialSearchQuery(e.target.value);
                      loadMaterialOptions(e.target.value);
                    }}
                    placeholder="Tìm theo Mã hoặc Tên vật tư..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-sans"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {materialOptions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Không tìm thấy mã vật tư nào.
                    </div>
                  ) : (
                    materialOptions.map(mat => {
                      const isSelected = newPlanMaterialId === mat.materialId;
                      return (
                        <div
                          key={mat.materialId}
                          onClick={() => {
                            setSelectedMaterialOption(mat);
                            setNewPlanMaterialId(mat.materialId);
                            setNewPlanBookQty(mat.systemQuantity || 0);
                          }}
                          className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold">{mat.materialId}</div>
                            <div className="text-slate-500 text-[11px] truncate max-w-xs">{mat.materialName || 'Vật tư'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold">{mat.systemQuantity || 0} {mat.unit}</div>
                            <div className="text-[10px] text-slate-400">{mat.batchCount || 0} Lô tồn</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedMaterialOption && (
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-1">
                  <div className="font-bold text-blue-800">Thông tin Snapshot:</div>
                  <div className="text-slate-600">Vật tư: <strong className="text-slate-900">{selectedMaterialOption.materialName}</strong></div>
                  <div className="text-slate-600">Tồn hệ thống: <strong className="text-blue-700 font-mono">{selectedMaterialOption.systemQuantity} {selectedMaterialOption.unit}</strong> ({selectedMaterialOption.batchCount} lô)</div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreatingCyclePlan(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPlanSubmitting || !newPlanMaterialId}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isCreatingPlanSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Khởi Tạo Kế Hoạch & Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Log Count & Split Batch Dialog (Step 2 & 3) */}
      {activeCountBatch && selectedPlanDetail?.plan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#007D3C] font-bold text-xs uppercase tracking-wider">
                <Barcode className="w-4 h-4" /> BƯỚC 2 & 3: ĐẾM THỰC TẾ & TÁCH LÔ
              </div>
              <button onClick={() => setActiveCountBatch(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogCountSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã Lô Gốc:</span>
                  <span className="font-mono font-bold text-slate-900">#{activeCountBatch.batchId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sổ Sách (System Qty):</span>
                  <span className="font-mono font-bold text-slate-900">{activeCountBatch.systemQuantity} {activeCountBatch.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vị Trí Hiện Tại:</span>
                  <span className="font-mono font-bold text-[#007D3C]">
                    {activeCountBatch.locationName || activeCountBatch.locationCode || 'Chưa gán'}
                    {activeCountBatch.locationCode && activeCountBatch.locationName && activeCountBatch.locationCode !== activeCountBatch.locationName && ` (${activeCountBatch.locationCode})`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Số Lượng Thực Đếm Trên Thùng (Actual Qty):
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={countActualQty}
                  onChange={e => setCountActualQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 text-base font-mono font-extrabold text-blue-700 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Vị Trí Ô Kệ Lưu Trữ (Target Location):
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsLocationScannerOpen(true)}
                    className="text-xs font-bold text-[#007D3C] hover:text-[#009647] flex items-center gap-1 cursor-pointer"
                  >
                    <Barcode className="w-3.5 h-3.5" /> Quét Barcode Kệ
                  </button>
                </div>
                <select
                  value={countLocationCode}
                  onChange={e => {
                    setCountLocationCode(e.target.value);
                    if (rememberLocation) {
                      setLastUsedLocationCode(e.target.value);
                      try { sessionStorage.setItem('mms_last_count_location', e.target.value); } catch {}
                    }
                  }}
                  className="w-full px-3 py-2.5 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                >
                  {warehouseLocations.map(loc => (
                    <option key={loc.locationCode} value={loc.locationCode}>
                      {loc.description ? `${loc.description} (${loc.locationCode})` : loc.locationCode}
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberLocation}
                      onChange={e => setRememberLocation(e.target.checked)}
                      className="rounded text-[#007D3C] focus:ring-[#007D3C]"
                    />
                    <span>Ghim & giữ nguyên ô kệ cho các thùng tiếp</span>
                  </label>
                  {countLocationCode && (
                    <span className="font-mono font-bold text-[#007D3C]">
                      {warehouseLocations.find(l => l.locationCode === countLocationCode)?.description || countLocationCode}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveCountBatch(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCount || countActualQty <= 0}
                  className="px-5 py-2.5 bg-[#007D3C] hover:bg-[#009647] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isSubmittingCount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Xác Nhận & Tách Lô Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Barcode Scanner Modal */}
      <HandheldScannerModal
        isOpen={isLocationScannerOpen}
        onClose={() => setIsLocationScannerOpen(false)}
        onScan={(scannedCode: string) => {
          const found = warehouseLocations.find(l => 
            l.locationCode.toLowerCase() === scannedCode.toLowerCase() ||
            (l.description && l.description.toLowerCase() === scannedCode.toLowerCase()) ||
            (l.description && l.description.toLowerCase().includes(scannedCode.toLowerCase()))
          );
          const resolvedCode = found ? found.locationCode : scannedCode;
          setCountLocationCode(resolvedCode);
          if (rememberLocation) {
            setLastUsedLocationCode(resolvedCode);
            try { sessionStorage.setItem('mms_last_count_location', resolvedCode); } catch {}
          }
        }}
        title="Quét Barcode Vị Trí Ô Kệ Lưu Trữ"
        expectedType="LOCATION"
        sampleCodes={warehouseLocations.slice(0, 12).map(l => ({
          code: l.locationCode,
          label: `${l.description || 'Ô kệ'} (Khu ${l.areaCode || 'Kho'})`
        }))}
      />
    </div>
  );
};
