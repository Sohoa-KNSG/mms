import React, { useState, useEffect } from 'react';
import {
  Boxes,
  MapPin,
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  ClipboardList,
  Filter,
  Plus,
  ArrowRight,
  Layers,
  Calendar,
  Grid,
  Loader2,
  RefreshCw,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileCheck,
  Check
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { BatchInventory, WarehouseLocation } from '../types';
import {
  cycleCountService,
  CycleCountPlanSummary,
  CycleCountPlanDetail,
  CycleCountBatchItem
} from '../services/cycleCountService';
import { splitBatchV2, getBatchGenealogy, BatchGenealogyNode } from '../services/inventoryService';

export const InventoryModule: React.FC = () => {
  const {
    materials,
    batches,
    locations,
    auditTickets,
    createAuditTicket,
    completeAuditTicket,
    setActiveBarcodePrint
  } = useWarehouse();

  const [activeTab, setActiveTab] = useState<'sku' | 'batch' | 'map' | 'audit' | 'cycle-count'>('cycle-count');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<WarehouseLocation | null>(null);

  // New Audit State
  const [isCreatingAudit, setIsCreatingAudit] = useState(false);
  const [auditWarehouse, setAuditWarehouse] = useState('Kho A - Linh kiện điện tử');
  const [auditTitle, setAuditTitle] = useState('Kiểm kê định kỳ giữa tháng');

  // =========================================================================
  // UC-10: TÁCH BATCH & GIA PHẢ
  // =========================================================================
  const [activeSplitBatch, setActiveSplitBatch] = useState<BatchInventory | null>(null);
  const [splitQuantity, setSplitQuantity] = useState<number>(0);
  const [splitTargetLocation, setSplitTargetLocation] = useState<string>('');
  const [isSplitting, setIsSplitting] = useState(false);

  const [activeGenealogyBatchId, setActiveGenealogyBatchId] = useState<number | null>(null);
  const [genealogyNodes, setGenealogyNodes] = useState<BatchGenealogyNode[]>([]);
  const [isGenealogyLoading, setIsGenealogyLoading] = useState(false);

  const handleSplitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSplitBatch) return;
    
    // Check if batchNumber is numeric (for MMS1 ID format)
    const batchId = parseInt(activeSplitBatch.batchNumber.replace(/\D/g, ''), 10) || parseInt(activeSplitBatch.id, 10);
    
    setIsSplitting(true);
    try {
      const res = await splitBatchV2(batchId, {
        splitQuantity,
        targetLocation: splitTargetLocation || undefined
      });
      alert(res.message);
      setActiveSplitBatch(null);
      // In a real app we would refresh the batch list here
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || err));
    } finally {
      setIsSplitting(false);
    }
  };

  const handleViewGenealogy = async (batchNumber: string, id: string) => {
    const batchId = parseInt(batchNumber.replace(/\D/g, ''), 10) || parseInt(id, 10);
    setActiveGenealogyBatchId(batchId);
    setIsGenealogyLoading(true);
    try {
      const data = await getBatchGenealogy(batchId);
      setGenealogyNodes(data);
    } catch (err: any) {
      alert('Lỗi tải gia phả: ' + (err.message || err));
      setActiveGenealogyBatchId(null);
    } finally {
      setIsGenealogyLoading(false);
    }
  };

  // =========================================================================
  // REAL MMS1 CYCLE COUNT STATES (UC-27 / INV-08)
  // =========================================================================
  const [cyclePlans, setCyclePlans] = useState<CycleCountPlanSummary[]>([]);
  const [isCyclePlansLoading, setIsCyclePlansLoading] = useState(false);
  const [cyclePlanSearch, setCyclePlanSearch] = useState('');
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<CycleCountPlanDetail | null>(null);
  const [isPlanDetailLoading, setIsPlanDetailLoading] = useState(false);

  // Modal Create Plan
  const [isCreatingCyclePlan, setIsCreatingCyclePlan] = useState(false);
  const [newPlanMaterialId, setNewPlanMaterialId] = useState('');
  const [newPlanBookQty, setNewPlanBookQty] = useState<number>(0);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [materialOptions, setMaterialOptions] = useState<any[]>([]);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
  const [selectedMaterialOption, setSelectedMaterialOption] = useState<any | null>(null);

  // Load Material Options from tbl_dm_vattu
  const loadMaterialOptions = async (search?: string) => {
    setIsMaterialsLoading(true);
    try {
      const data = await cycleCountService.getMaterials(search);
      setMaterialOptions(data || []);
    } catch (err) {
      console.warn('Lỗi tải danh mục vật tư:', err);
    } finally {
      setIsMaterialsLoading(false);
    }
  };

  // Modal Log Count
  const [activeCountBatch, setActiveCountBatch] = useState<CycleCountBatchItem | null>(null);
  const [countActualQty, setCountActualQty] = useState<number>(0);
  const [countLocationCode, setCountLocationCode] = useState('');
  const [isSubmittingCount, setIsSubmittingCount] = useState(false);

  // Load Cycle Count Plans from MMS1
  const loadCyclePlans = async (search?: string) => {
    setIsCyclePlansLoading(true);
    try {
      const data = await cycleCountService.getPlans(search);
      setCyclePlans(data || []);
      if (data && data.length > 0) {
        if (!selectedPlanDetail || !data.some(p => p.planId === selectedPlanDetail.plan?.planId)) {
          loadPlanDetail(data[0].planId);
        }
      } else {
        setSelectedPlanDetail(null);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách kế hoạch kiểm kê:', err);
    } finally {
      setIsCyclePlansLoading(false);
    }
  };

  // Load Single Plan Detail
  const loadPlanDetail = async (planId: number) => {
    setIsPlanDetailLoading(true);
    try {
      const data = await cycleCountService.getPlanDetail(planId);
      setSelectedPlanDetail(data);
    } catch (err) {
      console.warn(`Lỗi tải chi tiết kế hoạch kiểm kê #${planId}:`, err);
    } finally {
      setIsPlanDetailLoading(false);
    }
  };

  // Create Cycle Count Plan
  const handleCreateCyclePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanMaterialId.trim()) {
      alert('Vui lòng nhập hoặc chọn mã vật tư cần kiểm kê!');
      return;
    }

    setIsSubmittingPlan(true);
    try {
      const res = await cycleCountService.createPlan({
        materialId: newPlanMaterialId.trim(),
        bookQuantity: newPlanBookQty
      });
      alert(`Đã tạo kế hoạch kiểm kê #${res.planId} thành công cho vật tư ${res.materialId}! Đã snapshot ${res.batchCount} batch còn tồn.`);
      setIsCreatingCyclePlan(false);
      setNewPlanMaterialId('');
      setNewPlanBookQty(0);
      loadCyclePlans(cyclePlanSearch);
    } catch (err: any) {
      alert('Lỗi tạo kế hoạch kiểm kê: ' + (err.message || err));
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Submit Count Log
  const handleLogCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanDetail?.plan || !activeCountBatch) return;

    setIsSubmittingCount(true);
    try {
      const res = await cycleCountService.logCount(selectedPlanDetail.plan.planId, {
        detailId: activeCountBatch.detailId,
        batchId: activeCountBatch.batchId,
        actualQuantity: countActualQty,
        unit: activeCountBatch.unit,
        locationCode: countLocationCode || activeCountBatch.locationCode
      });

      alert(`Đã ghi nhận ${res.actualQuantity} ${activeCountBatch.unit || ''} thành công! Lô mới tạo ID: ${res.newBatchId}`);
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
    if (!window.confirm('Bạn có chắc chắn muốn HOÀN THÀNH kế hoạch kiểm kê này? Những lô gốc còn dư số lượng sẽ tự động ghi giảm tồn do thất thoát.')) return;
    
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

  useEffect(() => {
    if (activeTab === 'cycle-count') {
      loadCyclePlans(cyclePlanSearch);
    }
  }, [activeTab]);

  // Filtered SKU list
  const filteredMaterials = materials.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.categoryName.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered Batches
  const filteredBatches = batches.filter(b => {
    if (selectedWarehouse !== 'ALL' && !b.warehouse.includes(selectedWarehouse)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.batchNumber.toLowerCase().includes(q) ||
        b.materialCode.toLowerCase().includes(q) ||
        b.materialName.toLowerCase().includes(q) ||
        b.locationCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStartNewAudit = () => {
    const targetBatches = batches.filter(b => b.warehouse.includes(auditWarehouse.split(' - ')[0]));
    const auditItems = targetBatches.map(b => ({
      materialId: b.materialId,
      materialCode: b.materialCode,
      materialName: b.materialName,
      batchNumber: b.batchNumber,
      locationCode: b.locationCode,
      systemQuantity: b.quantity,
      actualQuantity: b.quantity,
      difference: 0
    }));

    createAuditTicket(auditWarehouse, auditTitle, auditItems);
    setIsCreatingAudit(false);
    alert('Đã tạo phiếu kiểm kê thành công! Bạn có thể nhập số liệu thực tế.');
  };

  const getSlotColor = (status: WarehouseLocation['status']) => {
    switch (status) {
      case 'EMPTY':
        return 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600';
      case 'PARTIAL':
        return 'bg-blue-100 hover:bg-blue-200 border-blue-400 text-blue-800';
      case 'FULL':
        return 'bg-rose-100 hover:bg-rose-200 border-rose-400 text-rose-800';
      case 'MAINTENANCE':
        return 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" /> Warehouse Inventory & Traceability
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Quản Lý Tồn Kho, Batch & Kiểm Kê Cycle Count (UC15 - UC18 / UC-27)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tồn theo SKU, chi tiết từng Lô (Batch), sơ đồ vị trí và kiểm kê Cycle Count theo vật tư kết nối MMS1.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'cycle-count' as const, label: '📋 Kiểm Kê Cycle Count (UC-27)' },
            { id: 'sku' as const, label: 'Theo Mã SKU' },
            { id: 'batch' as const, label: 'Theo Mã Lô (Batch)' },
            { id: 'map' as const, label: 'Sơ Đồ Kệ Kho' },
            { id: 'audit' as const, label: 'Phiếu Kiểm Kê Batch' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          TAB: UC-27 (INV-08) CYCLE COUNT THEO VẬT TƯ (BƯỚC 1)
      ========================================================================= */}
      {activeTab === 'cycle-count' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  Kiểm Kê Xoay Vòng Cycle Count Theo Vật Tư (UC-27 / INV-08)
                </h3>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded-full font-mono">
                  MMS1 LIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Lập kế hoạch kiểm theo mã vật tư, tự động snapshot các batch tồn kho, kiểm đếm thực tế hiện trường và dán tem.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => loadCyclePlans(cyclePlanSearch)}
                disabled={isCyclePlansLoading}
                className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 cursor-pointer"
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
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Lập Kế Hoạch Kiểm Kê Mới (B1)
              </button>
            </div>
          </div>

          {/* Master Detail Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: List of Plans */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span>Danh Sách Kế Hoạch ({cyclePlans.length})</span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cyclePlanSearch}
                  onChange={e => {
                    setCyclePlanSearch(e.target.value);
                    loadCyclePlans(e.target.value);
                  }}
                  placeholder="Tìm mã vật tư, tên vật tư, mã KH..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                />
              </div>

              {isCyclePlansLoading ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                  Đang tải danh sách kế hoạch kiểm kê từ MMS1...
                </div>
              ) : cyclePlans.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                  Chưa có kế hoạch kiểm kê nào được lập. Bấm nút "Lập Kế Hoạch Kiểm Kê Mới" để bắt đầu.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
                  {cyclePlans.map(plan => {
                    const isSelected = selectedPlanDetail?.plan?.planId === plan.planId;
                    const diff = plan.actualQuantity - plan.systemQuantity;
                    return (
                      <div
                        key={plan.planId}
                        onClick={() => loadPlanDetail(plan.planId)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-blue-800 font-mono">
                            Kế Hoạch #{plan.planId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {plan.batchCount} Batch ({plan.countLogCount} lượt đếm)
                          </span>
                        </div>

                        <div className="font-mono font-bold text-xs text-slate-900">
                          {plan.materialId}
                        </div>
                        <div className="text-xs font-semibold text-slate-700 line-clamp-1 mt-0.5">
                          {plan.materialName || '—'}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Tồn HT:</span>
                            <span className="font-mono font-bold text-slate-800">{plan.systemQuantity.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Sổ sách:</span>
                            <span className="font-mono font-bold text-slate-800">{plan.bookQuantity.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Thực tế:</span>
                            <span className="font-mono font-bold text-blue-700">{plan.actualQuantity.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Plan Detail & Batch List */}
            <div className="lg:col-span-7 space-y-4">
              {isPlanDetailLoading ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 animate-pulse">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="space-y-2">
                      <div className="h-5 w-52 bg-slate-200 rounded-md"></div>
                      <div className="h-3.5 w-72 bg-slate-100 rounded-md"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-36 bg-slate-100 rounded-lg"></div>
                      <div className="h-8 w-32 bg-slate-200 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                    <div className="h-16 bg-slate-100 rounded-xl"></div>
                  </div>
                  <div className="space-y-2.5 pt-3">
                    <div className="h-11 bg-slate-100 rounded-xl"></div>
                    <div className="h-11 bg-slate-50 rounded-xl"></div>
                    <div className="h-11 bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
              ) : selectedPlanDetail?.plan ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  {/* Plan Summary Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-blue-900">
                          Kế Hoạch Kiểm Kê #{selectedPlanDetail.plan.planId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Đang kiểm kê (0)
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Vật tư: <strong className="font-mono text-blue-700">{selectedPlanDetail.plan.materialId}</strong> — {selectedPlanDetail.plan.materialName} ({selectedPlanDetail.plan.unit})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleFinishPlan}
                        disabled={isSubmittingCount}
                        className="h-8 px-3 text-[11px] font-bold rounded-lg border border-teal-600 text-teal-700 bg-teal-50 hover:bg-teal-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Hoàn Thành Kiểm Kê
                      </button>
                      <button
                        onClick={() => {
                          setActiveBarcodePrint({
                            title: 'TEM ĐÃ KIỂM KÊ (CYCLE COUNT)',
                            batchNumber: `PLAN-${selectedPlanDetail.plan?.planId}`,
                            materialName: selectedPlanDetail.plan?.materialName || '',
                            materialCode: selectedPlanDetail.plan?.materialId || '',
                            locationCode: 'CYCLE-COUNT',
                            quantity: selectedPlanDetail.plan?.actualQuantity || 0,
                            unit: selectedPlanDetail.plan?.unit || 'Cái',
                            expiryDate: 'ĐÃ KIỂM KÊ',
                            poNumber: `KH #${selectedPlanDetail.plan?.planId}`
                          });
                        }}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> In Tem Đã Kiểm
                      </button>
                    </div>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Tồn Hệ Thống:</span>
                      <span className="font-mono text-sm font-extrabold text-slate-900">
                        {selectedPlanDetail.plan.systemQuantity.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Số Sách Kế Toán:</span>
                      <span className="font-mono text-sm font-extrabold text-slate-900">
                        {selectedPlanDetail.plan.bookQuantity.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-600 font-bold uppercase block">Thực Tế Đếm:</span>
                      <span className="font-mono text-sm font-extrabold text-blue-700">
                        {selectedPlanDetail.plan.actualQuantity.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Chênh Lệch:</span>
                      <span className={`font-mono text-sm font-extrabold ${
                        selectedPlanDetail.plan.differenceQuantity === 0
                          ? 'text-slate-500'
                          : selectedPlanDetail.plan.differenceQuantity > 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}>
                        {selectedPlanDetail.plan.differenceQuantity > 0 ? '+' : ''}
                        {selectedPlanDetail.plan.differenceQuantity.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Batches Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Danh Sách Lô Cần Kiểm Kê ({selectedPlanDetail.batches.length} Batch)</span>
                      <span className="text-slate-400 font-normal">Quét/Đếm thực tế tại hiện trường (B2)</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3 w-10">#</th>
                            <th className="p-3">Mã Batch</th>
                            <th className="p-3">Mã Bravo</th>
                            <th className="p-3">Vị Trí Kệ</th>
                            <th className="p-3 text-right">Tồn HT</th>
                            <th className="p-3 text-right">Thực Tế</th>
                            <th className="p-3 text-center">Trạng Thái</th>
                            <th className="p-3 text-center">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedPlanDetail.batches.map((b, idx) => (
                            <tr key={b.detailId || idx} className="hover:bg-slate-50/60">
                              <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-3 font-mono font-bold text-slate-900">
                                #{b.batchId}
                              </td>
                              <td className="p-3 font-mono text-slate-600">
                                {b.bravoId || '—'}
                              </td>
                              <td className="p-3 font-mono font-bold text-blue-700">
                                {b.locationCode || 'Chưa vào kệ'}
                              </td>
                              <td className="p-3 font-mono text-right font-bold text-slate-700">
                                {b.systemQuantity.toLocaleString()}
                              </td>
                              <td className="p-3 font-mono text-right font-bold text-blue-700">
                                {b.actualQuantity.toLocaleString()}
                              </td>
                              <td className="p-3 text-center">
                                {b.isCounted ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                    Đã đếm ({b.countTimes})
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                                    Chưa đếm
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCountBatch(b);
                                    setCountActualQty(b.actualQuantity || b.systemQuantity);
                                    setCountLocationCode(b.locationCode || '');
                                  }}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Ghi Số Đếm
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Count Logs */}
                  {selectedPlanDetail.logs.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-slate-700 block">
                        Nhật Ký Các Lần Ghi Nhận Kiểm Đếm (tbl_kiemke_log)
                      </span>
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-48 overflow-y-auto">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2">Lần #</th>
                              <th className="p-2">Batch</th>
                              <th className="p-2">Vị Trí Kệ</th>
                              <th className="p-2 text-right">Số Lượng Đếm</th>
                              <th className="p-2">Người Đếm</th>
                              <th className="p-2">Thời Gian</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {selectedPlanDetail.logs.map(log => (
                              <tr key={log.logId}>
                                <td className="p-2 font-mono text-slate-400">#{log.logId}</td>
                                <td className="p-2 font-mono font-bold text-slate-800">#{log.batchId}</td>
                                <td className="p-2 font-mono text-blue-700">{log.locationCode || '—'}</td>
                                <td className="p-2 font-mono text-right font-bold text-emerald-700">
                                  {log.quantity.toLocaleString()} {log.unit}
                                </td>
                                <td className="p-2 text-slate-700">{log.createdBy}</td>
                                <td className="p-2 font-mono text-slate-400 text-[11px]">
                                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                  <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  Bấm chọn một kế hoạch kiểm kê ở danh sách bên trái để xem các batch chi tiết.
                </div>
              )}
            </div>
          </div>

          {/* Modal 1: Create Plan (sp_kiemke_tao_kehoach) */}
          {isCreatingCyclePlan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Lập Kế Hoạch Kiểm Kê Cycle Count (B1)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chọn vật tư từ danh mục tbl_dm_vattu để snapshot các lô tồn kho.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCreatingCyclePlan(false);
                      setSelectedMaterialOption(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>

                <form onSubmit={handleCreateCyclePlan} className="space-y-4 text-xs">
                  {/* Combobox: Chọn Vật Tư từ tbl_dm_vattu */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mã / Tên Vật Tư Kiểm Kê (tbl_dm_vattu): <span className="text-rose-500">*</span>
                    </label>

                    {/* Search & Select dropdown */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={materialSearchQuery}
                          onChange={e => {
                            setMaterialSearchQuery(e.target.value);
                            loadMaterialOptions(e.target.value);
                          }}
                          placeholder="Gõ mã hoặc tên vật tư để tìm kiếm..."
                          className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs bg-slate-50 focus:bg-white"
                        />
                      </div>

                      <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 shadow-2xs">
                        {isMaterialsLoading ? (
                          <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            Đang tìm danh mục vật tư...
                          </div>
                        ) : materialOptions.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs">
                            Không tìm thấy vật tư nào phù hợp.
                          </div>
                        ) : (
                          materialOptions.map(m => {
                            const isSelected = newPlanMaterialId === m.materialId;
                            return (
                              <div
                                key={m.materialId}
                                onClick={() => {
                                  setNewPlanMaterialId(m.materialId);
                                  setSelectedMaterialOption(m);
                                  setNewPlanBookQty(m.systemQuantity || 0);
                                }}
                                className={`p-2.5 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between ${
                                  isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                }`}
                              >
                                <div className="space-y-0.5 pr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-blue-700">{m.materialId}</span>
                                    {m.bravoId && (
                                      <span className="text-[10px] text-slate-400 font-mono">({m.bravoId})</span>
                                    )}
                                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                                      ĐVT: {m.unit || 'Cái'}
                                    </span>
                                  </div>
                                  <div className="font-medium text-slate-800 text-xs line-clamp-1">
                                    {m.materialName}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] text-slate-400 block">Tồn hiện tại</span>
                                  <span className="font-mono font-bold text-slate-900 text-xs">
                                    {(m.systemQuantity || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Selected Material Card */}
                    {selectedMaterialOption && (
                      <div className="mt-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-900 text-xs">
                            Đã chọn: {selectedMaterialOption.materialId}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold">
                            ĐVT: {selectedMaterialOption.unit || 'Cái'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium">
                          {selectedMaterialOption.materialName}
                        </div>
                        <div className="text-[11px] text-blue-700 font-mono pt-1">
                          Tổng tồn máy: <strong>{(selectedMaterialOption.systemQuantity || 0).toLocaleString()} {selectedMaterialOption.unit}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số Lượng Theo Sổ Sách Kế Toán (soluong_sosach): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newPlanBookQty}
                      onChange={e => setNewPlanBookQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm"
                    />
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Số lượng ghi nhận trên sổ kế toán cần đối chiếu với thực tế kiểm đếm.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCyclePlan(false);
                        setSelectedMaterialOption(null);
                      }}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPlan || !newPlanMaterialId}
                      className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingPlan ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang snapshot...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tạo Kế Hoạch & Snapshot Batch</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 2: Log Count (sp_kiemke_soluong) */}
          {activeCountBatch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Ghi Nhận Kiểm Đếm Thực Tế (B2)
                  </h3>
                  <button
                    onClick={() => setActiveCountBatch(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Đóng
                  </button>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl text-xs space-y-1">
                  <div>Lô Batch: <strong className="font-mono text-blue-800">#{activeCountBatch.batchId}</strong> ({activeCountBatch.bravoId || '—'})</div>
                  <div>Tồn máy: <strong className="font-mono text-slate-900">{activeCountBatch.systemQuantity} {activeCountBatch.unit}</strong></div>
                  <div>Vị trí trên hệ thống: <strong className="font-mono text-blue-700">{activeCountBatch.locationCode || 'Chưa gán'}</strong></div>
                </div>

                <form onSubmit={handleLogCount} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Vị Trí Kệ Kiểm Đếm Thực Tế:
                    </label>
                    <input
                      type="text"
                      value={countLocationCode}
                      onChange={e => setCountLocationCode(e.target.value)}
                      placeholder="VD: 09-03021, A-01-01..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Số Lượng Kiểm Đếm Thực Tế:
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={countActualQty}
                      onChange={e => setCountActualQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-extrabold text-base text-blue-700"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveCountBatch(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingCount}
                      className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingCount ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Xác Nhận & Ghi Nhật Ký</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 1: Stock by SKU */}
      {activeTab === 'sku' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã SKU, tên vật tư, nhóm..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-72"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tổng: {filteredMaterials.length} SKU</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã SKU</th>
                    <th className="p-3.5">Tên Vật Tư</th>
                    <th className="p-3.5">Nhóm Hàng</th>
                    <th className="p-3.5 text-right">Tổng Tồn Kho</th>
                    <th className="p-3.5 text-right">Định Mức Min</th>
                    <th className="p-3.5 text-right">Định Mức Max</th>
                    <th className="p-3.5 text-center">Cảnh Báo Tồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMaterials.map(m => {
                    const materialBatches = batches.filter(b => b.materialCode === m.code);
                    const totalQty = materialBatches.reduce((sum, b) => sum + b.quantity, 0);
                    const isLowStock = totalQty <= m.minStock;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60">
                        <td className="p-3.5 font-mono font-bold text-blue-700">{m.code}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{m.name}</td>
                        <td className="p-3.5 text-slate-600">{m.categoryName}</td>
                        <td className="p-3.5 font-mono text-right font-bold text-slate-800">
                          {totalQty.toLocaleString()} {m.unit}
                        </td>
                        <td className="p-3.5 font-mono text-right text-slate-500">{m.minStock}</td>
                        <td className="p-3.5 font-mono text-right text-slate-500">{m.maxStock}</td>
                        <td className="p-3.5 text-center">
                          {isLowStock ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Cảnh Báo Thiếu
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              An Toàn
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock by Batch */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm số Batch, mã SKU, vị trí kệ..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-72"
                />
              </div>
              <select
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="ALL">Tất Cả Kho</option>
                <option value="Kho A">Kho A - Linh kiện điện tử</option>
                <option value="Kho B">Kho B - Cơ khí & Hoá chất</option>
                <option value="Kho C">Kho C - Bao bì & Phụ liệu</option>
              </select>
            </div>
            <span className="text-xs text-slate-500 font-medium">Tổng: {filteredBatches.length} Lô Batch</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Lô (Batch)</th>
                    <th className="p-3.5">Mã SKU</th>
                    <th className="p-3.5">Tên Vật Tư</th>
                    <th className="p-3.5">Kho & Vị Trí Kệ</th>
                    <th className="p-3.5 text-right">Số Lượng Tồn</th>
                    <th className="p-3.5">Ngày Nhập</th>
                    <th className="p-3.5">Hạn Dùng</th>
                    <th className="p-3.5 text-center">In Tem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBatches.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/60">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{b.batchNumber}</td>
                      <td className="p-3.5 font-mono font-bold text-blue-700">{b.materialCode}</td>
                      <td className="p-3.5 font-medium text-slate-800">{b.materialName}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{b.warehouse}</div>
                        <div className="font-mono text-[11px] text-blue-600">Kệ: {b.locationCode}</div>
                      </td>
                      <td className="p-3.5 font-mono text-right font-bold text-slate-800">
                        {b.quantity.toLocaleString()} {b.unit}
                      </td>
                      <td className="p-3.5 text-slate-500 font-mono">{b.createdAt || '—'}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{b.expiryDate}</td>
                      <td className="p-3.5 text-center space-x-1.5 flex justify-center">
                        <button
                          onClick={() => {
                            setActiveSplitBatch(b);
                            setSplitQuantity(0);
                            setSplitTargetLocation(b.locationCode);
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          Tách Lô
                        </button>
                        <button
                          onClick={() => handleViewGenealogy(b.batchNumber, b.id)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Layers className="w-3 h-3" /> Gia Phả
                        </button>
                        <button
                          onClick={() => {
                            setActiveBarcodePrint({
                              title: 'TEM QUẢN LÝ TỒN KHO BATCH',
                              batchNumber: b.batchNumber,
                              materialName: b.materialName,
                              materialCode: b.materialCode,
                              locationCode: b.locationCode,
                              quantity: b.quantity,
                              unit: b.unit,
                              expiryDate: b.expiryDate,
                              poNumber: 'INV-STOCK'
                            });
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3" /> In Tem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Shelf Location Map */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Sơ Đồ Kệ Kho:</span>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300"></span> Trống</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-200 border border-blue-400"></span> Đang Chứa</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-200 border border-rose-400"></span> Đầy Kệ</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-400"></span> Bảo Trì</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {locations.map(loc => (
              <div
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${getSlotColor(loc.status)}`}
              >
                <div className="font-mono font-bold text-xs">{loc.code}</div>
                <div className="text-[10px] mt-1 opacity-75">{loc.occupied || 0} mục lưu</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Stock Audit / Kiểm Kê Batch */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Phiếu Kiểm Kê Batch & Cân Đối Tồn Kho (UC18)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm đếm thực tế, phát hiện chênh lệch thừa/thiếu và điều chỉnh số liệu kế toán.
              </p>
            </div>
            <button
              onClick={() => setIsCreatingAudit(true)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Đợt Kiểm Kê Mới
            </button>
          </div>

          {/* Audit Tickets List */}
          <div className="space-y-4">
            {auditTickets.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 text-xs">{ticket.code}</span>
                      <span className="font-bold text-slate-900 text-sm">{ticket.title}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Khu vực: {ticket.warehouse} • Ngày: {ticket.date} • Kiểm bởi: {ticket.auditor}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS CHO TÁCH BATCH & GIA PHẢ */}
      {activeSplitBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Tách Lô Hàng (Split Batch)</h3>
              <button onClick={() => setActiveSplitBatch(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Đóng</button>
            </div>
            
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs space-y-1">
              <div>Lô Gốc: <strong className="font-mono text-amber-800">{activeSplitBatch.batchNumber}</strong></div>
              <div>Mã Vật Tư: <strong className="font-mono">{activeSplitBatch.materialCode}</strong> - {activeSplitBatch.materialName}</div>
              <div>Tồn Khả Dụng: <strong className="font-mono text-slate-900">{activeSplitBatch.quantity} {activeSplitBatch.unit}</strong></div>
            </div>

            <form onSubmit={handleSplitSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số lượng cần tách ra lô mới: <span className="text-rose-500">*</span></label>
                <input type="number" step="any" min={0.0001} max={activeSplitBatch.quantity} required value={splitQuantity} onChange={e => setSplitQuantity(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-extrabold text-base text-blue-700" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vị trí kệ chứa lô mới: <span className="text-slate-400 font-normal">(Mặc định cùng vị trí lô cũ)</span></label>
                <input type="text" value={splitTargetLocation} onChange={e => setSplitTargetLocation(e.target.value)} placeholder="VD: KHO-A-01" className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-900" />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setActiveSplitBatch(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">Hủy</button>
                <button type="submit" disabled={isSplitting || splitQuantity <= 0 || splitQuantity > activeSplitBatch.quantity} className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50">
                  {isSplitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  Xác Nhận Tách
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeGenealogyBatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Cây Gia Phả Lô Hàng (Genealogy Tree)</h3>
                <p className="text-xs text-slate-500">Toàn bộ lịch sử chia tách của gia tộc lô #{activeGenealogyBatchId}</p>
              </div>
              <button onClick={() => setActiveGenealogyBatchId(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">Đóng</button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {isGenealogyLoading ? (
                <div className="p-10 text-center flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs text-slate-500">Đang truy vấn gia phả...</span>
                </div>
              ) : genealogyNodes.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">Không tìm thấy dữ liệu gia phả.</div>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {genealogyNodes.map(node => (
                    <div key={node.batchId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors" style={{ paddingLeft: `${node.level * 24 + 8}px` }}>
                      {node.level > 0 && <span className="text-slate-300">↳</span>}
                      <div className={`p-1.5 rounded flex items-center gap-2 ${node.batchId === activeGenealogyBatchId ? 'bg-blue-100 border border-blue-200' : 'bg-slate-100 border border-slate-200'}`}>
                        <Layers className={`w-3.5 h-3.5 ${node.batchId === activeGenealogyBatchId ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className="font-bold text-slate-800">#{node.batchId}</span>
                        {node.parentBatchId && <span className="text-[10px] text-slate-400">(Cha: #{node.parentBatchId})</span>}
                      </div>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{node.quantity} Cái</span>
                      <span className="text-blue-700 font-bold">{node.locationCode || 'Kho chưa xếp'}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(node.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
