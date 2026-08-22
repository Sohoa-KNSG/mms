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
  UserCheck
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
      {/* 1. TV Top Cockpit Header with Kèm Nghĩa Logo */}
      <header className="px-6 py-2.5 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md flex items-center justify-between shrink-0 shadow-lg">
        {/* Left: Kèm Nghĩa Brand Logo & Title */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2.5 bg-white px-2.5 py-1 rounded-xl border border-slate-700/80 shadow-md">
            <img
              src="https://knsgblob.blob.core.windows.net/anhapp/Logo_knsg.png"
              alt="Kềm Nghĩa Logo"
              className="h-7 md:h-8 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black uppercase tracking-wider text-white">
                KỀM NGHĨA WMS <span className="text-emerald-400 font-extrabold">• OPERATIONS TV WALLBOARD</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-extrabold text-[10px] flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE CSDL MMS1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Bảng điều hành giám sát nhập - xuất - tồn kho vật tư & phân xưởng sản xuất (UC-29)
            </p>
          </div>
        </div>

        {/* Center: Shift & Digital Clock */}
        <div className="flex items-center gap-3.5 bg-slate-950/90 px-4 py-1 rounded-2xl border border-slate-800 shadow-inner">
          <div className="text-right">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-end gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              {data?.shiftName || 'CA 1 (06:00 - 14:00)'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {formatDateStr(currentTime)}
            </div>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <div className="text-2xl md:text-3xl font-mono font-black tracking-widest text-emerald-400">
            {formatTimeStr(currentTime)}
          </div>
        </div>

        {/* Right: Controls & Auto-refresh countdown */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px] font-mono text-slate-300">
            <RefreshCw className={`w-3 h-3 text-emerald-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Tự làm mới: <b className="text-emerald-400">{countdown}s</b></span>
          </div>

          <button
            onClick={() => {
              setCountdown(15);
              fetchData();
            }}
            title="Làm mới ngay"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Bật toàn màn hình TV (F11)'}
            className="p-1.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl border border-blue-500/40 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 text-xs font-bold px-2.5"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn Màn Hình TV'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Đóng chế độ Tivi"
              className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl border border-rose-500/40 transition-all cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Wallboard Content */}
      <main className="flex-1 p-3.5 overflow-y-auto space-y-3.5 flex flex-col justify-between">
        {/* ROW 1: INBOUND VS OUTBOUND COCKPIT PANELS (EXACTLY AS IN SCREENSHOT) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 shrink-0">
          {/* ========================================================= */}
          {/* PANEL A: QUẢN LÝ NHẬP KHO (INBOUND) */}
          {/* ========================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-white">
                    QUẢN LÝ NHẬP KHO (INBOUND)
                  </h2>
                  <p className="text-[10px] text-emerald-400 font-medium">
                    Tiếp nhận NCC, KCS/QC AQL & Thủ tục cất lưu kho giá kệ
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">Số phiếu nhận hôm nay</span>
                <span className="text-lg md:text-xl font-black text-emerald-400">
                  {data?.inbound.todayReceipts ?? 0} <small className="text-[10px] font-normal text-slate-400">/ {formatNumber(data?.inbound.totalReceipts)} tổng</small>
                </span>
              </div>
            </div>

            {/* Inbound 6-Card Grid */}
            <div className="grid grid-cols-3 gap-2 my-2.5 font-mono">
              {/* 1. Chờ QC kiểm */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> CHỜ QC KIỂM
                </span>
                <span className="text-xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.inbound.pendingQc)} <small className="text-[10px] text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 2. Quá 1 ngày chưa QC */}
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-2.5 flex flex-col justify-between text-rose-400">
                <span className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" /> QUÁ 1 NGÀY CHƯA QC
                </span>
                <span className="text-xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.inbound.pendingQcOverdue1Day)} <small className="text-[10px] font-normal">phiếu</small>
                </span>
              </div>

              {/* 3. Đã kiểm chờ nhập kệ */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" /> ĐÃ KIỂM CHỜ NHẬP KỆ
                </span>
                <span className="text-xl font-black text-blue-400 mt-1">
                  {formatNumber(data?.inbound.qcPassedPendingPutaway)} <small className="text-[10px] text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 4. Quá 1 ngày chưa nhập kho */}
              <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-2.5 flex flex-col justify-between text-amber-400">
                <span className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-400" /> QUÁ 1 NGÀY CHƯA NHẬP KHO
                </span>
                <span className="text-xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.inbound.putawayOverdue1Day)} <small className="text-[10px] font-normal">phiếu</small>
                </span>
              </div>

              {/* 5. Batch chưa lên kệ (Tạm) */}
              <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-purple-300 uppercase flex items-center gap-1">
                  <Package className="w-3 h-3 text-purple-400" /> BATCH CHƯA LÊN KỆ (TẠM)
                </span>
                <span className="text-xl font-black text-purple-400 mt-1">
                  {formatNumber(data?.inbound.batchesNotOnRack)} <small className="text-[10px] text-slate-500 font-normal">thùng/lô</small>
                </span>
              </div>

              {/* 6. QC Không Đạt chờ xử lý */}
              <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-2.5 flex flex-col justify-between text-rose-300">
                <span className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" /> QC KHÔNG ĐẠT CHỜ XỬ LÝ
                </span>
                <span className="text-xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.inbound.qcFailedPendingHandling)} <small className="text-[10px] font-normal">mục</small>
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400">
              <span>Đã hoàn tất nhập kho: <b className="text-emerald-400 font-bold">{formatNumber(data?.inbound.completedReceipts)} phiếu</b></span>
              <span>Tổng lượng nhận hôm nay: <b className="text-white font-bold">{formatNumber(data?.inbound.totalReceivedQty)} ĐVT</b></span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PANEL B: QUẢN LÝ XUẤT KHO (OUTBOUND) */}
          {/* ========================================================= */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <ArrowUpFromLine className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-white">
                    QUẢN LÝ XUẤT KHO (OUTBOUND)
                  </h2>
                  <p className="text-[10px] text-blue-400 font-medium">
                    Phê duyệt đề nghị, Soạn hàng FIFO PDA & Bàn giao sản xuất
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">Số phiếu đề nghị hôm nay</span>
                <span className="text-lg md:text-xl font-black text-blue-400">
                  {data?.outbound.todayRequests ?? 0} <small className="text-[10px] font-normal text-slate-400">/ {formatNumber(data?.outbound.totalRequests)} tổng</small>
                </span>
              </div>
            </div>

            {/* Outbound 7-Card Grid */}
            <div className="grid grid-cols-4 gap-2 my-2.5 font-mono">
              {/* 1. Chờ duyệt */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> CHỜ DUYỆT
                </span>
                <span className="text-xl font-black text-amber-400 mt-1">
                  {formatNumber(data?.outbound.pendingApproval)} <small className="text-[10px] text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 2. Chờ soạn */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Timer className="w-3 h-3 text-indigo-400" /> CHỜ SOẠN
                </span>
                <span className="text-xl font-black text-indigo-400 mt-1">
                  {formatNumber(data?.outbound.waitingPick)} <small className="text-[10px] text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 3. Quá 1 ngày chưa soạn */}
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-2.5 flex flex-col justify-between text-rose-400">
                <span className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" /> QUÁ 1 NGÀY CHƯA SOẠN
                </span>
                <span className="text-xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.outbound.waitingPickOverdue1Day)} <small className="text-[10px] font-normal">phiếu</small>
                </span>
              </div>

              {/* 4. Đang soạn */}
              <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-blue-300 uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400 animate-pulse" /> ĐANG SOẠN
                </span>
                <span className="text-xl font-black text-blue-400 mt-1">
                  {formatNumber(data?.outbound.pickingInProgress)} <small className="text-[10px] text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 5. Đã soạn */}
              <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-teal-300 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-teal-400" /> ĐÃ SOẠN
                </span>
                <span className="text-xl font-black text-teal-400 mt-1">
                  {formatNumber(data?.outbound.pickedCompleted)} <small className="text-[10px] text-slate-500 font-normal">phiếu</small>
                </span>
              </div>

              {/* 6. Đã soạn quá 2h chưa nhận */}
              <div className="col-span-2 bg-rose-500/20 border border-rose-500/50 rounded-xl p-2.5 flex flex-col justify-between text-rose-300">
                <span className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <Clock3 className="w-3 h-3 text-rose-400" /> ĐÃ SOẠN QUÁ 2H CHƯA NHẬN
                </span>
                <span className="text-xl font-black text-rose-400 mt-1">
                  {formatNumber(data?.outbound.pickedOverdue2Hours)} <small className="text-[10px] font-normal">phiếu chờ xưởng nhận</small>
                </span>
              </div>

              {/* 7. Đã nhận hàng */}
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-emerald-300 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> ĐÃ NHẬN HÀNG
                </span>
                <span className="text-xl font-black text-emerald-400 mt-1">
                  {formatNumber(data?.outbound.receivedByWorkshop)} <small className="text-[10px] text-slate-500 font-normal">phiếu</small>
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] font-mono text-slate-400">
              <span>Đã xuất thành công: <b className="text-blue-400 font-bold">{formatNumber(data?.outbound.receivedByWorkshop)} phiếu</b></span>
              <span>Tổng lượng xuất hôm nay: <b className="text-white font-bold">{formatNumber(data?.outbound.totalIssuedQty)} ĐVT</b></span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ROW 2: THE 2 DETAILED REAL-TIME QUEUE TABLES */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-[300px]">
          {/* TABLE 1: 1. DANH SÁCH HÀNG ĐỢI CHỜ XUẤT KHO */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-white">
                    1. DANH SÁCH HÀNG ĐỢI CHỜ XUẤT KHO
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30">
                  {data?.waitingOutboundQueue.length ?? 0} phiếu đang xếp hàng
                </span>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/60 sticky top-0">
                      <th className="py-2 px-2.5">Số Phiếu</th>
                      <th className="py-2 px-2.5">Đơn Vị (Phân Xưởng)</th>
                      <th className="py-2 px-2.5">Thời Gian Tiếp Nhận (Duyệt)</th>
                      <th className="py-2 px-2.5 text-right">Thời Gian Chờ</th>
                      <th className="py-2 px-2.5 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(data?.waitingOutboundQueue || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">
                          Hiện không có phiếu nào đang chờ soạn
                        </td>
                      </tr>
                    ) : (
                      (data?.waitingOutboundQueue || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-2.5 font-bold text-amber-400">
                            #{item.requestId}
                          </td>
                          <td className="py-2 px-2.5 text-white font-sans font-medium line-clamp-1 max-w-[200px]" title={item.departmentName}>
                            {item.departmentName}
                          </td>
                          <td className="py-2 px-2.5 text-slate-300 text-[11px]">
                            {item.receivedTime}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              item.waitMinutes > 1440
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : item.waitMinutes > 120
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {item.waitDuration}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.statusText === 'Đang soạn'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
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
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex justify-between">
              <span>* Thời gian tiếp nhận: tính từ lúc phiếu được duyệt xuất</span>
              <span>Tự động cập nhật mỗi 15s</span>
            </div>
          </div>

          {/* TABLE 2: 2. DANH SÁCH PHIẾU ĐÃ SOẠN CHỜ LẤY */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs md:text-sm font-extrabold uppercase tracking-wider text-white">
                    2. DANH SÁCH PHIẾU ĐÃ SOẠN CHỜ LẤY
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-teal-400 px-2 py-0.5 rounded bg-teal-500/20 border border-teal-500/30">
                  {data?.pickedWaitingPickupQueue.length ?? 0} phiếu chờ nhận
                </span>
              </div>

              {/* Table Body */}
              <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-slate-950/60 sticky top-0">
                      <th className="py-2 px-2.5">Số Phiếu</th>
                      <th className="py-2 px-2.5">Đơn Vị (Phân Xưởng)</th>
                      <th className="py-2 px-2.5">Thời Gian Soạn Xong</th>
                      <th className="py-2 px-2.5 text-right">Thời Gian Chờ</th>
                      <th className="py-2 px-2.5 text-right">Nhân Viên Soạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(data?.pickedWaitingPickupQueue || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500">
                          Hiện không có phiếu nào đã soạn đang chờ xưởng nhận
                        </td>
                      </tr>
                    ) : (
                      (data?.pickedWaitingPickupQueue || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-2.5 font-bold text-teal-400">
                            #{item.requestId}
                          </td>
                          <td className="py-2 px-2.5 text-white font-sans font-medium line-clamp-1 max-w-[200px]" title={item.departmentName}>
                            {item.departmentName}
                          </td>
                          <td className="py-2 px-2.5 text-slate-300 text-[11px]">
                            {item.completedTime}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              item.isOverdue2H
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                                : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            }`}>
                              {item.waitDuration}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right text-emerald-300 font-sans font-medium text-[11px] truncate max-w-[150px]" title={item.pickerName}>
                            {item.pickerName}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono flex justify-between">
              <span>* Cảnh báo Đỏ nhấp nháy khi hàng đã soạn quá 2h chưa nhận</span>
              <span>Tự động cập nhật mỗi 15s</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
