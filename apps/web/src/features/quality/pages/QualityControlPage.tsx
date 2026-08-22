import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Printer,
  Sliders,
  Award,
  Layers,
  Clock,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  Eye,
  Check,
  X,
  ChevronLeft,
  ArrowRight,
  AlertCircle,
  History,
  FileText,
  Building2,
  Calendar,
  Link2
} from 'lucide-react';
import { useWarehouse } from '../../../app/providers/warehouseStore';
import {
  qualityService,
  InspectionCandidateReceipt,
  InspectionCandidateMaterial,
  EvaluationDetailResult,
  EvaluationCriterion,
  QcEvaluationItemInput,
  InspectionHistoryItem,
  InspectionResultDetail
} from '../../../features/quality/api/qualityApi';

export const QualityControlModule: React.FC = () => {
  const { currentUser, setActiveBarcodePrint } = useWarehouse();

  const [activeTab, setActiveTab] = useState<'candidates' | 'evaluate' | 'history'>('candidates');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real QC Candidates States (UC-13 / QC-03)
  const [candidateReceipts, setCandidateReceipts] = useState<InspectionCandidateReceipt[]>([]);
  const [candidateMaterials, setCandidateMaterials] = useState<InspectionCandidateMaterial[]>([]);
  const [candidateTotalCount, setCandidateTotalCount] = useState<number>(0);
  const [candidatePage, setCandidatePage] = useState<number>(1);
  const [isCandidatesLoading, setIsCandidatesLoading] = useState<boolean>(false);
  const [isCandidateDetailLoading, setIsCandidateDetailLoading] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<InspectionCandidateReceipt | null>(null);

  // Real QC Evaluation States (UC-14 / QC-04)
  const [activeInspectionId, setActiveInspectionId] = useState<number | null>(null);
  const [evaluationData, setEvaluationData] = useState<EvaluationDetailResult | null>(null);
  const [selectedReceivingLineId, setSelectedReceivingLineId] = useState<number | null>(null);
  const [isEvaluationLoading, setIsEvaluationLoading] = useState<boolean>(false);

  // Form Evaluation Inputs
  const [inspectionType, setInspectionType] = useState<'AQL' | '100%'>('100%');
  const [inspectedQty, setInspectedQty] = useState<number>(0);
  const [failedQty, setFailedQty] = useState<number>(0);
  const [criterionResults, setCriterionResults] = useState<Record<number, { resultCode: 'Đạt' | 'Không Đạt' | 'Không Kiểm'; defectNote: string }>>({});
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState<boolean>(false);
  const [evaluationSuccessMsg, setEvaluationSuccessMsg] = useState<string | null>(null);

  // Real QC History States (QC-05)
  const [historyItems, setHistoryItems] = useState<InspectionHistoryItem[]>([]);
  const [historyDetails, setHistoryDetails] = useState<InspectionResultDetail[]>([]);
  const [historyTotalCount, setHistoryTotalCount] = useState<number>(0);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<InspectionHistoryItem | null>(null);

  // Load candidate receipts awaiting QC
  const loadCandidates = async (search?: string, page: number = 1) => {
    setIsCandidatesLoading(true);
    try {
      const data = await qualityService.getInspectionCandidates(search, undefined, page, 20);
      setCandidateReceipts(data.receipts || []);
      setCandidateMaterials(data.materials || []);
      setCandidateTotalCount(data.totalCount || 0);
      setCandidatePage(page);

      if (data.receipts && data.receipts.length > 0) {
        if (!selectedCandidate || !data.receipts.some(r => r.receiptId === selectedCandidate.receiptId)) {
          setSelectedCandidate(data.receipts[0]);
        }
      } else {
        setSelectedCandidate(null);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách chờ kiểm QC:', err);
    } finally {
      setIsCandidatesLoading(false);
    }
  };

  // Tự động tải chi tiết vật tư khi chọn phiếu nhận nếu chưa có trong bộ nhớ
  useEffect(() => {
    if (selectedCandidate?.receiptId) {
      const hasMaterials = candidateMaterials.some(m => m.receiptId === selectedCandidate.receiptId);
      if (!hasMaterials) {
        setIsCandidateDetailLoading(true);
        qualityService.getInspectionCandidates(undefined, selectedCandidate.receiptId, 1, 100)
          .then(data => {
            if (data.materials && data.materials.length > 0) {
              setCandidateMaterials(prev => [
                ...prev.filter(m => m.receiptId !== selectedCandidate.receiptId),
                ...data.materials
              ]);
            }
          })
          .catch(err => console.warn('Lỗi tải chi tiết vật tư phiếu nhận:', err))
          .finally(() => setIsCandidateDetailLoading(false));
      }
    }
  }, [selectedCandidate?.receiptId]);

  // Load inspection history (QC-05)
  const loadHistory = async (search?: string, page: number = 1) => {
    setIsHistoryLoading(true);
    try {
      const data = await qualityService.getInspectionHistory(search, undefined, page, 20);
      setHistoryItems(data.items || []);
      setHistoryDetails(data.details || []);
      setHistoryTotalCount(data.totalCount || 0);
      setHistoryPage(page);

      if (data.items && data.items.length > 0) {
        if (!selectedHistoryItem || !data.items.some(h => h.inspectionId === selectedHistoryItem.inspectionId)) {
          setSelectedHistoryItem(data.items[0]);
        }
      } else {
        setSelectedHistoryItem(null);
      }
    } catch (err) {
      console.warn('Lỗi tải lịch sử QC:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Start / Open Inspection for a candidate receipt (UC-13 -> UC-14)
  const handleOpenInspection = async (receiptId: number, preferredLineId?: number) => {
    setIsEvaluationLoading(true);
    try {
      // 1. Create or get existing inspection ticket (QC-03)
      const res = await qualityService.createInspection({ receiptId, note: 'Khởi tạo phiếu kiểm QC từ giao diện MMS Web' });
      setActiveInspectionId(res.inspectionId);

      // 2. Load evaluation criteria and material lines (QC-04)
      const evalData = await qualityService.getEvaluation(res.inspectionId);
      setEvaluationData(evalData);

      const targetLine = preferredLineId && evalData.materials.some(m => m.receivingLineId === preferredLineId)
        ? preferredLineId
        : evalData.materials[0]?.receivingLineId;

      setSelectedReceivingLineId(targetLine || null);
      initLineCriteria(targetLine, evalData);
      setActiveTab('evaluate');
    } catch (err: any) {
      alert('Lỗi lập/mở phiếu kiểm QC: ' + (err.message || err));
    } finally {
      setIsEvaluationLoading(false);
    }
  };

  // Initialize form criteria when selecting a material line
  const initLineCriteria = (lineId: number | undefined, data?: EvaluationDetailResult | null) => {
    const currentData = data || evaluationData;
    if (!lineId || !currentData) return;

    const line = currentData.materials.find(m => m.receivingLineId === lineId);
    if (line) {
      setInspectedQty(line.quantityReceived);
      setFailedQty(0);
    }

    const lineCriteria = currentData.criteria.filter(c => c.receivingLineId === lineId);
    const initialResults: Record<number, { resultCode: 'Đạt' | 'Không Đạt' | 'Không Kiểm'; defectNote: string }> = {};
    lineCriteria.forEach(c => {
      initialResults[c.criterionId] = {
        resultCode: (c.resultCode as any) || 'Đạt',
        defectNote: c.defectNote || ''
      };
    });
    setCriterionResults(initialResults);
  };

  // Submit material line evaluation (QC-04)
  const handleSubmitEvaluation = async (overallResult: '1' | '2' | '3') => {
    if (!activeInspectionId || !selectedReceivingLineId || !evaluationData) return;
    const line = evaluationData.materials.find(m => m.receivingLineId === selectedReceivingLineId);
    if (!line) return;

    const lineCriteria = evaluationData.criteria.filter(c => c.receivingLineId === selectedReceivingLineId);
    const results: QcEvaluationItemInput[] = lineCriteria.map(c => ({
      criterionId: c.criterionId,
      resultCode: criterionResults[c.criterionId]?.resultCode || (overallResult === '1' ? 'Đạt' : 'Không Đạt'),
      defectNote: criterionResults[c.criterionId]?.defectNote || undefined
    }));

    if (overallResult === '1' && (failedQty > 0 || results.some(r => r.resultCode === 'Không Đạt'))) {
      alert('Kết luận Đạt (Pass) không thể có số lượng lỗi > 0 hoặc tiêu chí Không Đạt!');
      return;
    }

    if (overallResult === '2' && failedQty === 0 && !results.some(r => r.resultCode === 'Không Đạt')) {
      alert('Kết luận Không Đạt (Fail) cần nhập số lượng lỗi > 0 hoặc ít nhất 1 tiêu chí Không Đạt!');
      return;
    }

    setIsSubmittingEvaluation(true);
    try {
      const res = await qualityService.evaluateMaterial(activeInspectionId, {
        receivingLineId: selectedReceivingLineId,
        inspectionType,
        inspectedQuantity: inspectedQty,
        failedQuantity: failedQty,
        overallResultCode: overallResult,
        results
      });

      const label = overallResult === '1' ? '✅ ĐẠT (Pass - Sẵn sàng nhập kho)' : overallResult === '2' ? '❌ KHÔNG ĐẠT (Fail)' : '⚠️ NHÂN NHƯỢNG';
      setEvaluationSuccessMsg(`Đã lưu kết quả cho SKU ${line.materialId}: ${label}! Phiếu nhận đã được chuyển trạng thái sẵn sàng nhập kho.`);
      setTimeout(() => setEvaluationSuccessMsg(null), 6000);

      // Reload evaluation data
      const nextEval = await qualityService.getEvaluation(activeInspectionId);
      setEvaluationData(nextEval);
      loadCandidates(searchQuery, candidatePage);
    } catch (err: any) {
      alert('Lỗi lưu kết quả đánh giá QC: ' + (err.message || err));
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  useEffect(() => {
    loadCandidates(searchQuery, candidatePage);
    loadHistory(searchQuery, historyPage);
  }, []);

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CheckSquare className="w-4 h-4" /> Quality Control & Inspection
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Kiểm Soát Chất Lượng Vật Tư Đầu Vào (UC-13 / UC-14)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lập phiếu kiểm QC-03, đo đạc tiêu chuẩn kỹ thuật QC-04 và xem lại toàn bộ lịch sử các đợt kiểm định trên CSDL MMS1.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('candidates');
              loadCandidates(searchQuery, 1);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'candidates'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Hàng Đợi Chờ Kiểm ({candidateTotalCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              loadHistory(searchQuery, 1);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Lịch Sử Phiếu Kiểm ({historyTotalCount})
          </button>
          <button
            onClick={() => setActiveTab('evaluate')}
            disabled={!activeInspectionId}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              activeTab === 'evaluate'
                ? 'bg-emerald-700 text-white shadow-sm font-bold'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> Đánh Giá Tiêu Chuẩn (UC-14)
            {activeInspectionId && <span className="text-[10px] font-mono bg-emerald-800 text-white px-1.5 py-0.2 rounded-full">#{activeInspectionId}</span>}
          </button>
        </div>
      </div>

      {evaluationSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{evaluationSuccessMsg}</span>
          </div>
          <button onClick={() => setEvaluationSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'candidates' ? (
        /* UC-13 / QC-03: Candidate Queue */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    loadCandidates(e.target.value, 1);
                  }}
                  placeholder="Tìm mã phiếu, PO, nhà cung cấp..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-72"
                />
              </div>
            </div>

            <button
              onClick={() => loadCandidates(searchQuery, candidatePage)}
              disabled={isCandidatesLoading}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isCandidatesLoading ? 'animate-spin' : ''}`} />
              Làm mới ({candidateTotalCount})
            </button>
          </div>

          {/* Master Detail Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Receipts */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span>Phiếu Chờ Kiểm ({candidateTotalCount})</span>
              </div>

              {isCandidatesLoading ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                  Đang tải danh sách chờ kiểm từ CSDL MMS1...
                </div>
              ) : candidateReceipts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                  Không có phiếu nhận nào đang chờ kiểm định QC.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {candidateReceipts.map(receipt => {
                    const isSelected = selectedCandidate?.receiptId === receipt.receiptId;
                    return (
                      <div
                        key={receipt.receiptId}
                        onClick={() => setSelectedCandidate(receipt)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-1 ring-blue-500'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-blue-800 font-mono">
                            Phiếu #{receipt.receiptId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {receipt.pendingMaterialCount} vật tư chờ QC
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {receipt.customerName || 'Nhà Cung Cấp'}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span className="font-mono">PO: <strong className="text-slate-700">{receipt.purchaseOrder || '—'}</strong></span>
                          <span>Kho: {receipt.warehouseCode || '20020100'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {candidateTotalCount > 20 && (
                <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Trang {candidatePage} / {Math.ceil(candidateTotalCount / 20)}</span>
                  <div className="flex gap-1">
                    <button
                      disabled={candidatePage <= 1}
                      onClick={() => loadCandidates(searchQuery, candidatePage - 1)}
                      className="px-2.5 py-1 bg-slate-100 rounded disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={candidatePage >= Math.ceil(candidateTotalCount / 20)}
                      onClick={() => loadCandidates(searchQuery, candidatePage + 1)}
                      className="px-2.5 py-1 bg-slate-100 rounded disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Material Lines of Selected Receipt */}
            <div className="lg:col-span-7 space-y-4">
              {selectedCandidate ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 font-mono text-base">
                          Danh Sách Vật Tư Cần Kiểm Phiếu #{selectedCandidate.receiptId}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        NCC: <strong className="text-slate-800">{selectedCandidate.customerName}</strong> • PO: <strong className="font-mono text-slate-800">{selectedCandidate.purchaseOrder}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isEvaluationLoading}
                      onClick={() => handleOpenInspection(selectedCandidate.receiptId)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {isEvaluationLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tải...</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span>Lập Phiếu & Đánh Giá QC (UC-13/14)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Material Cards */}
                  <div className="space-y-3">
                    {isCandidateDetailLoading ? (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center gap-2 text-xs text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Đang tải danh sách vật tư cần kiểm...</span>
                      </div>
                    ) : candidateMaterials.filter(m => m.receiptId === selectedCandidate.receiptId).length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                        Không có vật tư nào chờ kiểm QC cho phiếu #{selectedCandidate.receiptId}.
                      </div>
                    ) : (
                      candidateMaterials
                        .filter(m => m.receiptId === selectedCandidate.receiptId)
                        .map((mat, idx) => (
                          <div
                            key={mat.receivingLineId || idx}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                          >
                            <div className="space-y-1 max-w-md">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-blue-700">
                                  {mat.materialId}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                  Mã kiểm: #{mat.checkId}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-800">
                                {mat.materialName}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Số lượng nhận: <strong className="text-slate-800">{mat.quantityReceived} {mat.unit}</strong>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenInspection(selectedCandidate.receiptId, mat.receivingLineId)}
                              className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <span>Kiểm Tra</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                  <CheckSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  Bấm chọn một phiếu nhận ở danh sách bên trái để xem các vật tư cần kiểm định.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'history' ? (
        /* QC-05: Inspection History View */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    loadHistory(e.target.value, 1);
                  }}
                  placeholder="Tìm theo mã phiếu kiểm, PO, NCC..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-72"
                />
              </div>
            </div>

            <button
              onClick={() => loadHistory(searchQuery, historyPage)}
              disabled={isHistoryLoading}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
              Làm mới ({historyTotalCount})
            </button>
          </div>

          {/* Master Detail Layout for History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: History Inspection Tickets */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                <span>Hồ Sơ Phiếu Kiểm QC ({historyTotalCount})</span>
              </div>

              {isHistoryLoading ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                  Đang tải hồ sơ lịch sử từ CSDL MMS1...
                </div>
              ) : historyItems.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                  Không tìm thấy hồ sơ phiếu kiểm nào.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {historyItems.map(item => {
                    const isSelected = selectedHistoryItem?.inspectionId === item.inspectionId;
                    return (
                      <div
                        key={item.inspectionId}
                        onClick={() => setSelectedHistoryItem(item)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-extrabold text-xs text-emerald-800">
                            Phiếu Kiểm #{item.inspectionId}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800 truncate">
                          {item.customerName || 'Nhà Cung Cấp'}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                          <span className="font-mono">Phiếu nhận: <strong className="text-slate-700">#{item.receiptId}</strong></span>
                          <span>{item.evaluatedMaterialCount} SKU • {item.resultRowCount} tiêu chí</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {historyTotalCount > 20 && (
                <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Trang {historyPage} / {Math.ceil(historyTotalCount / 20)}</span>
                  <div className="flex gap-1">
                    <button
                      disabled={historyPage <= 1}
                      onClick={() => loadHistory(searchQuery, historyPage - 1)}
                      className="px-2.5 py-1 bg-slate-100 rounded disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={historyPage >= Math.ceil(historyTotalCount / 20)}
                      onClick={() => loadHistory(searchQuery, historyPage + 1)}
                      className="px-2.5 py-1 bg-slate-100 rounded disabled:opacity-40"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Detailed Criteria Results */}
            <div className="lg:col-span-7 space-y-4">
              {selectedHistoryItem ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 font-mono text-base">
                          Nội Dung Đánh Giá QC Phiếu #{selectedHistoryItem.inspectionId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Chỉ Xem / Read-Only
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Phiếu nhận: <strong className="text-slate-800 font-mono">#{selectedHistoryItem.receiptId}</strong> • PO: <strong className="font-mono text-slate-800">{selectedHistoryItem.purchaseOrder || '—'}</strong> • NCC: <strong className="text-slate-800">{selectedHistoryItem.customerName}</strong>
                      </div>
                      {selectedHistoryItem.note && (
                        <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 italic">
                          Ghi chú: {selectedHistoryItem.note}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3 w-56">Vật Tư (Mã & Tên)</th>
                          <th className="p-3">Tiêu Chí Kiểm Tra</th>
                          <th className="p-3 text-center w-28">Phương Pháp</th>
                          <th className="p-3 text-center w-24">Đánh Giá</th>
                          <th className="p-3">Ghi Chú Lỗi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyDetails
                          .filter(d => d.inspectionId === selectedHistoryItem.inspectionId)
                          .map((d, idx) => {
                            const isPass = d.resultCode === 'Đạt';
                            const isFail = d.resultCode === 'Không Đạt';
                            return (
                              <tr key={d.qcResultId || idx} className="hover:bg-slate-50/60">
                                <td className="p-3">
                                  <div className="font-mono font-bold text-blue-700 text-xs">
                                    {d.materialId}
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-800 line-clamp-2 mt-0.5" title={d.materialName || ''}>
                                    {d.materialName || '—'}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-800">{d.criterionCode}</div>
                                  <div className="text-[11px] text-slate-500">{d.criterionName}</div>
                                </td>
                                <td className="p-3 text-center font-mono text-slate-600">
                                  {d.inspectionType || '100%'}
                                </td>
                                <td className="p-3 text-center">
                                  {isPass ? (
                                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 inline-block">
                                      Đạt
                                    </span>
                                  ) : isFail ? (
                                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 inline-block">
                                      Lỗi
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 inline-block">
                                      {d.resultCode || 'Bỏ qua'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-slate-600 italic">
                                  {d.defectNote || '—'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                  <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  Bấm chọn một phiếu kiểm ở danh sách bên trái để xem kết quả chi tiết từng tiêu chí.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'evaluate' && evaluationData ? (
        /* UC-14 / QC-04: Detailed Technical Evaluation View */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  <Sliders className="w-4 h-4" /> UC-14 / QC-04: Đánh Giá Tiêu Chuẩn Kỹ Thuật
                </div>
                <h2 className="font-extrabold text-slate-900 text-lg mt-0.5">
                  Phiếu Kiểm QC #{evaluationData.inspection.inspectionId} (Phiếu Nhận #{evaluationData.inspection.receiptId})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  NCC: <strong className="text-slate-800">{evaluationData.inspection.customerName}</strong> • PO: <strong className="font-mono text-slate-800">{evaluationData.inspection.purchaseOrder}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('candidates')}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Quay lại Hàng Đợi
                </button>
              </div>
            </div>

            {/* Material Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {evaluationData.materials.map(mat => {
                const isSelected = selectedReceivingLineId === mat.receivingLineId;
                const isPassed = mat.overallResultCode === '1';
                const isFailed = mat.overallResultCode === '2';
                return (
                  <button
                    key={mat.receivingLineId}
                    type="button"
                    onClick={() => {
                      setSelectedReceivingLineId(mat.receivingLineId);
                      initLineCriteria(mat.receivingLineId);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="font-mono">{mat.materialId}</span>
                    {isPassed ? (
                      <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-bold rounded">Đạt (1)</span>
                    ) : isFailed ? (
                      <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded">Lỗi (2)</span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-amber-400 text-slate-900 text-[10px] font-bold rounded">Chờ kiểm</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Material Evaluation Form */}
            {selectedReceivingLineId && (
              <div className="space-y-6">
                {/* Sampling Parameters Bar */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phương Pháp Lấy Mẫu:</label>
                    <select
                      value={inspectionType}
                      onChange={e => setInspectionType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                    >
                      <option value="100%">Kiểm Tra 100% Lô Hàng</option>
                      <option value="AQL">Lấy Mẫu AQL Tiêu Chuẩn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số Lượng Đo Kiểm Tra:</label>
                    <input
                      type="number"
                      step="any"
                      value={inspectedQty}
                      onChange={e => setInspectedQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số Lượng Phát Hiện Lỗi:</label>
                    <input
                      type="number"
                      step="any"
                      value={failedQty}
                      onChange={e => setFailedQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-rose-700"
                    />
                  </div>
                </div>

                {/* Criteria Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5 w-12">#</th>
                        <th className="p-3.5">Mã & Tên Tiêu Chí Kỹ Thuật</th>
                        <th className="p-3.5">Tiêu Chuẩn / Thông Số Kỹ Thuật</th>
                        <th className="p-3.5 w-48 text-center">Đánh Giá Tiêu Chí</th>
                        <th className="p-3.5 w-64">Ghi Chú Lỗi / Mô Tả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {evaluationData.criteria
                        .filter(c => c.receivingLineId === selectedReceivingLineId)
                        .map((c, idx) => {
                          const res = criterionResults[c.criterionId]?.resultCode || 'Đạt';
                          const note = criterionResults[c.criterionId]?.defectNote || '';
                          return (
                            <tr key={c.criterionId || idx} className="hover:bg-slate-50/60">
                              <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-3.5">
                                <div className="font-bold text-slate-800">{c.criterionCode}</div>
                                <div className="text-[11px] text-slate-500">{c.criterionName}</div>
                              </td>
                              <td className="p-3.5 font-mono text-slate-700">
                                {c.specification || 'Theo bản vẽ kỹ thuật & mẫu chuẩn'}
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setCriterionResults(prev => ({
                                      ...prev,
                                      [c.criterionId]: { ...prev[c.criterionId], resultCode: 'Đạt' }
                                    }))}
                                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                      res === 'Đạt'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    Đạt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCriterionResults(prev => ({
                                      ...prev,
                                      [c.criterionId]: { ...prev[c.criterionId], resultCode: 'Không Đạt' }
                                    }))}
                                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                      res === 'Không Đạt'
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    Không Đạt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCriterionResults(prev => ({
                                      ...prev,
                                      [c.criterionId]: { ...prev[c.criterionId], resultCode: 'Không Kiểm' }
                                    }))}
                                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                                      res === 'Không Kiểm'
                                        ? 'bg-slate-600 text-white shadow-2xs'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    Bỏ qua
                                  </button>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <input
                                  type="text"
                                  value={note}
                                  onChange={e => setCriterionResults(prev => ({
                                    ...prev,
                                    [c.criterionId]: { ...prev[c.criterionId], defectNote: e.target.value }
                                  }))}
                                  placeholder="Ghi chú nếu có lỗi..."
                                  className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                                />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Final Decision Action Bar */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                      Kết Luận Đánh Giá Chất Lượng Cho Vật Tư
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      Sau khi kết luận ĐẠT, phiếu nhận sẽ được đưa vào hàng đợi Nhập Kho (UC-09) của Thủ kho.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isSubmittingEvaluation}
                      onClick={() => handleSubmitEvaluation('2')}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>❌ Không Đạt (Fail - 2)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingEvaluation}
                      onClick={() => handleSubmitEvaluation('3')}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>⚠️ Nhân Nhượng (3)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingEvaluation}
                      onClick={() => handleSubmitEvaluation('1')}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmittingEvaluation ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>✅ ĐẠT (Pass - 1) & Chốt Đủ Điều Kiện Nhập Kho</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

