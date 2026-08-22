import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  ArrowUpFromLine,
  Boxes,
  ShieldCheck,
  Clock,
  Maximize2,
  Minimize2,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowDownToLine,
  Sparkles,
  Zap,
  Radio,
  X,
  ChevronRight,
  Package,
  Layers3,
  Server,
  Building2,
  Users,
  UserCheck,
  Flame,
  AlertCircle,
  Clock3,
  Timer
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  tvDashboardService,
  TvDashboardOverview
} from '../api/tvDashboardApi';

interface TvDashboardPageProps {
  onClose?: () => void;
}

export const TvDashboardPage: React.FC<TvDashboardPageProps> = ({ onClose }) => {
  const [data, setData] = useState<TvDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Đồng hồ số chạy từng giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch API
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await tvDashboardService.getOverview();
      setData(res);
    } catch (err: any) {
      console.error('TV Dashboard Error:', err);
      setError(err.message || 'Lỗi kết nối CSDL MMS1');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh countdown 15s
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Format Helpers
  const formatTimeStr = (d: Date) => {
    return d.toLocaleTimeString('vi-VN', { hour12: false });
  };

  const formatDateStr = (d: Date) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('vi-VN').format(Math.round(num));
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* 1. TV Top Cockpit Header with Kèm Nghĩa Logo */}
      <header className="px-6 py-3 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md flex items-center justify-between shrink-0 shadow-lg">
        {/* Left: Kèm Nghĩa Brand Logo & Facility */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-md">
            <img
              src="https://knsgblob.blob.core.windows.net/anhapp/Logo_knsg.png"
              alt="Kềm Nghĩa Logo"
              className="h-8 md:h-9 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg md:text-xl font-black uppercase tracking-wider text-white">
                KỀM NGHĨA WMS <span className="text-emerald-400 font-extrabold">• OPERATIONS TV WALLBOARD</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-extrabold text-[11px] flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE CSDL MMS1
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Bảng điều hành giám sát nhập - xuất - tồn kho vật tư & phân xưởng sản xuất (UC-29)
            </p>
          </div>
        </div>

        {/* Center: Shift & Digital Clock */}
        <div className="flex items-center gap-4 bg-slate-950/90 px-5 py-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <div className="text-right">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-end gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {data?.shiftName || 'Ca 1 (06:00 - 14:00)'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {formatDateStr(currentTime)}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-2xl md:text-3xl font-mono font-black tracking-widest text-emerald-400 text-shadow">
            {formatTimeStr(currentTime)}
          </div>
        </div>

        {/* Right: Controls & Auto-refresh countdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs font-mono text-slate-300">
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Tự làm mới: <b className="text-emerald-400">{countdown}s</b></span>
          </div>

          <button
            onClick={() => {
              setCountdown(15);
              fetchData();
            }}
            title="Làm mới ngay"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Bật toàn màn hình TV (F11)'}
            className="p-2 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl border border-blue-500/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-bold px-3"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn Màn Hình TV'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Đóng chế độ Tivi"
              className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-500/40 transition-all cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Wallboard Content */}
      <main className="flex-1 p-4.5 overflow-y-auto space-y-4.5">
        {/* Section 1: Inbound vs Outbound Big Cockpit Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
          {/* ========================================================= */}
          {/* PANEL A: QUẢN LÝ NHẬP KHO (INBOUND LOGISTICS) */}
          {/* ========================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Title Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-white">
                    QUẢN LÝ NHẬP KHO (INBOUND)
                  </h2>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    Tiếp nhận NCC, KCS/QC AQL & Thủ tục cất lưu kho giá kệ
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 block">Số phiếu nhận hôm nay</span>
                <span className="text-xl md:text-2xl font-black text-emerald-400">
                  {data?.inbound.todayReceipts ?? 0} <small className="text-xs font-normal text-slate-400">/ {formatNumber(data?.inbound.totalReceipts)} tổng</small>
                </span>
              </div>
            </div>

            {/* Inbound Metrics 6-Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3.5 font-mono">
              {/* 1. Chờ QC kiểm */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Chờ QC kiểm
                </span>
                <span className="text-2xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.inbound.pendingQc)} <small className="text-xs text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 2. Cảnh báo: Quá 1 ngày chưa QC */}
              <div className={`rounded-xl p-3 flex flex-col justify-between border ${
                (data?.inbound.pendingQcOverdue1Day ?? 0) > 0
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[11px] font-bold uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> Quá 1 ngày chưa QC
                </span>
                <span className="text-2xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.inbound.pendingQcOverdue1Day)} <small className="text-xs font-normal">phiếu</small>
                </span>
              </div>

              {/* 3. Đã kiểm chờ nhập kho */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Đã kiểm chờ nhập kệ
                </span>
                <span className="text-2xl font-black text-blue-400 mt-1">
                  {formatNumber(data?.inbound.qcPassedPendingPutaway)} <small className="text-xs text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 4. Cảnh báo: Quá 1 ngày chưa nhập kho */}
              <div className={`rounded-xl p-3 flex flex-col justify-between border ${
                (data?.inbound.putawayOverdue1Day ?? 0) > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[11px] font-bold uppercase flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Quá 1 ngày chưa nhập kho
                </span>
                <span className="text-2xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.inbound.putawayOverdue1Day)} <small className="text-xs font-normal">phiếu</small>
                </span>
              </div>

              {/* 5. Số batch chưa lên kệ */}
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-purple-300 uppercase flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-purple-400" /> Batch chưa lên kệ (Tạm)
                </span>
                <span className="text-2xl font-black text-purple-400 mt-1">
                  {formatNumber(data?.inbound.batchesNotOnRack)} <small className="text-xs text-slate-500 font-normal">thùng/lô</small>
                </span>
              </div>

              {/* 6. QC Không Đạt chờ xử lý */}
              <div className={`rounded-xl p-3 flex flex-col justify-between border ${
                (data?.inbound.qcFailedPendingHandling ?? 0) > 0
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[11px] font-bold uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> QC Không Đạt chờ xử lý
                </span>
                <span className="text-2xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.inbound.qcFailedPendingHandling)} <small className="text-xs font-normal">mục</small>
                </span>
              </div>
            </div>

            {/* Inbound Footer Summary */}
            <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Đã hoàn tất nhập kho: <b className="text-emerald-400 font-bold">{formatNumber(data?.inbound.completedReceipts)} phiếu</b></span>
              <span>Tổng lượng nhận hôm nay: <b className="text-white font-bold">{formatNumber(data?.inbound.totalReceivedQty)} ĐVT</b></span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PANEL B: QUẢN LÝ XUẤT KHO (OUTBOUND LOGISTICS) */}
          {/* ========================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Title Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-white">
                    QUẢN LÝ XUẤT KHO (OUTBOUND)
                  </h2>
                  <p className="text-[11px] text-blue-400 font-medium">
                    Phê duyệt đề nghị, Soạn hàng FIFO PDA & Bàn giao sản xuất
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 block">Số phiếu đề nghị hôm nay</span>
                <span className="text-xl md:text-2xl font-black text-blue-400">
                  {data?.outbound.todayRequests ?? 0} <small className="text-xs font-normal text-slate-400">/ {formatNumber(data?.outbound.totalRequests)} tổng</small>
                </span>
              </div>
            </div>

            {/* Outbound Metrics 7-Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5 font-mono">
              {/* 1. Chờ duyệt */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Chờ Duyệt
                </span>
                <span className="text-2xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.outbound.pendingApproval)} <small className="text-xs text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 2. Chờ soạn */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-indigo-400" /> Chờ Soạn
                </span>
                <span className="text-2xl font-black text-indigo-400 mt-1">
                  {formatNumber(data?.outbound.waitingPick)} <small className="text-xs text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 3. Cảnh báo: Quá 1 ngày chưa soạn */}
              <div className={`rounded-xl p-3 flex flex-col justify-between border ${
                (data?.outbound.waitingPickOverdue1Day ?? 0) > 0
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[11px] font-bold uppercase flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" /> Quá 1 ngày chưa soạn
                </span>
                <span className="text-2xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.outbound.waitingPickOverdue1Day)} <small className="text-xs font-normal">phiếu</small>
                </span>
              </div>

              {/* 4. Đang soạn hàng */}
              <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-blue-300 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Đang Soạn
                </span>
                <span className="text-2xl font-black text-blue-400 mt-1">
                  {formatNumber(data?.outbound.pickingInProgress)} <small className="text-xs text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 5. Đã soạn xong */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Đã Soạn
                </span>
                <span className="text-2xl font-black text-teal-400 mt-1">
                  {formatNumber(data?.outbound.pickedCompleted)} <small className="text-xs text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 6. Cảnh báo: Đã soạn quá 2h chưa nhận */}
              <div className={`col-span-2 rounded-xl p-3 flex flex-col justify-between border ${
                (data?.outbound.pickedOverdue2Hours ?? 0) > 0
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400'
              }`}>
                <span className="text-[11px] font-bold uppercase flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5 text-rose-400" /> Đã soạn quá 2h chưa nhận
                </span>
                <span className="text-2xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.outbound.pickedOverdue2Hours)} <small className="text-xs font-normal">phiếu chờ xưởng nhận</small>
                </span>
              </div>

              {/* 7. Phiếu đã nhận */}
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-emerald-300 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Đã Nhận Hàng
                </span>
                <span className="text-2xl font-black text-emerald-400 mt-1">
                  {formatNumber(data?.outbound.receivedByWorkshop)} <small className="text-xs text-slate-500 font-normal">phiếu</small>
                </span>
              </div>
            </div>

            {/* Outbound Footer Summary */}
            <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Đã xuất thành công: <b className="text-blue-400 font-bold">{formatNumber(data?.outbound.receivedByWorkshop)} phiếu</b></span>
              <span>Tổng lượng xuất hôm nay: <b className="text-white font-bold">{formatNumber(data?.outbound.totalIssuedQty)} ĐVT</b></span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: HIỂN THỊ RÕ ĐƠN VỊ CẦN SOẠN HÀNG (WORKSHOP DEMAND) */}
        {/* ========================================================= */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl">
          <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-white">
                  ĐƠN VỊ & PHÂN XƯỞNG CẦN SOẠN HÀNG (WORKSHOP PICKING DEMAND)
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Chi tiết các phân xưởng sản xuất Kềm Nghĩa đang chờ xuất vật tư theo mức độ ưu tiên
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> CẦN GẤP &lt; 2H
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
                TRONG CA HÔM NAY
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(data?.pendingWorkshops || []).map((ws, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all shadow-xs ${
                  ws.priorityLevel === 'URGENT'
                    ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-white line-clamp-1" title={ws.departmentName}>
                      {ws.departmentName}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">Mã BP: {ws.departmentCode}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase shrink-0 ${
                      ws.priorityLevel === 'URGENT'
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {ws.priorityLevel === 'URGENT' ? 'CẤP THIẾT' : 'TRONG CA'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 font-mono text-center">
                  <div className="bg-slate-900/90 rounded-lg p-1.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Số phiếu</span>
                    <span className="text-lg font-black text-amber-400">{ws.pendingOrders}</span>
                  </div>
                  <div className="bg-slate-900/90 rounded-lg p-1.5 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Tổng lượng</span>
                    <span className="text-sm font-black text-white">{formatNumber(ws.totalQuantity)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>Thời gian cần:</span>
                  <span className="text-emerald-400 font-bold">{ws.earliestNeededTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: KPI NHÂN SỰ SOẠN & NHẬN HÀNG (STAFF KPIS) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
          {/* Top Nhân Viên Soạn Hàng */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-white">
                  KPI NĂNG SUẤT SOẠN HÀNG (TOP PICKERS)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Thủ kho / Nhân viên PDA</span>
            </div>

            <div className="space-y-2">
              {(data?.topPickers || []).slice(0, 4).map((picker, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{picker.staffName}</span>
                      <span className="text-[10px] text-slate-400">{picker.roleOrDept}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-400 text-sm">{picker.completedCount} <small className="text-[10px] font-normal text-slate-400">phiếu</small></span>
                    <span className="text-[10px] text-slate-400 block">{formatNumber(picker.totalQuantity)} ĐVT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Nhân Viên / Phân Xưởng Nhận Hàng */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-white">
                  KPI TIẾP NHẬN VẬT TƯ PHÂN XƯỞNG (RECEIVERS)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Đơn vị nhận sản xuất</span>
            </div>

            <div className="space-y-2">
              {(data?.topReceivers || []).slice(0, 4).map((receiver, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-white block">{receiver.staffName}</span>
                      <span className="text-[10px] text-slate-400">{receiver.roleOrDept}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-teal-400 text-sm">{receiver.completedCount} <small className="text-[10px] font-normal text-slate-400">phiếu</small></span>
                    <span className="text-[10px] text-slate-400 block">{formatNumber(receiver.totalQuantity)} ĐVT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 4: THROUGHPUT 24H & LIVE REAL-TIME FEED */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4.5">
          {/* Throughput Bar Chart */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-white">
                  NHỊP ĐỘ XUẤT - NHẬP THEO GIỜ (HOURLY THROUGHPUT)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" /> Nhập Kho
                </span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-3 h-3 rounded-xs bg-blue-500" /> Xuất Kho
                </span>
              </div>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.hourlyThroughput || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="hourLabel" stroke="#94a3b8" fontSize={10} fontVariant="mono" />
                  <YAxis stroke="#94a3b8" fontSize={10} fontVariant="mono" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="inboundQty" name="Nhập Kho" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outboundQty" name="Xuất Kho" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sức chứa Kệ Kho Mini Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-purple-400" />
                <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-white">
                  LẤP ĐẦY KỆ KHO ({data?.storage.occupancyRate}%)
                </h3>
              </div>
              <span className="text-xs font-mono text-purple-400 font-bold">
                {data?.storage.occupiedLocations ?? 0}/{data?.storage.totalLocations ?? 0}
              </span>
            </div>

            <div className="space-y-2 my-auto">
              {(data?.storage.rackGroups || []).slice(0, 4).map((group, idx) => (
                <div key={idx} className="bg-slate-950/70 p-2 rounded-lg border border-slate-800 font-mono text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-200">{group.groupName}</span>
                    <span className="font-extrabold text-purple-400">{group.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        group.occupancyRate > 90
                          ? 'bg-rose-500'
                          : group.occupancyRate > 75
                          ? 'bg-amber-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, group.occupancyRate)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400 font-mono">
              <span>SKU: <b className="text-white">{data?.storage.totalActiveSkus ?? 0}</b></span>
              <span>Tồn: <b className="text-emerald-400">{formatNumber(data?.storage.totalStockQuantity)}</b></span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
