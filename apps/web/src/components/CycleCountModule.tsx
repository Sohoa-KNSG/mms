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
  AlertCircle
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import {
  cycleCountService,
  CycleCountPlanSummary,
  CycleCountPlanDetail,
  CycleCountBatchItem,
  CycleCountMaterialOption,
  WarehouseLocationOption
} from '../services/cycleCountService';
import { printService } from '../services/printService';

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
  const [planSubTab, setPlanSubTab] = useState<'batches' | 'reconciliation'>('batches');

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
    setCountActualQty(batch.actualQuantity > 0 ? batch.actualQuantity : batch.systemQuantity);
    setCountLocationCode(batch.locationCode || (warehouseLocations[0]?.locationCode || ''));
  };

  const handleLogCountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanDetail?.plan || !activeCountBatch) return;

    if (countActualQty <= 0) {
      alert('Số lượng thực đếm phải lớn hơn 0!');
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

      setLastCreatedChildBatch({
        newBatchId: res.newBatchId || activeCountBatch.batchId,
        parentBatchId: activeCountBatch.batchId,
        materialId: selectedPlanDetail.plan.materialId,
        materialName: selectedPlanDetail.plan.materialName || '',
        quantity: countActualQty,
        unit: activeCountBatch.unit || selectedPlanDetail.plan.unit || '',
        locationCode: countLocationCode || activeCountBatch.locationCode || 'Hiện trường',
        createdAt: new Date().toLocaleTimeString('vi-VN')
      });
      setActiveCountBatch(null);
      loadPlanDetail(selectedPlanDetail.plan.planId);
      loadCyclePlans(cyclePlanSearch);
    } catch (err: any) {
      alert('Lỗi ghi nhận kiểm đếm: ' + (err.message || err));
    } finally {
      setIsSubmittingCount(false);
    }
  };

  const handleFinishPlan = async () => {
    if (!selectedPlanDetail?.plan) return;
    if (!window.confirm('Bạn có chắc chắn muốn HOÀN THÀNH kế hoạch kiểm kê này? Những lô gốc còn dư số lượng sẽ tự động ghi giảm tồn do thất thoát (Chốt cặn).')) return;

    setIsSubmittingCount(true);
    try {
      const res = await cycleCountService.finishPlan(selectedPlanDetail.plan.planId);
      alert(res.message);
      loadPlanDetail(selectedPlanDetail.plan.planId);
      loadCyclePlans(cyclePlanSearch);
    } catch (err: any) {
      alert('Lỗi hoàn thành kế hoạch: ' + (err.message || err));
    } finally {
      setIsSubmittingCount(false);
    }
  };

  const filteredPlans = cyclePlans.filter(p => {
    if (cyclePlanFilterStatus !== 'ALL') {
      const isDone = (p.statusCode || '').toLowerCase().includes('finish') || (p.statusCode || '').toLowerCase().includes('hoan_thanh') || (p.statusCode || '') === '3';
      if (cyclePlanFilterStatus === 'FINISHED' && !isDone) return false;
      if (cyclePlanFilterStatus === 'COUNTING' && isDone) return false;
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

  const activeCount = cyclePlans.filter(p => !((p.statusCode || '').toLowerCase().includes('finish') || (p.statusCode || '').toLowerCase().includes('hoan_thanh') || (p.statusCode || '') === '3')).length;
  const finishedCount = cyclePlans.filter(p => (p.statusCode || '').toLowerCase().includes('finish') || (p.statusCode || '').toLowerCase().includes('hoan_thanh') || (p.statusCode || '') === '3').length;

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
            Lập kế hoạch kiểm theo mã vật tư, tự động snapshot các batch tồn kho, kiểm đếm thực tế hiện trường, in tem nhãn và chốt cặn thất thoát.
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

      {/* Smartlog Top Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Kế Hoạch</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 mt-0.5 block">
              {cyclePlans.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#007D3C] flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Đang Kiểm Đếm</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-amber-700 mt-0.5 block">
              {activeCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#007D3C] uppercase tracking-wider block">Đã Hoàn Thành</span>
            <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#007D3C] mt-0.5 block">
              {finishedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#007D3C] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#F7941D] uppercase tracking-wider block">Máy In Tem LAN</span>
            <span className="text-sm font-mono font-extrabold text-slate-800 mt-1 block">
              10.17.16.102:8080
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F7941D] flex items-center justify-center font-bold">
            <Printer className="w-5 h-5 text-[#F7941D]" />
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
                alert(res.message);
              }}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" /> In Tem Ngay (10.17.16.102:8080)
            </button>
            <button
              onClick={() => setLastCreatedChildBatch(null)}
              className="p-2 text-emerald-300 hover:text-white rounded-xl hover:bg-emerald-800/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
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
              {['ALL', 'COUNTING', 'FINISHED'].map(st => (
                <button
                  key={st}
                  onClick={() => setCyclePlanFilterStatus(st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    cyclePlanFilterStatus === st
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'COUNTING' ? 'Đang đếm' : 'Xong'}
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
                const isDone = (plan.statusCode || '').toLowerCase().includes('finish') || (plan.statusCode || '').toLowerCase().includes('hoan_thanh') || (plan.statusCode || '') === '3';
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
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {isDone ? 'Đã Hoàn Thành' : 'Đang Kiểm Đếm'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('vi-VN') : ''}
                      </span>
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
              {/* Plan Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#007D3C] uppercase tracking-wider">
                        CHI TIẾT KẾ HOẠCH #{selectedPlanDetail.plan.planId}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        (selectedPlanDetail.plan.statusCode || '').toLowerCase().includes('finish') || (selectedPlanDetail.plan.statusCode || '') === '3'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {(selectedPlanDetail.plan.statusCode || '').toLowerCase().includes('finish') || (selectedPlanDetail.plan.statusCode || '') === '3' ? 'ĐÃ HOÀN TẤT' : 'ĐANG THỰC HIỆN'}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                      [{selectedPlanDetail.plan.materialId}] {selectedPlanDetail.plan.materialName || 'Vật tư'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {!((selectedPlanDetail.plan.statusCode || '').toLowerCase().includes('finish') || (selectedPlanDetail.plan.statusCode || '') === '3') && (
                      <button
                        onClick={handleFinishPlan}
                        disabled={isSubmittingCount}
                        className="px-4 py-2 bg-[#007D3C] hover:bg-[#009647] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Hoàn Thành & Chốt Cặn (B4)
                      </button>
                    )}
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedPlanDetail.batches?.map(batch => {
                            const isCounted = batch.isCounted || (batch.actualQuantity || 0) > 0;
                            return (
                              <tr key={batch.batchId} className="hover:bg-slate-50/80">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  #{batch.batchId}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-700">
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#007D3C] border border-emerald-200 text-[11px] font-bold">
                                    {batch.locationCode || 'Chưa gán'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                                  {batch.systemQuantity} {batch.unit}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#007D3C]">
                                  {batch.actualQuantity || 0} {batch.unit}
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
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 2: Reconciliation View */}
                {planSubTab === 'reconciliation' && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="font-bold text-xs uppercase text-slate-800">
                      Tổng Hợp Số Liệu Đối Soát
                    </h4>
                    <p className="text-xs text-slate-600">
                      Khi bấm nút <strong>Hoàn Thành & Chốt Cặn</strong>, hệ thống MMS sẽ gọi Stored Procedure <code className="font-mono bg-white px-1.5 py-0.5 rounded border">dbo.sp_wms_finish_cycle_count</code> để trừ dứt điểm các số lượng cặn còn dư trên các lô gốc về 0, đồng thời ghi nhận sự kiện thất thoát vào <code className="font-mono bg-white px-1.5 py-0.5 rounded border">tbl_batch_event (ma_event = 5)</code>.
                    </p>
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
                          className={`p-3 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                            isSelected ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold">[{mat.materialId}]</div>
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">{mat.materialName}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900">{mat.systemQuantity || 0}</span>
                            <span className="text-[11px] text-slate-500 ml-1">{mat.unit}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedMaterialOption && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                  <div className="font-bold text-blue-900">
                    Đã chọn: [{selectedMaterialOption.materialId}] {selectedMaterialOption.materialName}
                  </div>
                  <div className="text-blue-700">
                    Tồn sổ sách hiện hành: <span className="font-mono font-bold">{selectedMaterialOption.systemQuantity} {selectedMaterialOption.unit}</span>
                  </div>
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
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
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
                  <span className="font-mono font-bold text-blue-600">{activeCountBatch.locationCode || 'Chưa gán'}</span>
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Vị Trí Ô Kệ Lưu Trữ (Target Location):
                </label>
                <select
                  value={countLocationCode}
                  onChange={e => setCountLocationCode(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  {warehouseLocations.map(loc => (
                    <option key={loc.locationCode} value={loc.locationCode}>
                      {loc.locationCode} - {loc.description || 'Ô kệ'} (Khu {loc.areaCode || 'Kho'})
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  {isSubmittingCount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Xác Nhận & Tách Lô Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
