import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  FileText,
  Calendar,
  Layers,
  Building2,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';
import {
  planningService,
  MonthlyQuotaItem,
  MonthlyQuotaKpis,
  PlanningUnitItem,
  QuotaUsageHistoryResponse
} from '../api/planningApi';

interface QuotaMonitoringTabProps {
  planningUnits: PlanningUnitItem[];
  currentUnit: string;
  onSelectUnit: (unit: string) => void;
  currentMonth: number;
  currentYear: number;
}

export const QuotaMonitoringTab: React.FC<QuotaMonitoringTabProps> = ({
  planningUnits,
  currentUnit,
  onSelectUnit,
  currentMonth,
  currentYear
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUnit || 'ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, WARNING, OVER, ACTIVE, INACTIVE
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);

  const [items, setItems] = useState<MonthlyQuotaItem[]>([]);
  const [kpis, setKpis] = useState<MonthlyQuotaKpis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History Traceability Modal
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [historyData, setHistoryData] = useState<QuotaUsageHistoryResponse | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const loadData = async (targetPage: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await planningService.getMonthlyQuota(
        selectedUnit,
        selectedMonth,
        selectedYear,
        searchQuery,
        statusFilter,
        targetPage,
        pageSize
      );
      setItems(res.items || []);
      setKpis(res.kpis || null);
      setPage(targetPage);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi tải danh sách theo dõi định mức');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [selectedUnit, selectedMonth, selectedYear, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
  };

  const handleToggleStatus = async (item: MonthlyQuotaItem) => {
    const newStatus = item.isActive === 1 ? 0 : 1;
    const actionText = newStatus === 1 ? 'Mở kích hoạt' : 'Khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} dòng định mức cho vật tư [${item.materialId}]?`)) {
      return;
    }

    try {
      await planningService.toggleQuotaStatus(item.planId, newStatus);
      loadData(page);
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật trạng thái định mức');
    }
  };

  const handleOpenHistoryModal = async (planId: number) => {
    setSelectedPlanId(planId);
    setIsLoadingHistory(true);
    setHistoryData(null);
    try {
      const data = await planningService.getQuotaUsageHistory(planId);
      setHistoryData(data);
    } catch (err: any) {
      alert(err.message || 'Lỗi tải lịch sử sử dụng định mức');
      setSelectedPlanId(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng Số SKU</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{kpis.totalSkuCount.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Mặt hàng có định mức</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Định Mức Giao (A)</div>
            <div className="text-xl font-extrabold text-blue-700 font-mono">{kpis.totalLimitQuantity.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Tổng sản lượng tháng</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Đã Đề Nghị (B)</div>
            <div className="text-xl font-extrabold text-amber-700 font-mono">{kpis.totalRequestedQuantity.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Lượng trên các phiếu ĐN</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Thực Xuất (C)</div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">{kpis.totalIssuedQuantity.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Đã chốt xuất kho</div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Cảnh Báo Sắp Hết</div>
            <div className="text-xl font-extrabold text-amber-900 font-mono">{kpis.warningCount.toLocaleString()}</div>
            <div className="text-[11px] text-amber-700 mt-1">Tiêu hao 80% - 99%</div>
          </div>

          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-2xs">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">Vượt / Hết Hạn Mức</div>
            <div className="text-xl font-extrabold text-rose-900 font-mono">{kpis.overLimitCount.toLocaleString()}</div>
            <div className="text-[11px] text-rose-700 mt-1">Tiêu hao ≥ 100%</div>
          </div>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Filter */}
          <select
            value={selectedUnit}
            onChange={e => {
              setSelectedUnit(e.target.value);
              onSelectUnit(e.target.value);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">🏢 Tất cả đơn vị kế hoạch</option>
            {planningUnits.map(u => (
              <option key={u.code} value={u.code}>{u.name}</option>
            ))}
          </select>

          {/* Month & Year */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Tháng {m < 10 ? `0${m}` : m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>

          {/* Status Quick Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">📊 Tất cả trạng thái</option>
            <option value="WARNING">🟡 Cảnh báo sắp hết (80-99%)</option>
            <option value="OVER">🔴 Vượt / Hết định mức (≥100%)</option>
            <option value="ACTIVE">🟢 Đang hoạt động</option>
            <option value="INACTIVE">⚪ Đã khóa</option>
          </select>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm mã SKU, tên vật tư, mã Bravo..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none w-56 sm:w-72"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tìm
          </button>
          <button
            type="button"
            onClick={() => loadData(1)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* 3. Data Monitoring Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-semibold">Đang tải dữ liệu theo dõi định mức từ CSDL...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Không tìm thấy dòng định mức nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3 w-32">Mã SKU</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Tên Vật Tư</th>
                  <th className="py-2.5 px-3 w-36">Đơn Vị Kế Hoạch</th>
                  <th className="py-2.5 px-3 w-28 text-right text-blue-900 bg-blue-50/50">Định Mức (A)</th>
                  <th className="py-2.5 px-3 w-28 text-right text-amber-900 bg-amber-50/50">Đã ĐN (B)</th>
                  <th className="py-2.5 px-3 w-28 text-right text-emerald-900 bg-emerald-50/50">Thực Xuất (C)</th>
                  <th className="py-2.5 px-3 w-28 text-right font-extrabold text-slate-900 bg-slate-50">Còn Lại (A-B)</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Tiến Độ Tiêu Hao</th>
                  <th className="py-2.5 px-3 w-24 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-3 w-24 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const isOver = item.consumptionPercentage >= 100;
                  const isWarn = item.consumptionPercentage >= 80 && item.consumptionPercentage < 100;
                  const barColor = isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500';

                  return (
                    <tr
                      key={item.planId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.isActive === 0 ? 'opacity-60 bg-slate-50' : isOver ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">
                        {(page - 1) * pageSize + idx + 1}
                      </td>

                      {/* SKU */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {item.materialId}
                        {item.bravoId && (
                          <div className="text-[10px] font-normal text-slate-400 font-mono">{item.bravoId}</div>
                        )}
                      </td>

                      {/* Material Name & Unit */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 leading-tight">{item.materialName || '—'}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                          ĐVT: {item.unit || 'Cái'}
                        </span>
                      </td>

                      {/* Planning Unit */}
                      <td className="py-2.5 px-3 font-semibold text-slate-700 text-[11px]">
                        {item.planningUnitName || item.planningUnit}
                      </td>

                      {/* (A) Limit */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-800 bg-blue-50/30">
                        {item.limitQuantity.toLocaleString()}
                      </td>

                      {/* (B) Requested */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800 bg-amber-50/30">
                        {item.requestedQuantity.toLocaleString()}
                      </td>

                      {/* (C) Issued */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 bg-emerald-50/30">
                        {item.issuedQuantity.toLocaleString()}
                      </td>

                      {/* (A-B) Remaining */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold bg-slate-50/50">
                        <span className={item.remainingQuantity === 0 && item.limitQuantity > 0 ? 'text-rose-600' : 'text-slate-900'}>
                          {item.remainingQuantity.toLocaleString()}
                        </span>
                      </td>

                      {/* Progress Bar & Percentage */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-between text-[10px] font-bold font-mono mb-1">
                          <span className={isOver ? 'text-rose-600' : isWarn ? 'text-amber-600' : 'text-emerald-700'}>
                            {item.consumptionPercentage.toFixed(1)}%
                          </span>
                          <span className="text-slate-400">
                            {item.requestedQuantity} / {item.limitQuantity}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${barColor} transition-all duration-300`}
                            style={{ width: `${Math.min(100, item.consumptionPercentage)}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        {item.isActive === 1 ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            Kích hoạt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold text-[10px]">
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenHistoryModal(item.planId)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                            title="Truy vết lịch sử các phiếu xuất trừ vào định mức này"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.isActive === 1
                                ? 'bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={item.isActive === 1 ? 'Khóa dòng định mức' : 'Mở lại dòng định mức'}
                          >
                            {item.isActive === 1 ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. History Traceability Modal */}
      {selectedPlanId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold">Truy Vết Sử Dụng Định Mức #{selectedPlanId}</h3>
                  <p className="text-xs text-slate-300">
                    Danh sách chi tiết tất cả các Phiếu Yêu Cầu & Chứng Từ Xuất Kho đã trừ vào hạn mức này
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanId(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {isLoadingHistory ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  <span className="text-xs font-semibold">Đang tải lịch sử phiếu xuất...</span>
                </div>
              ) : historyData ? (
                <>
                  {/* Header Summary */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Mã Vật Tư</span>
                      <span className="font-mono font-extrabold text-slate-900">{historyData.header.materialId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Tên Vật Tư</span>
                      <span className="font-semibold text-slate-800">{historyData.header.materialName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Đơn Vị Kế Hoạch</span>
                      <span className="font-semibold text-slate-800">{historyData.header.planningUnitName || historyData.header.planningUnit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Định Mức / Đã Dùng</span>
                      <span className="font-mono font-bold text-emerald-800">
                        {historyData.header.requestedQuantity} / {historyData.header.limitQuantity} {historyData.header.unit}
                      </span>
                    </div>
                  </div>

                  {/* Requests Table */}
                  {historyData.requests.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl">
                      Chưa có phiếu yêu cầu xuất kho nào phát sinh trừ vào định mức này.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Mã Phiếu YC</th>
                            <th className="py-2.5 px-3">Ngày Lập</th>
                            <th className="py-2.5 px-3">Người Lập</th>
                            <th className="py-2.5 px-3 text-right">SL Đề Nghị</th>
                            <th className="py-2.5 px-3 text-right">SL Thực Xuất</th>
                            <th className="py-2.5 px-3">Trạng Thái</th>
                            <th className="py-2.5 px-3">Phiếu Trans</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {historyData.requests.map((req, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">
                                #{req.requestId} ({req.requestCode})
                              </td>
                              <td className="py-2 px-3 text-slate-500 font-mono">
                                {req.requestDate ? new Date(req.requestDate).toLocaleDateString('vi-VN') : '—'}
                              </td>
                              <td className="py-2 px-3 text-slate-700">{req.requester || '—'}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-amber-800">
                                {req.requestedQuantity} {req.unit}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                                {req.issuedQuantity} {req.unit}
                              </td>
                              <td className="py-2 px-3">
                                {req.pickingStatus === '2' ? (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                    Đã xuất kho
                                  </span>
                                ) : req.pickingStatus === '1' ? (
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                    Đang soạn hàng
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                                    Chờ soạn
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-500">
                                {req.issueDocumentId ? `#${req.issueDocumentId}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedPlanId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
