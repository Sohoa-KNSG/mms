import React from 'react';
import {
  Boxes,
  Truck,
  CheckSquare,
  ArrowUpFromLine,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Smartphone,
  Barcode,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useWarehouse } from '../services/warehouseStore';
import { NavModule } from './Sidebar';

interface DashboardProps {
  onNavigate: (module: NavModule) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const {
    materials,
    batches,
    receivingOrders,
    qcTickets,
    issueRequests,
    locations,
    transactions,
    setActiveBarcodePrint
  } = useWarehouse();

  // Metrics calculations
  const totalStockValue = batches.reduce((sum, b) => sum + b.quantity * b.unitCost, 0);
  const totalBatches = batches.length;
  const pendingQC = qcTickets.filter(q => q.evaluation === 'PENDING').length;
  const waitingPutaway = receivingOrders.filter(r => r.status === 'QC_PASSED').length;
  const pendingIssueApproval = issueRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
  
  const lowStockItems = materials.filter(m => {
    const currentQty = batches
      .filter(b => b.materialId === m.id)
      .reduce((sum, b) => sum + b.quantity, 0);
    return currentQty <= m.minStock;
  });

  // Calculate Warehouse Capacities
  const totalLocationCapacity = locations.reduce((sum, l) => sum + l.capacity, 0);
  const totalLocationOccupied = locations.reduce((sum, l) => sum + l.occupied, 0);
  const overallOccupancyRate = totalLocationCapacity > 0
    ? Math.round((totalLocationOccupied / totalLocationCapacity) * 100)
    : 0;

  // Chart Data - Inbound vs Outbound
  const activityData = [
    { day: 'T2 (08/08)', nhap: 280, xuat: 120 },
    { day: 'T3 (09/08)', nhap: 450, xuat: 310 },
    { day: 'T4 (10/08)', nhap: 150, xuat: 200 },
    { day: 'T5 (11/08)', nhap: 600, xuat: 450 },
    { day: 'T6 (12/08)', nhap: 2000, xuat: 180 },
    { day: 'T7 (13/08)', nhap: 10, xuat: 250 },
    { day: 'CN (14/08)', nhap: 2300, xuat: 152 }
  ];

  // Category Breakdown for Donut Chart
  const categoryData = [
    { name: 'Linh kiện Điện tử', value: 45, color: '#3b82f6' },
    { name: 'Cơ khí & Kim loại', value: 25, color: '#10b981' },
    { name: 'Hoá chất & Keo', value: 12, color: '#f59e0b' },
    { name: 'Bao bì & Đóng gói', value: 18, color: '#8b5cf6' }
  ];

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Industrial Operations Control - Clean Light Slate Minimalist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 text-slate-900 shadow-2xs relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-700" /> Hệ Thống Quản Lý Kho & Vận Hành Sàn Kho MMS (Standard Enterprise)
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">
            Bảng Điều Khiển Tổng Quan Kho & Dòng Chảy Vật Tư
          </h1>
          <p className="mt-1.5 text-slate-500 text-xs lg:text-sm leading-relaxed">
            Quản lý chuỗi cung ứng vật tư: Nhận hàng (Inbound), Kiểm định QC/QA, Cất lưu kho giá kệ (Putaway), Quản lý Lô/Batch FIFO/FEFO và Xuất kho sản xuất.
          </p>

          {/* Quick Action Shortcuts */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('handheld')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>MÁY QUÉT PDA (LASER)</span>
            </button>
            <button
              onClick={() => onNavigate('receiving')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-slate-600" /> + Nhận Hàng Mới
            </button>
            <button
              onClick={() => onNavigate('qc')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5 text-slate-600" /> Kiểm Tra QC ({pendingQC})
            </button>
            <button
              onClick={() => onNavigate('outbound')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5 text-slate-600" /> Đề Nghị Xuất ({pendingIssueApproval})
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-600" /> Sơ Đồ Kệ Kho
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng giá trị tồn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tổng Giá Trị Tồn Kho
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900 truncate">
              {formatVND(totalStockValue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{totalBatches} Lô / Batches</span>
              <span>•</span>
              <span>{materials.length} Mã SKU</span>
            </div>
          </div>
        </div>

        {/* Card 2: Chờ kiểm QC */}
        <div
          onClick={() => onNavigate('qc')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đang Chờ Kiểm Định QC
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600">
              {pendingQC} <span className="text-xs font-medium text-slate-500">phiếu</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>Cần đánh giá tiêu chí</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 3: Chờ lưu kho lên kệ */}
        <div
          onClick={() => onNavigate('putaway')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chờ Lưu Kho (Putaway)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-700">
              {waitingPutaway} <span className="text-xs font-medium text-slate-500">lô QC Pass</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>Đang xếp vị trí kệ</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 4: Đề nghị xuất chờ duyệt */}
        <div
          onClick={() => onNavigate('outbound')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Đề Nghị Xuất Chờ Duyệt
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-purple-700">
              {pendingIssueApproval} <span className="text-xs font-medium text-slate-500">phiếu</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span>Phê duyệt xuất sản xuất</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Biểu Đồ Lưu Chuyển Vật Tư (Nhập vs Xuất 7 ngày)
              </h2>
              <p className="text-xs text-slate-500">Số lượng đơn vị vật tư qua các ca vận hành</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                <span className="text-slate-600 font-medium">Nhập kho</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                <span className="text-slate-600 font-medium">Xuất kho</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="nhap" name="Nhập kho" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="xuat" name="Xuất kho" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Warehouse Racks Occupancy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-900 text-sm">Công Suất Sức Chứa Kệ Kho</h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                {overallOccupancyRate}% Sử Dụng
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tổng sức chứa: {totalLocationOccupied.toLocaleString()} / {totalLocationCapacity.toLocaleString()} slot
            </p>

            {/* Warehouse Breakdown Progress Bars */}
            <div className="space-y-3.5">
              {[
                { name: 'Kho A - Linh kiện điện tử', occupied: 3220, capacity: 8000, color: 'bg-blue-600' },
                { name: 'Kho B - Cơ khí & Hoá chất', occupied: 1540, capacity: 3000, color: 'bg-emerald-600' },
                { name: 'Kho C - Bao bì & Phụ liệu', occupied: 3000, capacity: 6000, color: 'bg-purple-600' }
              ].map(w => {
                const pct = Math.round((w.occupied / w.capacity) * 100);
                return (
                  <div key={w.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 truncate">{w.name}</span>
                      <span className="font-mono text-slate-500">{pct}% ({w.occupied}/{w.capacity})</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${w.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Sơ đồ vị trí kệ 3D/2D</span>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Mở sơ đồ kho <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Operational Watchlists: Low Stock Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-slate-900 text-sm">Cảnh Báo Vật Tư Chạm Định Mức Tồn Min</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
              {lowStockItems.length} mã SKU
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Tất cả vật tư đều đạt trên định mức an toàn tối thiểu.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockItems.map(item => {
                const currentQty = batches
                  .filter(b => b.materialId === item.id)
                  .reduce((sum, b) => sum + b.quantity, 0);
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{item.code}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {item.categoryName}
                        </span>
                      </div>
                      <div className="text-slate-600 truncate mt-0.5">{item.name}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-rose-600 font-mono">
                        Tồn: {currentQty} {item.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Min: {item.minStock} • Max: {item.maxStock}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-slate-900 text-sm">Nhật Ký Giao Dịch Kho Gần Đây</h2>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Xem sổ chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 4).map(trx => {
              const isInbound = trx.quantity > 0;
              return (
                <div
                  key={trx.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isInbound ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isInbound ? <Truck className="w-3.5 h-3.5" /> : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">{trx.code}</span>
                        <span className="text-[10px] text-slate-400">• {trx.date}</span>
                      </div>
                      <div className="text-slate-600 truncate text-[11px]">
                        {trx.materialName} ({trx.batchNumber})
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-bold ${
                        isInbound ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {isInbound ? `+${trx.quantity}` : `${trx.quantity}`} {trx.unit}
                    </span>
                    <div className="text-[10px] text-slate-400">{trx.typeLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
