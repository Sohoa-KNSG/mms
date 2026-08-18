import React, { useState } from 'react';
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
  Printer
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';

export const ReportsModule: React.FC = () => {
  const { materials, batches, transactions } = useWarehouse();

  const [activeReport, setActiveReport] = useState<'nxt' | 'ledger'>('nxt');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Generate Báo cáo Nhập Xuất Tồn
  const nxtReportData = materials.map(mat => {
    const matBatches = batches.filter(b => b.materialId === mat.id);
    const endingQty = matBatches.reduce((sum, b) => sum + b.quantity, 0);

    // Sum transactions for this material
    const matTrx = transactions.filter(t => t.materialId === mat.id);
    const inQty = matTrx
      .filter(t => t.quantity > 0)
      .reduce((sum, t) => sum + t.quantity, 0);
    const outQty = matTrx
      .filter(t => t.quantity < 0)
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
    link.setAttribute('download', `Bao_Cao_NXT_MMS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" /> Reports & Analytics Ledger
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Báo Cáo Nhập - Xuất - Tồn & Sổ Giao Dịch Kho
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu số dư, biến động nhập xuất theo kỳ kế toán và truy xuất vết giao dịch chi tiết.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveReport('nxt')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeReport === 'nxt' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Báo Cáo NXT Tổng Hợp
          </button>
          <button
            onClick={() => setActiveReport('ledger')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeReport === 'ledger' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Sổ Nhật Ký Giao Dịch
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-bold text-slate-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel / CSV
          </button>
        </div>
      </div>

      {activeReport === 'nxt' ? (
        <div className="space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Tổng Giá Trị Đầu Kỳ</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {totalBeginningValue.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Tổng Giá Trị Cuối Kỳ</span>
              <div className="text-xl font-extrabold text-blue-700 mt-1">
                {totalEndingValue.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Số Mặt Hàng Đang Có Tồn</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
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
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
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
                    <th className="p-3 text-right text-emerald-700">Nhập</th>
                    <th className="p-3 text-right text-amber-700">Xuất</th>
                    <th className="p-3 text-right text-blue-700 font-bold">Tồn Cuối</th>
                    <th className="p-3 text-right">Thành Tiền Cuối (đ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredNXT.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-700">{row.code}</td>
                      <td className="p-3 font-medium text-slate-900 max-w-[200px] truncate">{row.name}</td>
                      <td className="p-3 text-slate-500">{row.unit}</td>
                      <td className="p-3 font-mono text-right text-slate-600">{row.price.toLocaleString('vi-VN')}</td>
                      <td className="p-3 font-mono text-right text-slate-600">{row.beginningQty}</td>
                      <td className="p-3 font-mono text-right font-bold text-emerald-700">{row.inQty > 0 ? `+${row.inQty}` : '—'}</td>
                      <td className="p-3 font-mono text-right font-bold text-amber-700">{row.outQty > 0 ? `-${row.outQty}` : '—'}</td>
                      <td className="p-3 font-mono text-right font-extrabold text-blue-700 text-sm">{row.endingQty}</td>
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
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-900">
              Sổ Nhật Ký Lưu Chuyển Vật Tư Toàn Hệ Thống ({transactions.length} bản ghi)
            </span>
          </div>

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(trx => {
                    const isInbound = trx.quantity > 0;
                    return (
                      <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-blue-700">{trx.code}</td>
                        <td className="p-3.5 font-mono text-slate-500">{trx.date}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {trx.typeLabel}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{trx.materialCode}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{trx.materialName}</div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 font-semibold">{trx.batchNumber}</td>
                        <td className="p-3.5 font-mono text-slate-600">{trx.sourceLocation || trx.destinationLocation || 'Kho Tổng'}</td>
                        <td className="p-3.5 font-mono text-right font-bold text-sm">
                          <span className={isInbound ? 'text-emerald-700' : 'text-amber-700'}>
                            {isInbound ? `+${trx.quantity}` : `${trx.quantity}`} {trx.unit}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-medium">{trx.performer}</td>
                        <td className="p-3.5 text-slate-500 max-w-[200px] truncate">{trx.referenceDoc || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
