import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Printer,
  Boxes,
  Database,
  Building2,
  Eye,
  X,
  CheckCircle2,
  MapPin,
  User,
  Clock,
  ArrowRight,
  Tag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Barcode,
  ListFilter,
  Check,
  CalendarRange,
  ArrowUpDown
} from 'lucide-react';
import { useWarehouse } from '../../../app/providers/warehouseStore';
import {
  getNxtSummaryReport,
  getInventoryDocuments,
  getInventoryDocumentDetail,
  getWarehouseTransactions,
  NxtMaterialSummaryItem,
  NxtReportResponse,
  InventoryDocumentSummaryItem,
  InventoryDocumentPage,
  InventoryDocumentLineItem,
  InventoryDocumentDetailResponse,
  WarehouseTransactionApiItem
} from '../../../features/inventory/api/inventoryApi';
import { getTodayUtc7String, formatDate, formatDateTime, formatTime } from '../../../shared/utils/dateUtils';

type ReportTab = 'nxt' | 'documents' | 'ledger';

export const ReportsModule: React.FC = () => {
  const { setActiveBarcodePrint } = useWarehouse();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<ReportTab>('nxt');

  // Common Date Filter State (Mặc định: 30 ngày qua đến hôm nay)
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [toDate, setToDate] = useState<string>(getTodayUtc7String());

  // Preset Date Helper
  const applyDatePreset = (preset: 'today' | '7days' | '30days' | 'thisMonth' | 'all') => {
    const today = getTodayUtc7String();
    if (preset === 'today') {
      setFromDate(today);
      setToDate(today);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFromDate(`${y}-${m}-${day}`);
      setToDate(today);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFromDate(`${y}-${m}-${day}`);
      setToDate(today);
    } else if (preset === 'thisMonth') {
      const now = new Date();
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setFromDate(firstDay);
      setToDate(today);
    } else if (preset === 'all') {
      setFromDate('2020-01-01');
      setToDate(today);
    }
  };

  // =========================================================================
  // 1. STATE BÁO CÁO NHẬP - XUẤT - TỒN TỔNG HỢP (NXT SUMMARY)
  // =========================================================================
  const [nxtSearch, setNxtSearch] = useState('');
  const [nxtWarehouse, setNxtWarehouse] = useState('ALL');
  const [nxtData, setNxtData] = useState<NxtReportResponse | null>(null);
  const [isLoadingNxt, setIsLoadingNxt] = useState(false);
  const [nxtError, setNxtError] = useState<string | null>(null);

  const loadNxtReport = async () => {
    setIsLoadingNxt(true);
    setNxtError(null);
    try {
      const res = await getNxtSummaryReport(fromDate, toDate, nxtSearch, nxtWarehouse);
      setNxtData(res);
    } catch (err: any) {
      console.error('Lỗi tải báo cáo NXT:', err);
      setNxtError(err.message || 'Không thể kết nối CSDL MMS1 để tính báo cáo NXT.');
    } finally {
      setIsLoadingNxt(false);
    }
  };

  // =========================================================================
  // 2. STATE SỔ PHIẾU XUẤT & NHẬP KHO (DOCUMENTS LEDGER)
  // =========================================================================
  const [docSearch, setDocSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL'); // ALL, OUT, IN, TRANSFER, COUNT, SPLIT
  const [docPage, setDocPage] = useState(1);
  const [docPageSize] = useState(25);
  const [docData, setDocData] = useState<InventoryDocumentPage | null>(null);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Selected Document for Modal Details
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [docDetail, setDocDetail] = useState<InventoryDocumentDetailResponse | null>(null);
  const [isLoadingDocDetail, setIsLoadingDocDetail] = useState(false);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    setDocError(null);
    try {
      const res = await getInventoryDocuments(fromDate, toDate, docTypeFilter, docSearch, docPage, docPageSize);
      setDocData(res);
    } catch (err: any) {
      console.error('Lỗi tải sổ phiếu:', err);
      setDocError(err.message || 'Không thể tải danh sách phiếu từ CSDL MMS1.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const openDocumentDetail = async (documentId: number) => {
    setSelectedDocId(documentId);
    setIsLoadingDocDetail(true);
    try {
      const res = await getInventoryDocumentDetail(documentId);
      setDocDetail(res);
    } catch (err: any) {
      console.error('Lỗi tải chi tiết phiếu:', err);
    } finally {
      setIsLoadingDocDetail(false);
    }
  };

  // =========================================================================
  // 3. STATE SỔ NHẬT KÝ GIAO DỊCH CHI TIẾT (TRANSACTION LEDGER)
  // =========================================================================
  const [trxSearch, setTrxSearch] = useState('');
  const [trxOperation, setTrxOperation] = useState('ALL');
  const [trxData, setTrxData] = useState<WarehouseTransactionApiItem[]>([]);
  const [isLoadingTrx, setIsLoadingTrx] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<WarehouseTransactionApiItem | null>(null);

  const loadTransactions = async () => {
    setIsLoadingTrx(true);
    try {
      const res = await getWarehouseTransactions(trxSearch, trxOperation, fromDate, toDate, 1, 300);
      setTrxData(res);
    } catch (err: any) {
      console.error('Lỗi tải nhật ký giao dịch:', err);
    } finally {
      setIsLoadingTrx(false);
    }
  };

  // Trigger loads when tab or common filters change
  useEffect(() => {
    if (activeTab === 'nxt') {
      const timer = setTimeout(() => loadNxtReport(), 300);
      return () => clearTimeout(timer);
    } else if (activeTab === 'documents') {
      const timer = setTimeout(() => loadDocuments(), 300);
      return () => clearTimeout(timer);
    } else if (activeTab === 'ledger') {
      const timer = setTimeout(() => loadTransactions(), 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, fromDate, toDate, nxtSearch, nxtWarehouse, docSearch, docTypeFilter, docPage, trxSearch, trxOperation]);

  // Export CSV Handler
  const handleExportNxtCSV = () => {
    if (!nxtData || !nxtData.items || nxtData.items.length === 0) {
      alert('Không có dữ liệu báo cáo để xuất!');
      return;
    }
    const headers = ['STT,Mã SKU,Mã Bravo,Tên Vật Tư,ĐVT,Đơn Giá (đ),Tồn Đầu Kỳ,Nhập Trong Kỳ,Xuất Trong Kỳ,Tồn Cuối Kỳ,Thành Tiền Cuối (đ),Số Giao Dịch'];
    const rows = nxtData.items.map((row, idx) =>
      `${idx + 1},"${row.materialId}","${row.bravoId || ''}","${(row.materialName || '').replace(/"/g, '""')}","${row.unit || ''}",${row.unitPrice},${row.beginningQuantity},${row.inQuantity},${row.outQuantity},${row.endingQuantity},${row.endingValue},${row.transactionCount}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_NXT_ThucTe_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDocsCSV = () => {
    if (!docData || !docData.items || docData.items.length === 0) {
      alert('Không có dữ liệu phiếu để xuất!');
      return;
    }
    const headers = ['Mã Phiếu,Loại Nghiệp Vụ,Tên Nghiệp Vụ,Kho Nguồn,Kho Đích,Người Nhận / Đối Tác,Người Lập,Thời Gian Lập,Số Mặt Hàng,Tổng Số Lượng,Trạng Thái,Ghi Chú'];
    const rows = docData.items.map(d =>
      `"${d.documentCode}","${d.operationCode || ''}","${d.operationName || ''}","${d.warehouseFrom || ''}","${d.warehouseTo || ''}","${(d.receiverOrPartner || '').replace(/"/g, '""')}","${d.createdBy || ''}","${d.createdAt}","${d.totalLines}",${d.totalQuantity},"${d.statusName || ''}","${(d.note || '').replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `So_Phieu_Kho_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Main Mode Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-[#007D3C] text-xs font-bold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" /> Báo Cáo & Truy Vết Giao Dịch Thực Tế (CSDL MMS1)
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            Báo Cáo Nhập - Xuất - Tồn & Sổ Phiếu Kho
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-[#007D3C] dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
              Live SQL Server
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Tổng hợp dữ liệu số dư tồn thực tế, đối soát theo từng Phiếu Nhập / Phiếu Xuất và chi tiết biến động theo ngày giờ.
          </p>
        </div>

        {/* Tab Switcher & Export */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab('nxt')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'nxt'
                  ? 'bg-[#007D3C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" /> Báo Cáo NXT Tổng Hợp
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-[#007D3C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Sổ Phiếu Xuất / Nhập
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-[#007D3C] text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" /> Sổ Nhật Ký Giao Dịch
            </button>
          </div>

          <button
            onClick={activeTab === 'documents' ? handleExportDocsCSV : handleExportNxtCSV}
            className="px-4 py-2 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel / CSV
          </button>
        </div>
      </div>

      {/* 2. Global Date & Time Range Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
            <CalendarRange className="w-4 h-4 text-[#007D3C]" />
            <span>Khoảng thời gian:</span>
          </div>

          {/* From Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
            <span className="text-[11px] font-semibold text-slate-400">Từ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 bg-transparent border-0 focus:outline-hidden"
            />
          </div>

          {/* To Date */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700">
            <span className="text-[11px] font-semibold text-slate-400">Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-100 bg-transparent border-0 focus:outline-hidden"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyDatePreset('today')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              onClick={() => applyDatePreset('7days')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 cursor-pointer"
            >
              7 ngày qua
            </button>
            <button
              onClick={() => applyDatePreset('30days')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 cursor-pointer"
            >
              30 ngày qua
            </button>
            <button
              onClick={() => applyDatePreset('thisMonth')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 cursor-pointer"
            >
              Tháng này
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-[#007D3C]" />
          <span>Múi giờ: <strong className="text-slate-800 dark:text-zinc-200">UTC+7 (Việt Nam)</strong></span>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: BÁO CÁO NHẬP - XUẤT - TỒN TỔNG HỢP (NXT SUMMARY)
      ===================================================================== */}
      {activeTab === 'nxt' && (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                Tổng Giá Trị Đầu Kỳ
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {(nxtData?.totalBeginningValue ?? 0).toLocaleString('vi-VN')} đ
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Tồn trước ngày {formatDate(fromDate)}</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs bg-emerald-50/20">
              <span className="text-[11px] font-bold text-[#007D3C] dark:text-emerald-400 uppercase tracking-wider block">
                Tổng Lượng Nhập Trong Kỳ
              </span>
              <div className="text-lg sm:text-xl font-black text-[#007D3C] dark:text-emerald-400 font-mono mt-1">
                +{(nxtData?.totalInQuantity ?? 0).toLocaleString('vi-VN')}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-1 block">Tổng phát sinh tăng (+)</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 shadow-2xs bg-amber-50/20">
              <span className="text-[11px] font-bold text-[#F7941D] dark:text-amber-400 uppercase tracking-wider block">
                Tổng Lượng Xuất Trong Kỳ
              </span>
              <div className="text-lg sm:text-xl font-black text-[#F7941D] dark:text-amber-400 font-mono mt-1">
                -{(nxtData?.totalOutQuantity ?? 0).toLocaleString('vi-VN')}
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 mt-1 block">Tổng phát sinh giảm (-)</span>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block">
                Tổng Giá Trị Tồn Cuối Kỳ
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {(nxtData?.totalEndingValue ?? 0).toLocaleString('vi-VN')} đ
              </div>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 block">
                {nxtData?.activeSkuCount ?? 0} / {nxtData?.totalSkuCount ?? 0} SKU có số dư/phát sinh
              </span>
            </div>
          </div>

          {/* NXT Filter Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nxtSearch}
                  onChange={e => setNxtSearch(e.target.value)}
                  placeholder="Tìm mã SKU, tên vật tư, mã Bravo..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl w-64 sm:w-80 focus:outline-hidden focus:border-[#007D3C]"
                />
              </div>

              <select
                value={nxtWarehouse}
                onChange={e => setNxtWarehouse(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:border-[#007D3C]"
              >
                <option value="ALL">Tất cả kho lưu trữ</option>
                <option value="20020100">Kho NVL 20020100</option>
                <option value="30200200">Kho Phụ Tùng 30200200</option>
                <option value="40110100">Kho Thành Phẩm 40110100</option>
              </select>

              <button
                type="button"
                onClick={loadNxtReport}
                disabled={isLoadingNxt}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingNxt ? 'animate-spin text-[#007D3C]' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Hiển thị: <strong>{nxtData?.items?.length ?? 0}</strong> mặt hàng
            </div>
          </div>

          {/* NXT Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3">Mã SKU</th>
                    <th className="p-3">Mã Bravo</th>
                    <th className="p-3">Tên Vật Tư</th>
                    <th className="p-3 text-center">ĐVT</th>
                    <th className="p-3 text-right">Đơn Giá</th>
                    <th className="p-3 text-right font-mono">Tồn Đầu</th>
                    <th className="p-3 text-right text-[#007D3C] font-mono">Nhập Trong Kỳ</th>
                    <th className="p-3 text-right text-[#F7941D] font-mono">Xuất Trong Kỳ</th>
                    <th className="p-3 text-right text-[#007D3C] font-mono font-bold">Tồn Cuối Kỳ</th>
                    <th className="p-3 text-right font-mono">Thành Tiền (đ)</th>
                    <th className="p-3 text-center">Số GD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {isLoadingNxt ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#007D3C]" />
                          <span>Đang tính toán số liệu Nhập - Xuất - Tồn thực tế từ CSDL MMS1...</span>
                        </div>
                      </td>
                    </tr>
                  ) : nxtData && nxtData.items && nxtData.items.length > 0 ? (
                    nxtData.items.map((row, idx) => (
                      <tr key={row.materialId + idx} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#007D3C] dark:text-emerald-400">
                          {row.materialId}
                        </td>
                        <td className="p-3 font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                          {row.bravoId || '—'}
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-zinc-100 max-w-[240px] truncate" title={row.materialName}>
                          {row.materialName || 'Vật tư'}
                        </td>
                        <td className="p-3 text-center text-slate-600 dark:text-zinc-400">{row.unit || 'Cái'}</td>
                        <td className="p-3 font-mono text-right text-slate-600 dark:text-zinc-400">
                          {row.unitPrice.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 font-mono text-right text-slate-700 dark:text-zinc-300 font-semibold">
                          {row.beginningQuantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 font-mono text-right font-bold text-[#007D3C] dark:text-emerald-400">
                          {row.inQuantity > 0 ? `+${row.inQuantity.toLocaleString('vi-VN')}` : '—'}
                        </td>
                        <td className="p-3 font-mono text-right font-bold text-[#F7941D] dark:text-amber-400">
                          {row.outQuantity > 0 ? `-${row.outQuantity.toLocaleString('vi-VN')}` : '—'}
                        </td>
                        <td className="p-3 font-mono text-right font-extrabold text-[#007D3C] dark:text-emerald-400 text-sm">
                          {row.endingQuantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 font-mono text-right font-bold text-slate-900 dark:text-white">
                          {row.endingValue.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 text-center">
                          {row.transactionCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                              {row.transactionCount} GD
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500">
                        {nxtError || 'Không tìm thấy dữ liệu phát sinh trong khoảng thời gian đã chọn.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: SỔ PHIẾU XUẤT & NHẬP KHO (DOCUMENTS LEDGER - THEO PHIẾU)
      ===================================================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Document Filter Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Type Filter Buttons */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl border border-slate-200 dark:border-zinc-700">
                <button
                  onClick={() => { setDocTypeFilter('ALL'); setDocPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    docTypeFilter === 'ALL'
                      ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  Tất cả phiếu
                </button>
                <button
                  onClick={() => { setDocTypeFilter('OUT'); setDocPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    docTypeFilter === 'OUT'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpFromLine className="w-3 h-3" /> Phiếu Xuất (OUT)
                </button>
                <button
                  onClick={() => { setDocTypeFilter('IN'); setDocPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    docTypeFilter === 'IN'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  <ArrowDownToLine className="w-3 h-3" /> Phiếu Nhập (IN)
                </button>
                <button
                  onClick={() => { setDocTypeFilter('TRANSFER'); setDocPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    docTypeFilter === 'TRANSFER'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  Điều Chuyển Kệ
                </button>
                <button
                  onClick={() => { setDocTypeFilter('COUNT'); setDocPage(1); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    docTypeFilter === 'COUNT'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
                  }`}
                >
                  Kiểm Kê / Điều Chỉnh
                </button>
              </div>

              {/* Search text */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={e => { setDocSearch(e.target.value); setDocPage(1); }}
                  placeholder="Tìm mã phiếu, người lập, người nhận..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl w-60 sm:w-72 focus:outline-hidden focus:border-[#007D3C]"
                />
              </div>

              <button
                type="button"
                onClick={loadDocuments}
                disabled={isLoadingDocs}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin text-[#007D3C]' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Tổng cộng: <span className="text-[#007D3C] font-mono">{docData?.totalCount ?? 0}</span> phiếu
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3.5">Mã Phiếu</th>
                    <th className="p-3.5">Thời Gian Lập</th>
                    <th className="p-3.5">Loại Nghiệp Vụ</th>
                    <th className="p-3.5">Kho Nguồn &rarr; Đích</th>
                    <th className="p-3.5">Người Nhận / Đối Tác</th>
                    <th className="p-3.5">Người Tạo</th>
                    <th className="p-3.5 text-center">Số Mặt Hàng</th>
                    <th className="p-3.5 text-right">Tổng Số Lượng</th>
                    <th className="p-3.5 text-center">Trạng Thái</th>
                    <th className="p-3.5 text-center">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {isLoadingDocs ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#007D3C]" />
                          <span>Đang truy xuất danh sách phiếu từ CSDL MMS1...</span>
                        </div>
                      </td>
                    </tr>
                  ) : docData && docData.items && docData.items.length > 0 ? (
                    docData.items.map(doc => {
                      const isOut = doc.documentType === 'OUT';
                      const isIn = doc.documentType === 'IN';
                      const isTransfer = doc.documentType === 'TRANSFER';

                      return (
                        <tr
                          key={doc.documentId}
                          onClick={() => openDocumentDetail(doc.documentId)}
                          className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer group"
                        >
                          <td className="p-3.5 font-mono font-extrabold text-[#007D3C] dark:text-emerald-400">
                            {doc.documentCode}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-zinc-400 text-[11px]">
                            {formatDateTime(doc.createdAt)}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isOut
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                  : isIn
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : isTransfer
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                              }`}>
                                {doc.operationName || doc.operationCode}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-700 dark:text-zinc-300">
                            <span>{doc.warehouseFrom || '—'}</span>
                            <span className="mx-1 text-slate-400">&rarr;</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{doc.warehouseTo || '—'}</span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-900 dark:text-zinc-100 max-w-[160px] truncate">
                            {doc.receiverOrPartner || '—'}
                          </td>
                          <td className="p-3.5 text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                            {doc.createdBy || 'Hệ Thống'}
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-800 dark:text-zinc-200">
                            {doc.totalLines} dòng
                          </td>
                          <td className="p-3.5 text-right font-mono font-bold text-sm">
                            <span className={isOut ? 'text-[#F7941D]' : isIn ? 'text-[#007D3C]' : 'text-slate-800 dark:text-zinc-200'}>
                              {isOut ? `-${doc.totalQuantity.toLocaleString('vi-VN')}` : isIn ? `+${doc.totalQuantity.toLocaleString('vi-VN')}` : doc.totalQuantity.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              {doc.statusName || 'Hoàn tất'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => openDocumentDetail(doc.documentId)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#007D3C] hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition-all cursor-pointer"
                              title="Xem chi tiết phiếu và các dòng vật tư"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        {docError || 'Không tìm thấy phiếu kho nào trong khoảng thời gian đã chọn.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {docData && docData.totalCount > docPageSize && (
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Trang {docPage} / {Math.ceil(docData.totalCount / docPageSize)} (Tổng {docData.totalCount} phiếu)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={docPage <= 1}
                    onClick={() => setDocPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 text-xs font-bold bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={docPage >= Math.ceil(docData.totalCount / docPageSize)}
                    onClick={() => setDocPage(p => p + 1)}
                    className="px-3 py-1 text-xs font-bold bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 rounded-lg disabled:opacity-40 cursor-pointer"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: SỔ NHẬT KÝ GIAO DỊCH CHI TIẾT (TRANSACTION LEDGER)
      ===================================================================== */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Ledger Filter Bar */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={trxSearch}
                  onChange={e => setTrxSearch(e.target.value)}
                  placeholder="Tìm mã GD, SKU, Lô, chứng từ..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl w-64 sm:w-72 focus:outline-hidden focus:border-[#007D3C]"
                />
              </div>

              <select
                value={trxOperation}
                onChange={e => setTrxOperation(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-hidden focus:border-[#007D3C]"
              >
                <option value="ALL">Tất cả nghiệp vụ kho</option>
                <option value="OUT_CON">OUT_CON - Xuất Cho Sản Xuất</option>
                <option value="IN_PO">IN_PO - Nhập Mua Hàng (PO)</option>
                <option value="SPLIT_IN">SPLIT_IN - Nhập Tách Lô Con</option>
                <option value="SPLIT_OUT">SPLIT_OUT - Giảm Lô Cha Sau Tách</option>
                <option value="ADJ_UP">ADJ_UP - Điều Chỉnh Tăng (Kiểm Kê Thừa)</option>
                <option value="ADJ_DWN">ADJ_DWN - Điều Chỉnh Giảm (Kiểm Kê Thiếu)</option>
                <option value="MOV_BIN">MOV_BIN - Chuyển Vị Trí Kệ</option>
              </select>

              <button
                type="button"
                onClick={loadTransactions}
                disabled={isLoadingTrx}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTrx ? 'animate-spin text-[#007D3C]' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono">
              {trxData.length} bản ghi giao dịch
            </span>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-3.5">Mã Giao Dịch</th>
                    <th className="p-3.5">Thời Gian</th>
                    <th className="p-3.5">Nghiệp Vụ</th>
                    <th className="p-3.5">Mã & Tên Vật Tư</th>
                    <th className="p-3.5">Mã Lô (Batch)</th>
                    <th className="p-3.5">Vị Trí Kệ</th>
                    <th className="p-3.5 text-right">Số Lượng</th>
                    <th className="p-3.5">Người Thực Hiện</th>
                    <th className="p-3.5">Chứng Từ / Phiếu</th>
                    <th className="p-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {isLoadingTrx ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#007D3C]" />
                          <span>Đang tải nhật ký giao dịch từ CSDL MMS1...</span>
                        </div>
                      </td>
                    </tr>
                  ) : trxData.length > 0 ? (
                    trxData.map(trx => {
                      const isInbound = trx.logic === 1;
                      const isOutbound = trx.logic === -1;

                      return (
                        <tr
                          key={trx.transactionId}
                          onClick={() => setSelectedTrx(trx)}
                          className="hover:bg-emerald-50/70 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer group"
                        >
                          <td className="p-3.5 font-mono font-bold text-[#007D3C] dark:text-emerald-400">
                            {trx.transactionCode}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500 dark:text-zinc-400 text-[11px]">
                            {formatDateTime(trx.createdAt)}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-100">
                                {trx.operationCode}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                {trx.operationName}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-white">{trx.materialId}</div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-[180px]">{trx.materialName}</div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-700 dark:text-zinc-300 font-semibold">
                            {trx.batchId ? `#${trx.batchId}` : '—'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-zinc-400">
                            {trx.locationCode || 'Kho Tổng'}
                          </td>
                          <td className="p-3.5 font-mono text-right font-bold text-sm">
                            <span className={isInbound ? 'text-[#007D3C] dark:text-emerald-400' : isOutbound ? 'text-[#F7941D] dark:text-amber-400' : 'text-slate-600'}>
                              {isInbound ? `+${Math.abs(trx.quantity)}` : isOutbound ? `-${Math.abs(trx.quantity)}` : `${Math.abs(trx.quantity)}`} {trx.unit}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-zinc-300 font-medium">
                            {trx.performer || 'Hệ Thống'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                            {trx.referenceDoc ? `PH-${trx.referenceDoc}` : '—'}
                          </td>
                          <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedTrx(trx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#007D3C] hover:bg-emerald-100/50 transition-all cursor-pointer"
                              title="Xem chi tiết giao dịch"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        Không có bản ghi giao dịch nào trong khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL CHI TIẾT PHIẾU XUẤT / NHẬP KHO (DOCUMENT DETAILS & LINES MODAL)
      ========================================================================= */}
      {selectedDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base">
                      Chi Tiết Chứng Từ: {docDetail?.document?.documentCode || `PH-${selectedDocId}`}
                    </h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {docDetail?.document?.operationName || docDetail?.document?.operationCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thời gian lập: {docDetail?.document?.createdAt ? formatDateTime(docDetail.document.createdAt) : '—'} • Người lập: {docDetail?.document?.createdBy || 'Thủ kho'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedDocId(null); setDocDetail(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {isLoadingDocDetail ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#007D3C]" />
                  <span>Đang tải danh sách các dòng chi tiết của phiếu...</span>
                </div>
              ) : docDetail && docDetail.document ? (
                <>
                  {/* Document Summary Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">KHO NGUỒN</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {docDetail.document.warehouseFrom || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">KHO ĐÍCH</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                        {docDetail.document.warehouseTo || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">ĐỐI TÁC / NGƯỜI NHẬN</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {docDetail.document.receiverOrPartner || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">TRẠNG THÁI PHIẾU</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {docDetail.document.statusName || 'Hoàn tất'}
                      </span>
                    </div>
                  </div>

                  {/* Lines Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider text-[11px]">
                        Danh Sách Vật Tư & Lô Trong Phiếu ({docDetail.lines.length} dòng)
                      </span>
                      <span className="font-mono font-bold text-xs text-[#007D3C]">
                        Tổng SL: {docDetail.document.totalQuantity.toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold border-b border-slate-200 dark:border-zinc-700">
                          <tr>
                            <th className="p-2.5">STT</th>
                            <th className="p-2.5">Mã SKU</th>
                            <th className="p-2.5">Mã Bravo</th>
                            <th className="p-2.5">Tên Vật Tư</th>
                            <th className="p-2.5">Mã Lô (Batch)</th>
                            <th className="p-2.5">Vị Trí Kệ</th>
                            <th className="p-2.5 text-right">Số Lượng</th>
                            <th className="p-2.5 text-center">ĐVT</th>
                            <th className="p-2.5 text-center">In Tem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {docDetail.lines.map((line, idx) => (
                            <tr key={line.transactionId} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                              <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-2.5 font-mono font-bold text-[#007D3C] dark:text-emerald-400">
                                {line.materialId}
                              </td>
                              <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                                {line.bravoId || '—'}
                              </td>
                              <td className="p-2.5 font-medium text-slate-900 dark:text-zinc-100 max-w-[200px] truncate">
                                {line.materialName}
                              </td>
                              <td className="p-2.5 font-mono text-slate-700 dark:text-zinc-300 font-semibold">
                                {line.batchId ? `#${line.batchId}` : '—'}
                              </td>
                              <td className="p-2.5 font-mono text-slate-600 dark:text-zinc-400">
                                {line.locationCode || 'Kho Tổng'}
                              </td>
                              <td className="p-2.5 font-mono text-right font-extrabold text-slate-900 dark:text-white text-sm">
                                {line.quantity.toLocaleString('vi-VN')}
                              </td>
                              <td className="p-2.5 text-center text-slate-600 dark:text-zinc-400">
                                {line.unit}
                              </td>
                              <td className="p-2.5 text-center">
                                {line.batchId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveBarcodePrint({
                                        title: `Tem Lô #${line.batchId}`,
                                        batchNumber: String(line.batchId),
                                        materialName: line.materialName || '',
                                        materialCode: line.materialId || '',
                                        quantity: line.quantity,
                                        unit: line.unit || 'Cái',
                                        receivingDate: getTodayUtc7String()
                                      });
                                    }}
                                    className="p-1 rounded-md text-slate-400 hover:text-[#007D3C] hover:bg-emerald-100/50 cursor-pointer"
                                    title="In tem mã vạch dán thùng"
                                  >
                                    <Barcode className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Không tìm thấy thông tin chi tiết cho phiếu này.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                CSDL MMS1 • tbl_phieu_transaction #{selectedDocId}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> In Phiếu
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedDocId(null); setDocDetail(null); }}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL CHI TIẾT GIAO DỊCH ĐƠN LẺ (SINGLE TRANSACTION MODAL)
      ========================================================================= */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base">Chi Tiết Giao Dịch Kho</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {selectedTrx.transactionCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thời gian: {formatDateTime(selectedTrx.createdAt)} • Người thực hiện: {selectedTrx.performer || 'Hệ Thống'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2">
                <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block text-[11px]">
                  1. Nghiệp Vụ Kho & Hạch Toán
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">MÃ NGHIỆP VỤ</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                      {selectedTrx.operationCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TÊN NGHIỆP VỤ</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedTrx.operationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CHIỀU BIẾN ĐỘNG TỒN</span>
                    <span className={`font-bold inline-flex items-center gap-1 ${
                      selectedTrx.logic === 1 ? 'text-[#007D3C]' : selectedTrx.logic === -1 ? 'text-[#F7941D]' : 'text-slate-600'
                    }`}>
                      {selectedTrx.logic === 1 ? 'Tăng Tồn Kho (+)' : selectedTrx.logic === -1 ? 'Giảm Tồn Kho (-)' : 'Không Đổi (0)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2">
                <span className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider block text-[11px]">
                  2. Thông Tin Vật Tư & Lô Hàng
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">MÃ SKU / VẬT TƯ</span>
                    <div className="font-mono font-bold text-blue-700 text-sm">{selectedTrx.materialId}</div>
                    {selectedTrx.bravoId && (
                      <span className="text-[10px] text-slate-500 font-mono">Mã Bravo: {selectedTrx.bravoId}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">MÃ LÔ (BATCH)</span>
                    <div className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                      {selectedTrx.batchId ? `#${selectedTrx.batchId}` : '—'}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px]">TÊN VẬT TƯ</span>
                    <div className="font-medium text-slate-900 dark:text-white">{selectedTrx.materialName}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                <span className="font-bold text-[#007D3C] dark:text-emerald-400 uppercase tracking-wider block text-[11px]">
                  3. Số Lượng & Vị Trí Ô Kệ
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">SỐ LƯỢNG GIAO DỊCH</span>
                    <div className="font-mono font-black text-base text-slate-900 dark:text-white">
                      <span className={selectedTrx.logic === 1 ? 'text-[#007D3C]' : selectedTrx.logic === -1 ? 'text-[#F7941D]' : 'text-slate-900'}>
                        {selectedTrx.logic === 1 ? `+${Math.abs(selectedTrx.quantity)}` : selectedTrx.logic === -1 ? `-${Math.abs(selectedTrx.quantity)}` : Math.abs(selectedTrx.quantity)}
                      </span>{' '}
                      <span className="text-xs font-semibold text-slate-600">{selectedTrx.unit}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">VỊ TRÍ Ô KỆ</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {selectedTrx.locationCode || 'Kho Tổng'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CHỨNG TỪ THAM CHIẾU</span>
                    <div className="font-mono font-bold text-slate-800 dark:text-zinc-200 text-xs">
                      {selectedTrx.referenceDoc ? `PH-${selectedTrx.referenceDoc}` : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-800 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                CSDL MMS1 • tbl_transaction #{selectedTrx.transactionId}
              </span>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
