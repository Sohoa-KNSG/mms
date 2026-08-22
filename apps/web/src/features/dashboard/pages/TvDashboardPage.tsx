import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  AlertCircle,
  Clock3,
  Timer,
  ShieldCheck,
  Package,
  Activity,
  Zap,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
  ListOrdered,
  PackageCheck,
  LogOut
} from 'lucide-react';
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
      {/* 1. TV Top Cockpit Header with Kèm Nghĩa Logo (Large Font & High Contrast) */}
      <header className="px-6 py-3 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md flex items-center justify-between shrink-0 shadow-lg">
        {/* Left: Kèm Nghĩa Brand Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-2xl border border-slate-700/80 shadow-md">
            <img
              src="https://knsgblob.blob.core.windows.net/anhapp/Logo_knsg.png"
              alt="Kềm Nghĩa Logo"
              className="h-9 md:h-11 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-white">
                KỀM NGHĨA WMS <span className="text-emerald-400 font-extrabold">• OPERATIONS TV WALLBOARD</span>
              </h1>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-black text-xs flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE CSDL MMS1
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Bảng điều hành giám sát nhập - xuất - tồn kho vật tư & phân xưởng sản xuất (UC-29)
            </p>
          </div>
        </div>

        {/* Center: Shift & Digital Clock */}
        <div className="flex items-center gap-5 bg-slate-950/90 px-5 py-2 rounded-2xl border border-slate-800 shadow-inner">
          <div className="text-right">
            <div className="text-xs md:text-sm font-black text-amber-400 uppercase tracking-wider flex items-center justify-end gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              {data?.shiftName || 'CA 1 (06:00 - 14:00)'}
            </div>
            <div className="text-xs md:text-sm text-slate-300 font-mono font-semibold">
              {formatDateStr(currentTime)}
            </div>
          </div>
          <div className="h-10 w-px bg-slate-800" />
          <div className="text-3xl md:text-4xl font-mono font-black tracking-widest text-emerald-400">
            {formatTimeStr(currentTime)}
          </div>
        </div>

        {/* Right: Controls & Auto-refresh countdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs md:text-sm font-mono text-slate-200 font-bold">
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Tự làm mới: <b className="text-emerald-400 text-sm md:text-base">{countdown}s</b></span>
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
            className="p-2 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl border border-blue-500/40 transition-all cursor-pointer active:scale-95 flex items-center gap-2 text-xs md:text-sm font-bold px-3.5"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn Màn Hình TV'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Đăng xuất tài khoản / Thoát chế độ Tivi"
              className="p-2 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-500/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs md:text-sm font-bold px-3.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Wallboard Content */}
      <main className="flex-1 p-3 md:p-4 overflow-hidden flex flex-col gap-3 min-h-0">
        {/* ROW 1: INBOUND VS OUTBOUND COCKPIT PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 shrink-0">
          {/* ========================================================= */}
          {/* PANEL A: QUẢN LÝ NHẬP KHO (INBOUND) */}
          {/* ========================================================= */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black uppercase tracking-wider text-white">
                    QUẢN LÝ NHẬP KHO (INBOUND)
                  </h2>
                  <p className="text-xs md:text-sm text-emerald-400 font-semibold">
                    Tiếp nhận NCC, KCS/QC AQL & Thủ tục cất lưu kho giá kệ
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs md:text-sm text-slate-300 font-bold block">Số phiếu nhận hôm nay</span>
                <span className="text-2xl md:text-3xl font-black text-emerald-400">
                  {data?.inbound.todayReceipts ?? 0} <small className="text-xs md:text-sm font-medium text-slate-400">/ {formatNumber(data?.inbound.totalReceipts)} tổng</small>
                </span>
              </div>
            </div>

            {/* Inbound 6-Card Grid */}
            <div className="grid grid-cols-3 gap-2.5 my-2.5 font-mono">
              {/* 1. Chờ QC kiểm */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 md:p-3 flex flex-col justify-between">
                <span className="text-xs md:text-sm font-black text-slate-200 uppercase flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" /> CHỜ QC KIỂM
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.inbound.pendingQc)} <small className="text-xs md:text-sm text-slate-400 font-semibold">phiếu</small>
                </span>
              </div>

              {/* 2. Quá 1 ngày chưa QC */}
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-2.5 md:p-3 flex flex-col justify-between text-rose-400">
                <span className="text-xs md:text-sm font-black uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-400 shrink-0" /> QUÁ 1 NGÀY CHƯA QC
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.inbound.pendingQcOverdue1Day)} <small className="text-xs md:text-sm font-semibold">phiếu</small>
                </span>
              </div>

              {/* 3. Đã kiểm chờ nhập kệ */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 md:p-3 flex flex-col justify-between">
                <span className="text-xs md:text-sm font-black text-slate-200 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" /> ĐÃ KIỂM CHỜ NHẬP KỆ
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-blue-400 mt-1">
                  {formatNumber(data?.inbound.qcPassedPendingPutaway)} <small className="text-xs md:text-sm text-slate-400 font-semibold">phiếu</small>
                </span>
              </div>

              {/* 4. Quá 1 ngày chưa nhập kho */}
              <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-2.5 md:p-3 flex flex-col justify-between text-amber-400">
                <span className="text-xs md:text-sm font-black uppercase flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" /> QUÁ 1 NGÀY CHƯA NHẬP KHO
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.inbound.putawayOverdue1Day)} <small className="text-xs md:text-sm font-semibold">phiếu</small>
                </span>
              </div>

              {/* 5. Batch chưa lên kệ (Tạm) */}
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-2.5 md:p-3 flex flex-col justify-between">
                <span className="text-xs md:text-sm font-black text-purple-300 uppercase flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-purple-400 shrink-0" /> BATCH CHƯA LÊN KỆ (TẠM)
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-purple-400 mt-1">
                  {formatNumber(data?.inbound.batchesNotOnRack)} <small className="text-xs md:text-sm text-slate-400 font-semibold">thùng/lô</small>
                </span>
              </div>

              {/* 6. QC Không Đạt chờ xử lý */}
              <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-2.5 md:p-3 flex flex-col justify-between text-rose-300">
                <span className="text-xs md:text-sm font-black uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> QC KHÔNG ĐẠT CHỜ XỬ LÝ
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.inbound.qcFailedPendingHandling)} <small className="text-xs md:text-sm font-semibold">mục</small>
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs md:text-sm font-mono text-slate-300">
              <span>Đã hoàn tất nhập kho: <b className="text-emerald-400 font-black text-sm md:text-base">{formatNumber(data?.inbound.completedReceipts)} phiếu</b></span>
              <span>Tổng lượng nhận hôm nay: <b className="text-white font-black text-sm md:text-base">{formatNumber(data?.inbound.totalReceivedQty)} ĐVT</b></span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PANEL B: QUẢN LÝ XUẤT KHO (OUTBOUND) */}
          {/* ========================================================= */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black uppercase tracking-wider text-white">
                    QUẢN LÝ XUẤT KHO (OUTBOUND)
                  </h2>
                  <p className="text-xs md:text-sm text-blue-400 font-semibold">
                    Phê duyệt đề nghị, Soạn hàng FIFO PDA & Bàn giao sản xuất
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs md:text-sm text-slate-300 font-bold block">Số phiếu đề nghị hôm nay</span>
                <span className="text-2xl md:text-3xl font-black text-blue-400">
                  {data?.outbound.todayRequests ?? 0} <small className="text-xs md:text-sm font-medium text-slate-400">/ {formatNumber(data?.outbound.totalRequests)} tổng</small>
                </span>
              </div>
            </div>

            {/* Outbound 7-Card Grid */}
            <div className="grid grid-cols-4 gap-2.5 my-2.5 font-mono">
              {/* 1. Chờ duyệt */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 md:p-3 flex flex-col justify-between">
                <span className="text-xs md:text-sm font-black text-slate-200 uppercase flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" /> CHỜ DUYỆT
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.outbound.pendingApproval)} <small className="text-xs md:text-sm text-slate-400 font-semibold">phiếu</small>
                </span>
              </div>

              {/* 2. Chờ soạn */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 md:p-3 flex flex-col justify-between">
                <span className="text-xs md:text-sm font-black text-slate-200 uppercase flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-indigo-400 shrink-0" /> CHỜ SOẠN
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-indigo-400 mt-1">
                  {formatNumber(data?.outbound.waitingPick)} <small className="text-xs md:text-sm text-slate-400 font-semibold">phiếu</small>
                </span>
              </div>

              {/* 3. Quá 1 ngày chưa soạn */}
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-2.5 md:p-3 flex flex-col justify-between text-rose-400">
                <span className="text-xs md:text-sm font-black uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-400 shrink-0" /> QUÁ 1 NGÀY CHƯA SOẠN
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.outbound.waitingPickOverdue1Day)} <small className="text-xs md:text-sm font-semibold">phiếu</small>
                </span>
              </div>

              {/* 4. Đang soạn */}
              <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-2.5 md:p-3 flex flex-col justify-between">
                <span className="text-xs md:text-sm font-black text-blue-300 uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400 animate-pulse shrink-0" /> ĐANG SOẠN
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-blue-400 mt-1">
                  {formatNumber(data?.outbound.pickingInProgress)} <small className="text-xs md:text-sm text-slate-400 font-semibold">phiếu</small>
                </span>
              </div>

              {/* 5. Đã soạn */}
              <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-2.5 md:p-3 flex flex-col justify-between">
                <span className="text-xs md:text-sm font-black text-teal-300 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" /> ĐÃ SOẠN
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-teal-400 mt-1">
                  {formatNumber(data?.outbound.pickedCompleted)} <small className="text-xs md:text-sm text-slate-400 font-semibold">phiếu</small>
                </span>
              </div>

              {/* 6. Đã soạn quá 2h chưa nhận */}
              <div className="col-span-2 bg-rose-500/20 border border-rose-500/50 rounded-xl p-2.5 md:p-3 flex flex-col justify-between text-rose-300">
                <span className="text-xs md:text-sm font-black uppercase flex items-center gap-1.5">
                  <Clock3 className="w-4 h-4 text-rose-400 shrink-0" /> ĐÃ SOẠN QUÁ 2H CHƯA NHẬN
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.outbound.pickedOverdue2Hours)} <small className="text-xs md:text-sm font-semibold">phiếu chờ xưởng nhận</small>
                </span>
              </div>

              {/* 7. Đã nhận hàng */}
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2.5 md:p-3 flex flex-col justify-between">
                <span className="text-xs md:text-sm font-black text-emerald-300 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> ĐÃ NHẬN HÀNG
                </span>
                <span className="text-2xl md:text-3xl lg:text-4xl font-black text-emerald-400 mt-1">
                  {formatNumber(data?.outbound.receivedByWorkshop)} <small className="text-xs md:text-sm text-slate-400 font-semibold">phiếu</small>
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs md:text-sm font-mono text-slate-300">
              <span>Đã xuất thành công: <b className="text-blue-400 font-black text-sm md:text-base">{formatNumber(data?.outbound.receivedByWorkshop)} phiếu</b></span>
              <span>Tổng lượng xuất hôm nay: <b className="text-white font-black text-sm md:text-base">{formatNumber(data?.outbound.totalIssuedQty)} ĐVT</b></span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 2: THE 2 DETAILED REAL-TIME QUEUE TABLES (FULL HEIGHT EXTENSION) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 flex-1 min-h-0">
          {/* TABLE 1: 1. DANH SÁCH PHIẾU CHỜ SOẠN HÀNG XUẤT KHO */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <ListOrdered className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-wider text-white">
                  1. DANH SÁCH PHIẾU CHỜ SOẠN HÀNG XUẤT KHO
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded bg-blue-900/60 border border-cyan-500/40 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Đang Soạn
                </span>
                <span className="text-xs md:text-sm font-mono font-black text-indigo-300 px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40">
                  {data?.waitingOutboundQueue.length ?? 0} phiếu
                </span>
              </div>
            </div>

            {/* Table Body filling all available vertical space */}
            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 custom-scrollbar">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs md:text-sm text-slate-300 font-black uppercase tracking-wider bg-slate-950/90 sticky top-0 z-10">
                    <th className="py-2.5 px-3">Số Phiếu</th>
                    <th className="py-2.5 px-3">Đơn Vị (Phân Xưởng)</th>
                    <th className="py-2.5 px-3">Thời Gian Tiếp Nhận</th>
                    <th className="py-2.5 px-3 text-right">Thời Gian Chờ</th>
                    <th className="py-2.5 px-3 text-right">Thời Gian Soạn</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs md:text-sm">
                  {(data?.waitingOutboundQueue || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-sans font-bold text-sm">
                        Hiện không có phiếu nào đang chờ soạn
                      </td>
                    </tr>
                  ) : (
                    (data?.waitingOutboundQueue || []).map((item, idx) => (
                      <tr
                        key={idx}
                        className={`transition-all ${
                          item.isPicking
                            ? 'bg-blue-900/40 border-l-4 border-l-cyan-400 text-white font-bold ring-1 ring-cyan-500/30'
                            : 'hover:bg-slate-800/50 text-slate-200'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-black text-amber-400 text-sm md:text-base">
                          #{item.requestId}
                        </td>
                        <td className="py-2.5 px-3 text-white font-sans font-bold line-clamp-1 max-w-[200px]" title={item.departmentName}>
                          {item.departmentName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-medium">
                          {item.receivedTime}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">
                          <span className={`px-2 py-0.5 rounded text-xs md:text-sm font-black ${
                            item.waitMinutes > 1440
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : item.waitMinutes > 120
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}>
                            {item.waitDuration}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">
                          {item.isPicking ? (
                            <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse text-xs md:text-sm font-black">
                              {item.pickingDuration}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-black ${
                            item.isPicking
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          }`}>
                            {item.statusText}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 mt-auto border-t border-slate-800/80 text-xs text-slate-400 font-mono flex justify-between font-medium shrink-0">
              <span>* Thời gian soạn = now - thời điểm bắt đầu soạn hàng</span>
              <span>Dòng màu xanh viền sáng: Đơn hàng đang được soạn thực tế</span>
            </div>
          </div>

          {/* TABLE 2: 2. DANH SÁCH PHIẾU ĐÃ SOẠN CHỜ LẤY */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 md:p-4 shadow-2xl flex flex-col h-full min-h-0">
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <PackageCheck className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-wider text-white">
                  2. DANH SÁCH PHIẾU ĐÃ SOẠN CHỜ LẤY
                </h3>
              </div>
              <span className="text-xs md:text-sm font-mono font-black text-teal-300 px-3 py-1 rounded-lg bg-teal-500/20 border border-teal-500/40">
                {data?.pickedWaitingPickupQueue.length ?? 0} phiếu chờ nhận
              </span>
            </div>

            {/* Table Body filling all available vertical space */}
            <div className="flex-1 overflow-x-auto overflow-y-auto min-h-0 custom-scrollbar">
              <table className="w-full text-left font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs md:text-sm text-slate-300 font-black uppercase tracking-wider bg-slate-950/90 sticky top-0 z-10">
                    <th className="py-2.5 px-3">Số Phiếu</th>
                    <th className="py-2.5 px-3">Đơn Vị (Phân Xưởng)</th>
                    <th className="py-2.5 px-3">Thời Gian Soạn Xong</th>
                    <th className="py-2.5 px-3 text-right">Thời Gian Chờ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs md:text-sm">
                  {(data?.pickedWaitingPickupQueue || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 font-sans font-bold text-sm">
                        Hiện không có phiếu nào đã soạn đang chờ xưởng nhận
                      </td>
                    </tr>
                  ) : (
                    (data?.pickedWaitingPickupQueue || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-2.5 px-3 font-black text-teal-400 text-sm md:text-base">
                          #{item.requestId}
                        </td>
                        <td className="py-2.5 px-3 text-white font-sans font-bold line-clamp-1 max-w-[280px]" title={item.departmentName}>
                          {item.departmentName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-medium">
                          {item.completedTime}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black">
                          <span className={`px-2.5 py-1 rounded-md text-xs md:text-sm font-black ${
                            item.isOverdue2H
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                              : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                          }`}>
                            {item.waitDuration}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 mt-auto border-t border-slate-800/80 text-xs text-slate-400 font-mono flex justify-between font-medium shrink-0">
              <span>* Cảnh báo Đỏ nhấp nháy khi hàng đã soạn quá 2h chưa nhận</span>
              <span>Tự động cập nhật mỗi 15s</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
