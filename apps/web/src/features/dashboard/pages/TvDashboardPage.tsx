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
  Server
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
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
      {/* 1. TV Top Cockpit Header */}
      <header className="px-6 py-3.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between shrink-0 shadow-lg">
        {/* Left: Brand & Facility */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-400/30">
            <Radio className="w-5 h-5 text-white animate-pulse" />
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
              Trung tâm giám sát điều hành xuất - nhập - tồn kho vật tư thời gian thực (UC-29)
            </p>
          </div>
        </div>

        {/* Center: Shift & Digital Clock */}
        <div className="flex items-center gap-4 bg-slate-950/80 px-5 py-2 rounded-2xl border border-slate-800 shadow-inner">
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
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Bật toàn màn hình TV (F11)'}
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

      {/* 2. Main Wallboard Grid Content */}
      <main className="flex-1 p-5 overflow-y-auto space-y-5">
        {/* Top 4 KPI Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: Inbound Logistics */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4.5 shadow-lg relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Nhập Kho (Inbound)</h3>
                  <span className="text-[11px] text-emerald-400 font-semibold">Tiếp nhận & KCS/QC</span>
                </div>
              </div>
              <span className="text-2xl font-mono font-black text-white">
                {formatNumber(data?.inbound.todayReceipts)} <span className="text-xs font-normal text-slate-400">phiếu</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">Chờ QC</span>
                <span className="text-lg font-black text-amber-400">{data?.inbound.pendingQc ?? 0}</span>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2">
                <span className="text-[10px] text-blue-400 font-bold uppercase block">Chờ Nhập Kệ</span>
                <span className="text-lg font-black text-blue-400">{data?.inbound.pendingPutaway ?? 0}</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Đã Nhập Kho</span>
                <span className="text-lg font-black text-emerald-400">{data?.inbound.completedToday ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Pillar 2: Outbound Logistics */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4.5 shadow-lg relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Xuất Kho Sản Xuất</h3>
                  <span className="text-[11px] text-blue-400 font-semibold">Đề nghị & Soạn FIFO</span>
                </div>
              </div>
              <span className="text-2xl font-mono font-black text-white">
                {formatNumber(data?.outbound.todayRequests)} <span className="text-xs font-normal text-slate-400">phiếu</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">Chờ Duyệt</span>
                <span className="text-lg font-black text-amber-400">{data?.outbound.pendingApproval ?? 0}</span>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase block">Đang Soạn</span>
                <span className="text-lg font-black text-indigo-400">{data?.outbound.pickingInProgress ?? 0}</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Đã Xuất Kho</span>
                <span className="text-lg font-black text-emerald-400">{data?.outbound.issuedToday ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Pillar 3: Storage & Rack Occupancy */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4.5 shadow-lg relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Sức Chứa Kệ Kho</h3>
                  <span className="text-[11px] text-purple-400 font-semibold">{data?.storage.totalLocations ?? 0} vị trí kệ</span>
                </div>
              </div>
              <span className="text-2xl font-mono font-black text-purple-400">
                {data?.storage.occupancyRate ?? 0}%
              </span>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, data?.storage.occupancyRate ?? 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Đang chứa: <b className="text-white">{data?.storage.occupiedLocations ?? 0}</b></span>
                <span>Còn trống: <b className="text-emerald-400">{data?.storage.emptyLocations ?? 0}</b></span>
              </div>
            </div>
          </div>

          {/* Pillar 4: QC & Cycle Count */}
          <div className="bg-slate-900/80 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-4.5 shadow-lg relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Chất Lượng & Kiểm Kê</h3>
                  <span className="text-[11px] text-teal-400 font-semibold">QC AQL & Cycle Count</span>
                </div>
              </div>
              <span className="text-2xl font-mono font-black text-teal-400">
                {data?.cycleCount.accuracyRate ?? 99.4}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
              <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-2">
                <span className="text-[10px] text-teal-400 font-bold uppercase block">Đã Kiểm Đếm</span>
                <span className="text-lg font-black text-white">{data?.cycleCount.countedBatchesToday ?? 0} <small className="text-xs font-normal text-slate-400">thùng</small></span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">QC Đạt Chuẩn</span>
                <span className="text-lg font-black text-emerald-400">{data?.quality.passedCount ?? 0} <small className="text-xs font-normal text-slate-400">lô</small></span>
              </div>
            </div>
          </div>
        </div>

        {/* Mid Section: Hourly Throughput Chart & Rack Group Occupancy */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Chart 2/3: Hourly Inbound vs Outbound Throughput */}
          <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Nhịp Độ Xuất - Nhập Kho Theo Giờ (Hourly Throughput)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" /> Nhập Kho (Inbound)
                </span>
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-3 h-3 rounded-xs bg-blue-500" /> Xuất Kho (Outbound)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.hourlyThroughput || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="hourLabel" stroke="#94a3b8" fontSize={11} fontVariant="mono" />
                  <YAxis stroke="#94a3b8" fontSize={11} fontVariant="mono" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="inboundQty" name="Nhập Kho" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outboundQty" name="Xuất Kho" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right 1/3: Rack Occupancy Breakdown by Row */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Lấp Đầy Dãy Kệ (Rack Rows)
                </h3>
              </div>
              <span className="text-xs font-mono text-purple-400 font-bold">
                {data?.storage.occupiedLocations ?? 0}/{data?.storage.totalLocations ?? 0}
              </span>
            </div>

            <div className="space-y-3 my-auto">
              {(data?.storage.rackGroups || []).map((group, idx) => (
                <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs mb-1 font-mono">
                    <span className="font-bold text-slate-200">{group.groupName}</span>
                    <span className="font-extrabold text-purple-400">{group.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        group.occupancyRate > 90
                          ? 'bg-rose-500'
                          : group.occupancyRate > 75
                          ? 'bg-amber-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, group.occupancyRate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>Đang chứa: {group.occupiedLocations} vị trí</span>
                    <span>Tổng: {group.totalLocations}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between text-xs text-slate-400 font-mono">
              <span>Tổng SKU hoạt động: <b className="text-white">{data?.storage.totalActiveSkus ?? 0}</b></span>
              <span>Tồn kho: <b className="text-emerald-400">{formatNumber(data?.storage.totalStockQuantity)}</b></span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Real-time Live Operations Feed */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Dòng Sự Kiện Giao Dịch Thực Địa (Live Real-time Feed)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Đồng bộ từ CSDL MMS1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(data?.recentActivities || []).slice(0, 8).map((act, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between gap-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      act.type === 'INBOUND'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : act.type === 'OUTBOUND'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : act.type === 'TRANSFER'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {act.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{act.timeAgo}</span>
                </div>

                <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                  {act.description}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-900">
                  <span className="text-emerald-400 font-bold">{act.badge}</span>
                  <span>{act.actor || 'Kho Vật Tư'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
