import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, CheckCircle2, AlertTriangle, Clock,
  FileCheck, ShieldAlert, ChevronRight, X, ArrowLeft,
  RefreshCw, Check, Loader2, Sparkles, SlidersHorizontal,
  FileText, History, MapPin, Boxes, Package, CheckSquare, Square
} from 'lucide-react';
import {
  batchAuditApi,
  BatchAuditPlanSummary,
  BatchAuditDetailItem,
  BatchAuditLogItem,
  BatchAuditPlanDetailResponse,
  CreateBatchAuditPlanRequest,
  MaterialOption,
  AvailableBatchItem
} from '../api/batchAuditApi';
import { useWarehouse } from '../../../app/providers/warehouseStore';

export const BatchAuditManagement: React.FC = () => {
  const { currentUser } = useWarehouse();

  // State danh sách kế hoạch
  const [plans, setPlans] = useState<BatchAuditPlanSummary[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<number | undefined>(undefined);
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);

  // State chi tiết kế hoạch được chọn
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [planDetail, setPlanDetail] = useState<BatchAuditPlanDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailFilterStatus, setDetailFilterStatus] = useState<string>('ALL');
  const [activeDetailTab, setActiveDetailTab] = useState<'reconciliation' | 'logs'>('reconciliation');

  // State Modal Tạo Kế Hoạch (Trưởng phòng kho)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<CreateBatchAuditPlanRequest>({
    planName: '',
    warehouseCode: '20020100',
    auditType: 'MATERIAL_GROUP',
    locationPrefix: '',
    batchIds: [],
    materialId: '',
    agingDays: undefined,
    note: ''
  });
  const [rawBatchIdsInput, setRawBatchIdsInput] = useState<string>('');
  const [isCreatingPlan, setIsCreatingPlan] = useState<boolean>(false);

  // State chọn vật tư & các Lô cần kiểm
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([]);
  const [materialSearchText, setMaterialSearchText] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialOption | null>(null);
  const [availableBatches, setAvailableBatches] = useState<AvailableBatchItem[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);

  // State Modal Phê Duyệt Của Trưởng Phòng Kho
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [approvalNote, setApprovalNote] = useState<string>('');
  const [varianceExplanations, setVarianceExplanations] = useState<Record<number, string>>({});
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load danh sách kế hoạch
  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await batchAuditApi.getPlans({
        search: searchQuery || undefined,
        statusCode: selectedStatus,
        page,
        pageSize
      });
      setPlans(res.items || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách kế hoạch kiểm kê batch:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [searchQuery, selectedStatus, page]);

  // Load chi tiết kế hoạch
  const loadPlanDetail = async (planId: number) => {
    setIsLoadingDetail(true);
    try {
      const res = await batchAuditApi.getPlanDetail(planId);
      setPlanDetail(res);
      // Khởi tạo các giải trình chênh lệch sẵn có
      const map: Record<number, string> = {};
      res.batches.forEach((b: BatchAuditDetailItem) => {
        if (b.varianceReason) {
          map[b.detailId] = b.varianceReason;
        }
      });
      setVarianceExplanations(map);
    } catch (err: any) {
      console.error('Lỗi tải chi tiết kế hoạch batch:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSelectPlan = (planId: number) => {
    setSelectedPlanId(planId);
    loadPlanDetail(planId);
  };

  const handleBackToList = () => {
    setSelectedPlanId(null);
    setPlanDetail(null);
    loadPlans();
  };

  // Mở modal tạo kế hoạch
  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    setCreateForm({
      planName: '',
      warehouseCode: '20020100',
      auditType: 'MATERIAL_GROUP',
      locationPrefix: '',
      batchIds: [],
      materialId: '',
      agingDays: undefined,
      note: ''
    });
    setSelectedMaterial(null);
    setAvailableBatches([]);
    setSelectedBatchIds([]);
    setMaterialSearchText('');
    setRawBatchIdsInput('');
    try {
      const mats = await batchAuditApi.getMaterials();
      setMaterialOptions(mats || []);
    } catch (e) {
      console.error('Lỗi tải danh mục vật tư:', e);
    }
  };

  // Tìm kiếm vật tư
  const handleSearchMaterials = async (q: string) => {
    setMaterialSearchText(q);
    try {
      const mats = await batchAuditApi.getMaterials(q);
      setMaterialOptions(mats || []);
    } catch (e) {
      console.error('Lỗi tìm kiếm vật tư:', e);
    }
  };

  // Khi chọn một vật tư
  const handleSelectMaterial = async (mat: MaterialOption) => {
    setSelectedMaterial(mat);
    setMaterialSearchText(`${mat.materialId} - ${mat.materialName || ''}`.trim());
    setCreateForm(prev => ({
      ...prev,
      materialId: mat.materialId,
      planName: `Kiểm kê Lô - ${mat.materialId} ${mat.materialName ? `(${mat.materialName})` : ''}`.trim()
    }));
    setIsLoadingBatches(true);
    try {
      const batches = await batchAuditApi.getBatchesByMaterial(mat.materialId);
      setAvailableBatches(batches || []);
      setSelectedBatchIds(batches.map(b => b.batchId));
    } catch (e) {
      console.error('Lỗi tải danh sách Lô của vật tư:', e);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  // Toggle chọn 1 Lô
  const toggleBatchSelect = (batchId: number) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  // Toggle chọn tất cả Lô
  const toggleSelectAllBatches = () => {
    if (selectedBatchIds.length === availableBatches.length) {
      setSelectedBatchIds([]);
    } else {
      setSelectedBatchIds(availableBatches.map(b => b.batchId));
    }
  };

  // Submit tạo kế hoạch mới
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.planName.trim()) {
      setAlertMessage({ type: 'error', text: 'Vui lòng nhập tên kế hoạch kiểm kê.' });
      return;
    }

    let parsedBatchIds: number[] | undefined = undefined;
    if (createForm.auditType === 'MATERIAL_GROUP') {
      if (selectedBatchIds.length === 0) {
        setAlertMessage({ type: 'error', text: 'Vui lòng chọn ít nhất một Lô hàng để lập kế hoạch kiểm kê.' });
        return;
      }
      parsedBatchIds = selectedBatchIds;
    } else if (createForm.auditType === 'BATCH_LIST' && rawBatchIdsInput.trim()) {
      parsedBatchIds = rawBatchIdsInput
        .split(/[\s,;\n]+/)
        .map(s => parseInt(s.replace(/#/g, '').trim(), 10))
        .filter(n => !isNaN(n) && n > 0);

      if (!parsedBatchIds || parsedBatchIds.length === 0) {
        setAlertMessage({ type: 'error', text: 'Vui lòng nhập ít nhất một mã Batch ID hợp lệ.' });
        return;
      }
    }

    setIsCreatingPlan(true);
    try {
      const res = await batchAuditApi.createPlan({
        ...createForm,
        auditType: parsedBatchIds && parsedBatchIds.length > 0 ? 'BATCH_LIST' : createForm.auditType,
        batchIds: parsedBatchIds
      });

      if (res.ok && res.planId) {
        setShowCreateModal(false);
        setCreateForm({
          planName: '',
          warehouseCode: '20020100',
          auditType: 'MATERIAL_GROUP',
          locationPrefix: '',
          batchIds: [],
          materialId: '',
          agingDays: undefined,
          note: ''
        });
        setSelectedMaterial(null);
        setAvailableBatches([]);
        setSelectedBatchIds([]);
        setMaterialSearchText('');
        setRawBatchIdsInput('');
        setAlertMessage({ type: 'success', text: `Tạo kế hoạch #${res.planId} thành công với ${res.totalBatches} Lô!` });
        loadPlans();
        handleSelectPlan(res.planId);
      } else {
        setAlertMessage({ type: 'error', text: res.message || 'Không thể tạo kế hoạch.' });
      }
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Lỗi khi tạo kế hoạch.' });
    } finally {
      setIsCreatingPlan(false);
    }
  };

  // Submit phê duyệt chốt số lệch của Trưởng phòng kho
  const handleApproveVariance = async () => {
    if (!selectedPlanId || !planDetail) return;
    if (!approvalNote.trim()) {
      setAlertMessage({ type: 'error', text: 'Trưởng phòng kho bắt buộc phải nhập ý kiến / ghi chú giải trình phê duyệt!' });
      return;
    }

    const explanations = Object.entries(varianceExplanations)
      .filter(([_, reason]) => reason && reason.trim())
      .map(([detailId, reason]) => ({
        detailId: parseInt(detailId, 10),
        varianceReason: reason.trim()
      }));

    setIsApproving(true);
    try {
      const res = await batchAuditApi.approveVariance(selectedPlanId, {
        approvalNote: approvalNote.trim(),
        varianceExplanations: explanations
      });

      if (res.ok) {
        setShowApproveModal(false);
        setApprovalNote('');
        setAlertMessage({
          type: 'success',
          text: `Phê duyệt thành công! Đã sinh GD điều chỉnh cho ${res.adjustedBatchCount} Lô chênh lệch.`
        });
        loadPlanDetail(selectedPlanId);
      } else {
        setAlertMessage({ type: 'error', text: res.message || 'Không thể phê duyệt.' });
      }
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Lỗi phê duyệt kế hoạch.' });
    } finally {
      setIsApproving(false);
    }
  };

  // Lọc chi tiết các lô trong bảng đối soát
  const filteredBatches = useMemo(() => {
    if (!planDetail) return [];
    if (detailFilterStatus === 'ALL') return planDetail.batches;
    return planDetail.batches.filter(b => b.auditStatus === detailFilterStatus);
  }, [planDetail, detailFilterStatus]);

  // Các lô bị lệch cần giải trình
  const discrepantBatches = useMemo(() => {
    if (!planDetail) return [];
    return planDetail.batches.filter(b => b.actualQuantity !== null && b.differenceQuantity && Math.abs(b.differenceQuantity) > 0.0001);
  }, [planDetail]);

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-sm transition-all ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: DANH SÁCH CÁC KẾ HOẠCH KIỂM KÊ BATCH */}
      {/* ========================================================================= */}
      {!selectedPlanId && (
        <div className="space-y-6">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>🔍 Kiểm Kê Theo Lô (Batch Audit - UC-18)</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                  3 Cấp Phê Duyệt
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Trưởng phòng kho lập kế hoạch & snapshot ➔ Nhân viên quét PDA đếm mù ➔ Trưởng phòng duyệt chốt số lệch kèm giải trình.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadPlans}
                disabled={isLoadingPlans}
                className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPlans ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Kế Hoạch Kiểm Kê Lô</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Đợt Kiểm Kê</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Đang Mở Kiểm Đếm</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {plans.filter(p => p.statusCode === 1).length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Đã Duyệt Hoàn Tất</div>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {plans.filter(p => p.statusCode === 2).length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Tổng Lô Đã Snapshot</div>
              <div className="text-2xl font-black text-purple-700 mt-1">
                {plans.reduce((acc, p) => acc + p.totalBatches, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên kế hoạch, người tạo..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
              <select
                value={selectedStatus ?? ''}
                onChange={e => setSelectedStatus(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="1">1. Đang kiểm đếm</option>
                <option value="2">2. Đã duyệt hoàn tất</option>
              </select>
            </div>
          </div>

          {/* Table Plans */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {isLoadingPlans ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                <span className="text-xs font-medium">Đang tải danh sách kế hoạch kiểm kê batch...</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <div className="text-sm font-semibold text-slate-600">Chưa có kế hoạch kiểm kê batch nào</div>
                <p className="text-xs text-slate-400 mt-1">Bấm nút "Tạo Kế Hoạch Kiểm Kê Lô" để bắt đầu đợt kiểm kê mới.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Mã Đợt</th>
                      <th className="py-3 px-4">Tên Kế Hoạch</th>
                      <th className="py-3 px-4">Phạm Vi / Loại</th>
                      <th className="py-3 px-4 text-center">Tiến Độ Quét Lô</th>
                      <th className="py-3 px-4 text-center">Lô Lệch</th>
                      <th className="py-3 px-4">Người Lập / Ngày Lập</th>
                      <th className="py-3 px-4">Người Duyệt Chốt</th>
                      <th className="py-3 px-4 text-center">Trạng Thái</th>
                      <th className="py-3 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {plans.map(p => {
                      const progressPct = p.totalBatches > 0 ? Math.round((p.countedBatches / p.totalBatches) * 100) : 0;
                      return (
                        <tr
                          key={p.planId}
                          onClick={() => handleSelectPlan(p.planId)}
                          className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-purple-700">
                            #{p.planId}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 max-w-xs">
                            <div className="truncate">{p.planName}</div>
                            {p.note && <div className="text-[11px] font-normal text-slate-400 truncate">{p.note}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.auditType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center gap-1 min-w-[90px]">
                              <div className="text-[11px] font-bold text-slate-800">
                                {p.countedBatches} / {p.totalBatches} ({progressPct}%)
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    progressPct === 100 ? 'bg-emerald-500' : 'bg-purple-500'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {p.discrepantBatches > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                {p.discrepantBatches} Lô lệch
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-800 font-semibold">{p.createdBy}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(p.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {p.approvedBy ? (
                              <div>
                                <div className="text-emerald-700 font-bold">{p.approvedBy}</div>
                                <div className="text-[10px] text-slate-400">
                                  {p.approvedAt ? new Date(p.approvedAt).toLocaleDateString('vi-VN') : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Chờ phê duyệt</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {p.statusCode === 1 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Đang kiểm</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Đã duyệt chốt</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-purple-600 font-bold text-xs group-hover:underline flex items-center justify-end gap-0.5">
                              <span>Xem đối soát</span>
                              <ChevronRight className="w-4 h-4" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: CHI TIẾT KẾ HOẠCH & BẢNG ĐỐI SOÁT 3 CHIỀU */}
      {/* ========================================================================= */}
      {selectedPlanId && planDetail && (
        <div className="space-y-6">
          {/* Top Bar Detail */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={handleBackToList}
                className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại danh sách đợt kiểm kê</span>
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-black text-slate-900">
                  {planDetail.plan.planName}
                </h2>
                <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-purple-100 text-purple-800">
                  #PLAN-{planDetail.plan.planId}
                </span>
                {planDetail.plan.statusCode === 1 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Đang kiểm đếm
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Đã duyệt chốt cân đối kho
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
                <span>Người lập: <strong className="text-slate-700">{planDetail.plan.createdBy}</strong></span>
                <span>Ngày lập: <strong className="text-slate-700">{new Date(planDetail.plan.createdAt).toLocaleString('vi-VN')}</strong></span>
                {planDetail.plan.approvedBy && (
                  <span>Người duyệt: <strong className="text-emerald-700">{planDetail.plan.approvedBy}</strong> ({new Date(planDetail.plan.approvedAt!).toLocaleDateString('vi-VN')})</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => loadPlanDetail(selectedPlanId)}
                className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Làm mới đối soát"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingDetail ? 'animate-spin' : ''}`} />
              </button>

              {planDetail.plan.statusCode === 1 && (
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Trưởng Phòng Duyệt Chốt Lệch</span>
                </button>
              )}
            </div>
          </div>

          {/* Summary Box & Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Lô Snapshot</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{planDetail.plan.totalBatches}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Tồn: <strong>{planDetail.plan.totalSnapshotQuantity.toLocaleString()}</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Đã Quét Đếm Hiện Trường</div>
              <div className="text-2xl font-black text-purple-700 mt-1">{planDetail.plan.countedBatches}</div>
              <div className="text-[11px] text-purple-600 mt-1">
                Thực đếm: <strong>{planDetail.plan.totalActualQuantity.toLocaleString()}</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Lô Bị Chênh Lệch</div>
              <div className="text-2xl font-black text-rose-700 mt-1">{planDetail.plan.discrepantBatches}</div>
              <div className="text-[11px] text-rose-600 mt-1">
                Lệch ròng: <strong>{planDetail.plan.totalDifferenceQuantity > 0 ? `+${planDetail.plan.totalDifferenceQuantity.toLocaleString()}` : planDetail.plan.totalDifferenceQuantity.toLocaleString()}</strong>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ghi Chú Phê Duyệt</div>
              <div className="text-xs text-slate-700 font-medium mt-1 line-clamp-2">
                {planDetail.plan.approvalNote || 'Chưa có ghi chú giải trình phê duyệt'}
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveDetailTab('reconciliation')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeDetailTab === 'reconciliation'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Bảng Đối Soát 3 Chiều ({planDetail.batches.length} Lô)</span>
              </button>

              <button
                onClick={() => setActiveDetailTab('logs')}
                className={`pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeDetailTab === 'logs'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Nhật Ký Quét Đếm PDA ({planDetail.logs.length} Lượt)</span>
              </button>
            </div>

            {activeDetailTab === 'reconciliation' && (
              <div className="flex items-center gap-1 pb-2">
                {['ALL', 'LECH_THIEU', 'LECH_THUA', 'KHOP', 'CHUA_KIEM'].map(st => (
                  <button
                    key={st}
                    onClick={() => setDetailFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      detailFilterStatus === st
                        ? 'bg-purple-100 text-purple-800'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' && 'Tất cả'}
                    {st === 'LECH_THIEU' && '❌ Lệch thiếu'}
                    {st === 'LECH_THUA' && '🔺 Lệch thừa'}
                    {st === 'KHOP' && '✅ Khớp'}
                    {st === 'CHUA_KIEM' && '⚪ Chưa kiểm'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* TAB 1: BẢNG ĐỐI SOÁT 3 CHIỀU */}
          {activeDetailTab === 'reconciliation' && (
            <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Mã Lô (Batch ID)</th>
                      <th className="py-3 px-4">Mã & Tên Vật Tư</th>
                      <th className="py-3 px-4">Vị Trí Kệ (Snapshot / Hiện tại)</th>
                      <th className="py-3 px-4 text-right">Tồn Snapshot</th>
                      <th className="py-3 px-4 text-right">Thực Đếm (PDA)</th>
                      <th className="py-3 px-4 text-right">Chênh Lệch (ΔQ)</th>
                      <th className="py-3 px-4 text-center">Trạng Thái</th>
                      <th className="py-3 px-4">Lý Do Giải Trình</th>
                      <th className="py-3 px-4">Người Đếm Cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredBatches.map(batch => {
                      const diff = batch.differenceQuantity ?? 0;
                      return (
                        <tr key={batch.detailId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-purple-700">
                            #{batch.batchId}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {batch.materialId}
                            </div>
                            <div className="text-[11px] text-slate-600 truncate">
                              {batch.materialName}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{batch.locationSnapshot || 'N/A'}</span>
                            </div>
                            {batch.locationActual && batch.locationActual !== batch.locationSnapshot && (
                              <div className="text-[10px] text-amber-600 font-mono">
                                Quét tại: {batch.locationActual}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                            {batch.snapshotQuantity.toLocaleString()} {batch.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {batch.actualQuantity !== null && batch.actualQuantity !== undefined ? (
                              <span className="text-slate-900">{batch.actualQuantity.toLocaleString()} {batch.unit}</span>
                            ) : (
                              <span className="text-slate-400 italic">Chưa đếm</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {batch.actualQuantity !== null && batch.actualQuantity !== undefined ? (
                              <span
                                className={
                                  diff === 0
                                    ? 'text-emerald-600'
                                    : diff > 0
                                    ? 'text-purple-600'
                                    : 'text-rose-600'
                                }
                              >
                                {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()} {batch.unit}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {batch.auditStatus === 'KHOP' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Khớp Chuẩn
                              </span>
                            )}
                            {batch.auditStatus === 'LECH_THIEU' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                Lệch Thiếu
                              </span>
                            )}
                            {batch.auditStatus === 'LECH_THUA' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                Lệch Thừa
                              </span>
                            )}
                            {batch.auditStatus === 'CHUA_KIEM' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                Chưa Kiểm
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            {planDetail.plan.statusCode === 1 ? (
                              <input
                                type="text"
                                placeholder="Ghi chú lý do nếu lệch..."
                                value={varianceExplanations[batch.detailId] || ''}
                                onChange={e =>
                                  setVarianceExplanations({
                                    ...varianceExplanations,
                                    [batch.detailId]: e.target.value
                                  })
                                }
                                className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none focus:border-purple-500"
                              />
                            ) : (
                              <span className="text-slate-700 text-xs">
                                {batch.varianceReason || '-'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {batch.lastCountedBy ? (
                              <div>
                                <div className="font-semibold text-slate-800">{batch.lastCountedBy}</div>
                                <div className="text-[10px] text-slate-400">
                                  {batch.lastCountedAt ? new Date(batch.lastCountedAt).toLocaleTimeString('vi-VN') : ''}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: NHẬT KÝ QUÉT ĐẾM PDA */}
          {activeDetailTab === 'logs' && (
            <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Mã Lượt</th>
                      <th className="py-3 px-4">Mã Lô (#Batch)</th>
                      <th className="py-3 px-4">Số Lượng Đếm</th>
                      <th className="py-3 px-4">Vị Trí Kệ Quét</th>
                      <th className="py-3 px-4">Ghi Chú Đếm</th>
                      <th className="py-3 px-4">Nhân Viên Thực Hiện</th>
                      <th className="py-3 px-4">Thời Điểm Quét</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {planDetail.logs.map(log => (
                      <tr key={log.logId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">
                          #{log.logId}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">
                          #{log.batchId}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {log.countedQuantity.toLocaleString()} {log.unit}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {log.locationScanned || '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {log.note || '-'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-emerald-700">
                          {log.countedBy}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(log.countedAt).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO KẾ HOẠCH KIỂM KÊ THEO BATCH (TRƯỞNG PHÒNG KHO) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-purple-700 font-black text-base">
                <Plus className="w-5 h-5" />
                <span>Tạo Kế Hoạch Kiểm Kê Theo Batch (UC-18)</span>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên Kế Hoạch Kiểm Kê <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Kiểm kê Lô Hàng Dãy Kệ A - Tháng 08/2026"
                  value={createForm.planName}
                  onChange={e => setCreateForm({ ...createForm, planName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Kho</label>
                  <input
                    type="text"
                    value={createForm.warehouseCode || '20020100'}
                    onChange={e => setCreateForm({ ...createForm, warehouseCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phương Thức Chọn Lô</label>
                  <select
                    value={createForm.auditType}
                    onChange={e => setCreateForm({ ...createForm, auditType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="LOCATION_RANGE">Theo Dãy Kệ (Tiền tố vị trí)</option>
                    <option value="BATCH_LIST">Theo Danh Sách Batch Cụ Thể</option>
                    <option value="MATERIAL_GROUP">Theo Mã Vật Tư</option>
                    <option value="AGING">Lô Lưu Kho Lâu Ngày (Aging)</option>
                    <option value="ALL">Toàn Bộ Kho (Tất cả Lô đang còn tồn)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Input based on AuditType */}
              {createForm.auditType === 'LOCATION_RANGE' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tiền Tố Vị Trí Ô Kệ <span className="text-slate-400 font-normal">(VD: 01- cho Dãy Kệ A, hoặc để trống để chọn toàn bộ)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 01- hoặc 02- (Để trống nếu kiểm kê tất cả)"
                    value={createForm.locationPrefix || ''}
                    onChange={e => setCreateForm({ ...createForm, locationPrefix: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {createForm.auditType === 'BATCH_LIST' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nhập Danh Sách Mã Batch (Cách nhau bằng dấu phẩy, khoảng trắng hoặc xuống dòng)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="VD: 12791, 12792, 12794, 12854..."
                    value={rawBatchIdsInput}
                    onChange={e => setRawBatchIdsInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              {createForm.auditType === 'MATERIAL_GROUP' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Chọn Vật Tư Cần Kiểm Kê <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm theo Mã VT, Tên vật tư (VD: VRDC04EP, Vỉ nhựa...)"
                        value={materialSearchText}
                        onChange={e => handleSearchMaterials(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>

                    {/* Danh sách gợi ý vật tư */}
                    {materialOptions.length > 0 && !selectedMaterial && (
                      <div className="mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 z-10">
                        {materialOptions.slice(0, 50).map(m => (
                          <button
                            key={m.materialId}
                            type="button"
                            onClick={() => handleSelectMaterial(m)}
                            className="w-full px-3 py-2 text-left hover:bg-purple-50 transition-colors flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <span className="font-mono font-bold text-purple-700">{m.materialId}</span>
                              {m.materialName && <span className="ml-2 text-slate-700 font-medium">{m.materialName}</span>}
                            </div>
                            <div className="text-right font-mono text-xs font-semibold text-slate-600">
                              Tồn: {m.systemQuantity.toLocaleString()} {m.unit || ''}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Thông tin vật tư đã chọn */}
                  {selectedMaterial && (
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-800 text-sm">{selectedMaterial.materialId}</span>
                          <span className="text-slate-800 font-semibold">{selectedMaterial.materialName}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                          Tổng tồn hệ thống: <strong className="text-purple-700">{selectedMaterial.systemQuantity.toLocaleString()} {selectedMaterial.unit}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMaterial(null);
                          setAvailableBatches([]);
                          setSelectedBatchIds([]);
                          setMaterialSearchText('');
                        }}
                        className="px-2 py-1 text-xs text-purple-700 hover:bg-purple-100 rounded-lg font-bold cursor-pointer"
                      >
                        Đổi vật tư khác
                      </button>
                    </div>
                  )}

                  {/* Danh sách Lô hàng của vật tư */}
                  {selectedMaterial && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleSelectAllBatches}
                            className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                          >
                            {selectedBatchIds.length === availableBatches.length && availableBatches.length > 0 ? (
                              <CheckSquare className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                            <span>{selectedBatchIds.length === availableBatches.length && availableBatches.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
                          </button>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600 font-semibold">
                            Đã chọn: <strong className="text-purple-700">{selectedBatchIds.length}</strong> / {availableBatches.length} Lô
                          </span>
                        </div>
                        {availableBatches.length > 0 && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Tổng tồn chọn: <strong>{availableBatches.filter(b => selectedBatchIds.includes(b.batchId)).reduce((sum, b) => sum + (b.quantity || 0), 0).toLocaleString()}</strong> {selectedMaterial.unit}
                          </span>
                        )}
                      </div>

                      {isLoadingBatches ? (
                        <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                          <span>Đang nạp danh sách Lô của vật tư...</span>
                        </div>
                      ) : availableBatches.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500">
                          Vật tư này hiện không còn Lô nào có số lượng tồn &gt; 0 trong kho.
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                          {availableBatches.map(b => {
                            const isChecked = selectedBatchIds.includes(b.batchId);
                            return (
                              <div
                                key={b.batchId}
                                onClick={() => toggleBatchSelect(b.batchId)}
                                className={`px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                                  isChecked ? 'bg-purple-50/40' : 'opacity-60'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  />
                                  <div>
                                    <span className="font-mono font-bold text-slate-800">Lô #{b.batchId}</span>
                                    <span className="ml-2 text-[11px] text-slate-500 font-mono">
                                      Kệ: <strong className="text-slate-700">{b.locationCode || 'N/A'}</strong>
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right font-mono">
                                  <span className="font-bold text-purple-700">{b.quantity.toLocaleString()}</span> {b.unit}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {createForm.auditType === 'AGING' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Ngày Lưu Kho Tối Thiểu</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="VD: 90 (ngày)"
                    value={createForm.agingDays || ''}
                    onChange={e => setCreateForm({ ...createForm, agingDays: parseInt(e.target.value, 10) || undefined })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi Chú Kế Hoạch</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về đợt kiểm kê..."
                  value={createForm.note || ''}
                  onChange={e => setCreateForm({ ...createForm, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPlan}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreatingPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang Snapshot...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Tạo & Snapshot Số Dư</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TRƯỞNG PHÒNG KHO PHÊ DUYỆT CHỐT SỐ LỆCH & CÂN ĐỐI KHO */}
      {/* ========================================================================= */}
      {showApproveModal && planDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-base">
                <FileCheck className="w-5 h-5" />
                <span>Trưởng Phòng Phê Duyệt Chốt Số Lệch & Cân Đối Kho</span>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs overflow-y-auto pr-1">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-emerald-700" />
                  <span>Xác nhận cân đối kho theo Use Case UC-18 / INV-06:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                  <li>Hệ thống sẽ tự động sinh giao dịch <strong>ADJ_UP</strong> (tăng kho) cho các Lô đếm thừa.</li>
                  <li>Hệ thống sẽ tự động sinh giao dịch <strong>ADJ_DWN</strong> (giảm kho) cho các Lô đếm thiếu.</li>
                  <li>Kế hoạch sẽ được chốt sổ và chuyển sang trạng thái <strong>Đã Phê Duyệt Hoàn Tất</strong>.</li>
                </ul>
              </div>

              {/* Danh sách các Lô bị lệch cần xác nhận lý do */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Danh Sách Lô Phát Sinh Chênh Lệch ({discrepantBatches.length} Lô)
                </label>
                {discrepantBatches.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-center">
                    Tất cả các Lô đã đếm đều khớp 100% với số dư sổ sách!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {discrepantBatches.map(b => (
                      <div
                        key={b.detailId}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-purple-700">#{b.batchId}</span>
                            <span className="font-mono text-slate-900">{b.materialId}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{b.materialName}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] text-slate-500">
                            Snapshot: {b.snapshotQuantity} ➔ Đếm: {b.actualQuantity}
                          </div>
                          <div className={`font-mono font-bold ${b.differenceQuantity! > 0 ? 'text-purple-600' : 'text-rose-600'}`}>
                            {b.differenceQuantity! > 0 ? `+${b.differenceQuantity}` : b.differenceQuantity} {b.unit}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ghi chú giải trình chung của Trưởng phòng kho */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Ý Kiến / Ghi Chú Lý Do Giải Trình Của Trưởng Phòng Kho <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="VD: Đã đối soát hiện trường và xác nhận số lệch do hao hụt đóng gói và bù trừ đợt xuất #721..."
                  value={approvalNote}
                  onChange={e => setApprovalNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleApproveVariance}
                disabled={isApproving || !approvalNote.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Phê Duyệt & Cân Đối...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Ký Duyệt & Chốt Cân Đối Kho</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
