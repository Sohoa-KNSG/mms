import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
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
  FileText,
  CheckCircle2,
  MapPin,
  User,
  Clock,
  ArrowRight,
  Tag,
  Loader2
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { WarehouseTransaction } from '../types';
import { getWarehouseTransactions, WarehouseTransactionApiItem } from '../services/inventoryService';

export const ReportsModule: React.FC = () => {
  const { materials, batches, transactions } = useWarehouse();

  const [activeReport, setActiveReport] = useState<'nxt' | 'ledger'>('nxt');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // State cho Sổ Nhật Ký Giao Dịch
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('ALL');
  const [apiTransactions, setApiTransactions] = useState<WarehouseTransactionApiItem[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const loadRealTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const data = await getWarehouseTransactions(ledgerSearchQuery, selectedOperation, 1, 200);
      setApiTransactions(data);
    } catch (err) {
      console.warn('Không thể tải giao dịch từ MMS1 API, sử dụng dữ liệu lưu sẵn:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (activeReport === 'ledger') {
      loadRealTransactions();
    }
  }, [activeReport, selectedOperation]);

  // Generate Báo cáo Nhập Xuất Tồn
  const nxtReportData = materials.map(mat => {
    const matBatches = batches.filter(b => b.materialId === mat.id);
    const endingQty = matBatches.reduce((sum, b) => sum + b.quantity, 0);

    // Sum transactions for this material based on business logic (1: Nhập/Tăng, -1: Xuất/Giảm)
    const matTrx = transactions.filter(t => t.materialId === mat.id);
    const inQty = matTrx
      .filter(t => (t.logic ?? 1) === 1)
      .reduce((sum, t) => sum + Math.abs(t.quantity), 0);
    const outQty = matTrx
      .filter(t => (t.logic ?? -1) === -1)
      .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

    const beginningQty = Math.max(0, endingQty - inQty + outQty);
    const totalValue = endingQty * mat.standardPrice;

    return {
      id: mat.id,
      code: mat.code,
      name: mat.name,
      category: mat.categoryName,
      unit: mat.unit,
      price: mat.standardPrice,
      beginningQty,
      inQty,
      outQty,
      endingQty,
      totalValue
    };
  });

  const filteredNXT = nxtReportData.filter(item => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
    }
    return true;
  });

  const totalBeginningValue = filteredNXT.reduce((sum, i) => sum + i.beginningQty * i.price, 0);
  const totalEndingValue = filteredNXT.reduce((sum, i) => sum + i.totalValue, 0);

  const handleExportCSV = () => {
    const headers = ['STT,Mã SKU,Tên Vật Tư,Nhóm,ĐVT,Đơn Giá,Tồn Đầu,Nhập Trong Kỳ,Xuất Trong Kỳ,Tồn Cuối,Giá Trị Tồn Cuối'];
    const rows = filteredNXT.map((row, idx) =>
      `${idx + 1},"${row.code}","${row.name}","${row.category}","${row.unit}",${row.price},${row.beginningQty},${row.inQty},${row.outQty},${row.endingQty},${row.totalValue}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_NXT_KNSG_MMS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-[#007D3C] text-xs font-bold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" /> Reports & Analytics Ledger (Kềm Nghĩa WMS)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Báo Cáo Nhập - Xuất - Tồn & Sổ Giao Dịch Kho
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu số dư, biến động nhập xuất theo kỳ kế toán và truy xuất vết giao dịch chi tiết từ CSDL MMS1.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveReport('nxt')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeReport === 'nxt' ? 'bg-[#007D3C] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Báo Cáo NXT Tổng Hợp
          </button>
          <button
            onClick={() => setActiveReport('ledger')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeReport === 'ledger' ? 'bg-[#007D3C] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sổ Nhật Ký Giao Dịch
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel / CSV
          </button>
        </div>
      </div>

      {activeReport === 'nxt' ? (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tổng Giá Trị Đầu Kỳ</span>
              <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                {totalBeginningValue.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-[#007D3C] uppercase tracking-wider block">Tổng Giá Trị Cuối Kỳ</span>
              <div className="text-xl font-extrabold text-[#007D3C] font-mono mt-1">
                {totalEndingValue.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-[#007D3C] uppercase tracking-wider block">Số Mặt Hàng Đang Có Tồn</span>
              <div className="text-xl font-extrabold text-[#007D3C] font-mono mt-1">
                {filteredNXT.filter(i => i.endingQty > 0).length} / {filteredNXT.length} SKU
              </div>
            </div>
          </div>

          {/* Table Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã SKU, tên vật tư..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-64 focus:outline-hidden focus:border-[#007D3C]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007D3C]"
              >
                <option value="ALL">Tất cả phân nhóm</option>
                <option value="Linh kiện Điện tử">Linh kiện Điện tử</option>
                <option value="Cơ khí & Kim loại">Cơ khí & Kim loại</option>
                <option value="Hoá chất & Keo">Hoá chất & Keo</option>
                <option value="Bao bì & Đóng gói">Bao bì & Đóng gói</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-mono">
              Kỳ báo cáo: 01/08/2026 - 15/08/2026
            </span>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Mã SKU</th>
                    <th className="p-3">Tên Vật Tư</th>
                    <th className="p-3">ĐVT</th>
                    <th className="p-3 text-right">Đơn Giá</th>
                    <th className="p-3 text-right">Tồn Đầu</th>
                    <th className="p-3 text-right text-[#007D3C]">Nhập</th>
                    <th className="p-3 text-right text-[#F7941D]">Xuất</th>
                    <th className="p-3 text-right text-[#007D3C] font-bold">Tồn Cuối</th>
                    <th className="p-3 text-right">Thành Tiền Cuối (đ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNXT.map(row => (
                    <tr key={row.id} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#007D3C]">{row.code}</td>
                      <td className="p-3 font-medium text-slate-900 max-w-[220px] truncate">{row.name}</td>
                      <td className="p-3 text-slate-500">{row.unit}</td>
                      <td className="p-3 font-mono text-right text-slate-600">{row.price.toLocaleString('vi-VN')}</td>
                      <td className="p-3 font-mono text-right text-slate-600">{row.beginningQty}</td>
                      <td className="p-3 font-mono text-right font-bold text-[#007D3C]">{row.inQty > 0 ? `+${row.inQty}` : '—'}</td>
                      <td className="p-3 font-mono text-right font-bold text-[#F7941D]">{row.outQty > 0 ? `-${row.outQty}` : '—'}</td>
                      <td className="p-3 font-mono text-right font-extrabold text-[#007D3C] text-sm">{row.endingQty}</td>
                      <td className="p-3 font-mono text-right font-bold text-slate-900">{row.totalValue.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Transaction Ledger */
        <div className="space-y-4">
          {/* Toolbar: Search, Operation Filter, Refresh */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ledgerSearchQuery}
                  onChange={e => setLedgerSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadRealTransactions()}
                  placeholder="Tìm mã GD, vật tư, batch, chứng từ..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-64 sm:w-72 focus:outline-hidden focus:border-[#007D3C]"
                />
              </div>

              <select
                value={selectedOperation}
                onChange={e => setSelectedOperation(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#007D3C]"
              >
                <option value="ALL">Tất cả nghiệp vụ kho</option>
                <option value="IN_PO">IN_PO - Nhập Mua Hàng (PO)</option>
                <option value="OUT_CON">OUT_CON - Xuất Cho Sản Xuất</option>
                <option value="ADJ_UP">ADJ_UP - Điều Chỉnh Tăng (Kiểm Kê Thừa)</option>
                <option value="ADJ_DWN">ADJ_DWN - Điều Chỉnh Giảm (Kiểm Kê Thiếu)</option>
                <option value="MOV_BIN">MOV_BIN - Chuyển Vị Trí Ô Kệ</option>
                <option value="IN_PROD">IN_PROD - Nhập Sản Xuất Trả</option>
                <option value="IN_RTN">IN_RTN - Nhập Hàng Trả</option>
                <option value="OUT_SCR">OUT_SCR - Xuất Hủy / Phế Liệu</option>
              </select>

              <button
                type="button"
                onClick={loadRealTransactions}
                disabled={isLoadingTransactions}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Tải lại từ CSDL MMS1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTransactions ? 'animate-spin text-[#007D3C]' : ''}`} />
                <span>Làm mới</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">
                {apiTransactions.length > 0 ? (
                  <span className="text-[#007D3C] font-mono">CSDL MMS1: {apiTransactions.length} bản ghi</span>
                ) : (
                  <span>Tổng: {transactions.length} bản ghi</span>
                )}
              </span>
            </div>
          </div>

          {/* Main Transaction Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Giao Dịch</th>
                    <th className="p-3.5">Thời Gian</th>
                    <th className="p-3.5">Loại Nghiệp Vụ</th>
                    <th className="p-3.5">Mã & Tên Vật Tư</th>
                    <th className="p-3.5">Mã Lô (Batch)</th>
                    <th className="p-3.5">Vị Trí Kệ</th>
                    <th className="p-3.5 text-right">Số Lượng</th>
                    <th className="p-3.5">Người Thực Hiện</th>
                    <th className="p-3.5">Ghi Chú</th>
                    <th className="p-3.5 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingTransactions ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#007D3C]" />
                          <span>Đang truy vấn lịch sử giao dịch từ CSDL MMS1...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (apiTransactions.length > 0 ? apiTransactions : transactions).map(item => {
                    const isApi = 'transactionId' in item;
                    const trx = isApi ? {
                      id: String(item.transactionId),
                      code: item.transactionCode,
                      date: item.createdAt ? item.createdAt.replace('T', ' ').slice(0, 16) : '—',
                      type: item.operationCode || 'IN_PO',
                      operationCode: item.operationCode,
                      operationName: item.operationName,
                      operationGroup: item.operationGroup,
                      logic: item.logic,
                      typeLabel: item.operationName || 'Giao dịch kho',
                      materialCode: item.materialId || '',
                      materialName: item.materialName || '',
                      bravoId: item.bravoId,
                      batchNumber: item.batchNumber || (item.batchId ? String(item.batchId) : '—'),
                      quantity: item.quantity,
                      unit: item.unit || '',
                      sourceLocation: item.locationCode || 'Kho Tổng',
                      destinationLocation: item.locationCode || 'Kho Tổng',
                      referenceDoc: item.referenceDoc || '—',
                      performer: item.performer || 'Hệ Thống',
                      note: item.note || ''
                    } : {
                      id: item.id,
                      code: item.code,
                      date: item.date,
                      type: item.type,
                      operationCode: item.operationCode,
                      operationName: item.typeLabel,
                      operationGroup: 'Nghiệp vụ kho',
                      logic: item.logic ?? (item.quantity < 0 ? -1 : 1),
                      typeLabel: item.typeLabel,
                      materialCode: item.materialCode,
                      materialName: item.materialName,
                      bravoId: undefined,
                      batchNumber: item.batchNumber,
                      quantity: item.quantity,
                      unit: item.unit,
                      sourceLocation: item.sourceLocation || 'Kho Tổng',
                      destinationLocation: item.destinationLocation || 'Kho Tổng',
                      referenceDoc: item.referenceDoc || '—',
                      performer: item.performer,
                      note: item.note || ''
                    };

                    const logic = trx.logic;
                    const isInbound = logic === 1;
                    const isOutbound = logic === -1;

                    return (
                      <tr
                        key={trx.id}
                        onClick={() => setSelectedTransaction(trx)}
                        className="hover:bg-emerald-50/70 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 font-mono font-bold text-[#007D3C]">
                          <div className="flex items-center gap-1.5">
                            <span>{trx.code}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{trx.date}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            {trx.operationCode && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-100">
                                {trx.operationCode}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {trx.typeLabel}
                            </span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{trx.materialCode}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{trx.materialName}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 font-semibold">{trx.batchNumber}</td>
                        <td className="p-3.5 font-mono text-slate-600">{trx.sourceLocation || trx.destinationLocation || 'Kho Tổng'}</td>
                        <td className="p-3.5 font-mono text-right font-bold text-sm">
                          <span className={isInbound ? 'text-[#007D3C]' : isOutbound ? 'text-[#F7941D]' : 'text-slate-600'}>
                            {isInbound ? `+${Math.abs(trx.quantity)}` : isOutbound ? `-${Math.abs(trx.quantity)}` : `${Math.abs(trx.quantity)}`} {trx.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{trx.performer}</td>
                        <td className="p-3.5 text-slate-500 max-w-[180px] truncate">{trx.referenceDoc || '—'}</td>
                        <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedTransaction(trx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#007D3C] hover:bg-emerald-100/50 transition-all cursor-pointer"
                            title="Xem chi tiết giao dịch"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

      {/* =========================================================================
          MODAL CHI TIẾT GIAO DỊCH KHO (TRANSACTION DETAILS MODAL)
      ========================================================================= */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base">Chi Tiết Giao Dịch Kho</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {selectedTransaction.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thời gian: {selectedTransaction.date} • Người thực hiện: {selectedTransaction.performer || 'Hệ Thống'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Card 1: Nghiệp Vụ Kho */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                  1. Nghiệp Vụ Kho & Hạch Toán
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">MÃ NGHIỆP VỤ</span>
                    <span className="font-mono font-extrabold text-slate-900 text-sm">
                      {selectedTransaction.operationCode || selectedTransaction.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TÊN NGHIỆP VỤ</span>
                    <span className="font-bold text-slate-900">
                      {selectedTransaction.typeLabel || selectedTransaction.operationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CHIỀU BIẾN ĐỘNG TỒN</span>
                    <span className={`font-bold inline-flex items-center gap-1 ${
                      selectedTransaction.logic === 1 ? 'text-[#007D3C]' : selectedTransaction.logic === -1 ? 'text-[#F7941D]' : 'text-slate-600'
                    }`}>
                      {selectedTransaction.logic === 1 ? 'Tăng Tồn Kho (+)' : selectedTransaction.logic === -1 ? 'Giảm Tồn Kho (-)' : 'Không Đổi (0)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Vật Tư & Lô Hàng */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider block text-[11px]">
                  2. Thông Tin Vật Tư & Lô Hàng (SKU & Batch)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">MÃ SKU / MÃ VẬT TƯ</span>
                    <div className="font-mono font-bold text-blue-700 text-sm">{selectedTransaction.materialCode}</div>
                    {selectedTransaction.bravoId && (
                      <span className="text-[10px] text-slate-500 font-mono">Mã Bravo: {selectedTransaction.bravoId}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">MÃ LÔ HÀNG (BATCH)</span>
                    <div className="font-mono font-extrabold text-slate-900 text-sm">{selectedTransaction.batchNumber}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px]">TÊN VẬT TƯ</span>
                    <div className="font-medium text-slate-900">{selectedTransaction.materialName}</div>
                  </div>
                </div>
              </div>

              {/* Card 3: Số Lượng & Vị Trí */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                <span className="font-bold text-[#007D3C] uppercase tracking-wider block text-[11px]">
                  3. Số Lượng Giao Dịch & Vị Trí Ô Kệ
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-500 block text-[10px]">SỐ LƯỢNG GIAO DỊCH</span>
                    <div className="font-mono font-black text-base text-slate-900">
                      <span className={selectedTransaction.logic === 1 ? 'text-[#007D3C]' : selectedTransaction.logic === -1 ? 'text-[#F7941D]' : 'text-slate-900'}>
                        {selectedTransaction.logic === 1 ? `+${Math.abs(selectedTransaction.quantity)}` : selectedTransaction.logic === -1 ? `-${Math.abs(selectedTransaction.quantity)}` : Math.abs(selectedTransaction.quantity)}
                      </span>{' '}
                      <span className="text-xs font-semibold text-slate-600">{selectedTransaction.unit}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">VỊ TRÍ Ô KỆ (LOCATION)</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {selectedTransaction.sourceLocation || selectedTransaction.destinationLocation || 'Kho Tổng'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CHỨNG TỪ THAM CHIẾU</span>
                    <div className="font-mono font-bold text-slate-800 text-xs">
                      {selectedTransaction.referenceDoc || '—'}
                    </div>
                  </div>
                </div>
                {selectedTransaction.note && (
                  <div className="pt-2 border-t border-emerald-200/60">
                    <span className="text-slate-500 block text-[10px]">GHI CHÚ / DIỄN GIẢI</span>
                    <div className="text-slate-700 italic">{selectedTransaction.note}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                CSDL MMS1 • tbl_transaction #{selectedTransaction.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> In Phiếu
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
