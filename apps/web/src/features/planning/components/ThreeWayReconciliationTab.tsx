import React, { useState, useEffect } from 'react';
import {
  Scale,
  Search,
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Loader2,
  Info
} from 'lucide-react';
import {
  planningService,
  ThreeWayReconciliationItem,
  ThreeWayReconciliationKpis
} from '../api/planningApi';

interface ThreeWayReconciliationTabProps {
  currentMonth: number;
  currentYear: number;
}

export const ThreeWayReconciliationTab: React.FC<ThreeWayReconciliationTabProps> = ({
  currentMonth,
  currentYear
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [balanceStatus, setBalanceStatus] = useState<string>('ALL'); // ALL, SHORTAGE, OVERSTOCK, BALANCED
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);

  const [items, setItems] = useState<ThreeWayReconciliationItem[]>([]);
  const [kpis, setKpis] = useState<ThreeWayReconciliationKpis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async (targetPage: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await planningService.get3WayReconciliation(
        selectedMonth,
        selectedYear,
        balanceStatus,
        searchQuery,
        targetPage,
        pageSize
      );
      setItems(res.items || []);
      setKpis(res.kpis || null);
      setPage(targetPage);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi tải ma trận đối soát 3 chiều');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [selectedMonth, selectedYear, balanceStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const headers = [
      'Mã SKU',
      'Mã Bravo',
      'Tên Vật Tư',
      'ĐVT',
      'Định Mức Kế Hoạch (A)',
      'Đã Đề Nghị Xuất',
      'Thực Xuất Cấp Phát (B)',
      'Hạn Mức Còn Lại',
      'Sản Lượng Đặt Mua PO (C)',
      'Đã Nhập Kho PO',
      'Hàng Đang Trên Đường Về',
      'Tồn Kho Khả Dụng (D)',
      'Tỷ Lệ Đáp Ứng Cung Ứng (%)',
      'Tỷ Lệ Tiêu Hao Thực Tế (%)',
      'Đề Xuất Mua Bổ Sung (Gap)',
      'Trạng Thái Cân Đối'
    ];

    const rows = items.map(it => [
      `"${it.materialId}"`,
      `"${it.bravoId || ''}"`,
      `"${it.materialName || ''}"`,
      `"${it.unit || ''}"`,
      it.plannedQuota,
      it.requestedQuantity,
      it.issuedQuantity,
      it.remainingQuota,
      it.poOrderedQuantity,
      it.receivedQuantity,
      it.inTransitQuantity,
      it.availableInventory,
      it.supplyFulfillmentRate,
      it.consumptionRate,
      it.purchaseRecommendationGap,
      `"${it.balanceStatusCode === 'SHORTAGE' ? 'THIẾU HÀNG' : it.balanceStatusCode === 'OVERSTOCK' ? 'TỒN CAO' : 'CÂN ĐỐI'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MMS_DoiSoat_3Chieu_T${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">1. Nhu Cầu Định Mức (A)</div>
            <div className="text-xl font-extrabold text-blue-700 font-mono">{kpis.totalPlannedQuota.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Tổng kế hoạch các xưởng</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">2. Thực Xuất Dùng (B)</div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono">{kpis.totalIssuedQuantity.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Lượng đã bàn giao cho SX</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">3. Đặt Mua PO (C)</div>
            <div className="text-xl font-extrabold text-purple-700 font-mono">{kpis.totalPoQuantity.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Tổng lượng PO đã phát hành</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">4. Tồn Kho Thực Tế (D)</div>
            <div className="text-xl font-extrabold text-slate-800 font-mono">{kpis.totalAvailableInventory.toLocaleString()}</div>
            <div className="text-[11px] text-slate-400 mt-1">Sẵn sàng xuất trên kệ</div>
          </div>

          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-2xs">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">🚨 Nguy Cơ Thiếu Hàng</div>
            <div className="text-xl font-extrabold text-rose-900 font-mono">{kpis.shortageCount.toLocaleString()} SKU</div>
            <div className="text-[11px] text-rose-700 font-bold mt-1">Cần mua: +{kpis.totalPurchaseGap.toLocaleString()}</div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-2xs">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">⚠️ Tồn Kho Vượt Mức</div>
            <div className="text-xl font-extrabold text-amber-900 font-mono">{kpis.overstockCount.toLocaleString()} SKU</div>
            <div className="text-[11px] text-amber-700 mt-1">Tồn &gt; 2 tháng định mức</div>
          </div>
        </div>
      )}

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Balance Status Filter */}
          <select
            value={balanceStatus}
            onChange={e => setBalanceStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="ALL">⚖️ Tất cả trạng thái cân đối</option>
            <option value="SHORTAGE">🔴 Nguy cơ thiếu hàng (Shortage)</option>
            <option value="OVERSTOCK">🟡 Tồn kho vượt mức (Overstock)</option>
            <option value="BALANCED">🟢 Cân đối an toàn (Balanced)</option>
          </select>
        </div>

        {/* Search & Export */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã SKU, tên vật tư..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none w-56 sm:w-64"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Tìm
            </button>
          </form>

          <button
            onClick={handleExportCsv}
            disabled={items.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Xuất bảng đối soát ra Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* 3. Three-Way Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span className="text-xs font-semibold">Đang tổng hợp dữ liệu cân đối 3 chiều từ CSDL MMS1...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Không tìm thấy dữ liệu cân đối cho kỳ Tháng {selectedMonth}/{selectedYear}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3 w-32">Mã SKU</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Tên Vật Tư</th>
                  <th className="py-2.5 px-3 w-28 text-right text-blue-900 bg-blue-50/70">Kế Hoạch (A)</th>
                  <th className="py-2.5 px-3 w-28 text-right text-emerald-900 bg-emerald-50/70">Thực Xuất (B)</th>
                  <th className="py-2.5 px-3 w-28 text-right text-purple-900 bg-purple-50/70">Đặt Mua PO (C)</th>
                  <th className="py-2.5 px-3 w-28 text-right text-slate-900 bg-slate-100">Tồn Kho (D)</th>
                  <th className="py-2.5 px-3 w-24 text-right">Đáp Ứng %</th>
                  <th className="py-2.5 px-3 w-32 text-right text-rose-900">Mua Thêm (Gap)</th>
                  <th className="py-2.5 px-3 w-32 text-center">Trạng Thái Cân Đối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const isShortage = item.balanceStatusCode === 'SHORTAGE';
                  const isOverstock = item.balanceStatusCode === 'OVERSTOCK';

                  return (
                    <tr
                      key={item.materialId}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isShortage ? 'bg-rose-50/30' : isOverstock ? 'bg-amber-50/20' : ''
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

                      {/* Name & Unit */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 leading-tight">{item.materialName || '—'}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                          ĐVT: {item.unit || 'Cái'}
                        </span>
                      </td>

                      {/* (A) Planned */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900 bg-blue-50/30">
                        {item.plannedQuota.toLocaleString()}
                      </td>

                      {/* (B) Issued */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900 bg-emerald-50/30">
                        {item.issuedQuantity.toLocaleString()}
                      </td>

                      {/* (C) PO Ordered */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-900 bg-purple-50/30">
                        <div>{item.poOrderedQuantity.toLocaleString()}</div>
                        {item.inTransitQuantity > 0 && (
                          <div className="text-[9px] font-mono text-purple-600 font-normal">
                            Đang về: {item.inTransitQuantity.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* (D) Available Inventory */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold bg-slate-50">
                        {item.availableInventory.toLocaleString()}
                      </td>

                      {/* Supply Fulfillment % */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span
                          className={
                            item.supplyFulfillmentRate < 100
                              ? 'text-rose-600'
                              : item.supplyFulfillmentRate > 200
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }
                        >
                          {item.supplyFulfillmentRate.toFixed(1)}%
                        </span>
                      </td>

                      {/* Purchase Recommendation Gap */}
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-rose-700">
                        {item.purchaseRecommendationGap > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 bg-rose-100 text-rose-900 rounded font-mono font-bold text-[11px]">
                            +{item.purchaseRecommendationGap.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Balance Status Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {isShortage ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                            <AlertOctagon className="w-3 h-3 text-rose-600" /> Thiếu hàng
                          </span>
                        ) : isOverstock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Tồn cao
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Cân đối
                          </span>
                        )}
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
  );
};
