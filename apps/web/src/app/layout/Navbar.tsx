import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Bell,
  Search,
  User,
  UserCheck,
  RotateCcw,
  Menu,
  Shield,
  Layers,
  ChevronDown,
  Smartphone,
  Barcode,
  LogIn,
  LogOut,
  KeyRound,
  Printer,
  Database,
  Building2,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useWarehouse } from '../providers/warehouseStore';
import { UserRole } from '../../shared/types';
import { LoginModal } from '../../features/access';
import { formatDate, formatTime } from '../../shared/utils/dateUtils';

interface NavbarProps {
  onToggleSidebar: () => void;
  onSearch: (query: string) => void;
  onLaunchHandheld?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onSearch, onLaunchHandheld }) => {
  const { 
    currentUser, 
    setCurrentUser, 
    users, 
    resetData, 
    qcTickets, 
    receivingOrders,
    issueRequests, 
    batches,
    showLoginModal,
    setShowLoginModal,
    logoutUser
  } = useWarehouse();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<'K01' | 'K02' | 'K03'>('K01');
  const [searchVal, setSearchVal] = useState('');
  const [currentUtc7Time, setCurrentUtc7Time] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentUtc7Time(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Counters
  const pendingQC = qcTickets.filter(q => q.evaluation === 'PENDING').length;
  const waitingPutaway = receivingOrders.filter(r => r.status === 'QC_PASSED').length;
  const pendingIssue = issueRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
  const lowStockCount = batches.filter(b => b.quantity < 50).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearch(e.target.value);
  };

  // Keyboard shortcut listener for fast search [F2 or /]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        const searchInput = document.getElementById('smart-global-search') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getRoleBadge = (role: UserRole | string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return { label: 'Quản Trị Hệ Thống', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (r.includes('kiemke') || r.includes('kiem_ke') || r.includes('audit')) return { label: 'Quản Lý Kiểm Kê', bg: 'bg-teal-100 text-teal-800 border-teal-200' };
    if (r.includes('truongphong') || r.includes('ql_kho') || r.includes('quanly')) return { label: 'Trưởng Phòng Kho', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (r.includes('thukho') || r.includes('kho')) return { label: 'Thủ Kho Trưởng', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (r.includes('nhanvien') || r.includes('nv_kho') || r.includes('sanxuat')) return { label: 'Vận Hành Kho (PDA)', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    if (r.includes('qc') || r.includes('qa')) return { label: 'Kỹ Thuật QC/QA', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    return { label: 'Nhân Viên', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  const currentBadge = getRoleBadge(currentUser.role);

  const warehouseOptions = [
    { code: 'K01', name: 'Kho Vật Tư Chính (MMS1)', desc: '20020100 - Vật tư cơ khí, điện tử & linh kiện' },
    { code: 'K02', name: 'Kho Phụ Liệu & Tiêu Hao', desc: '20020200 - Bao bì, hóa chất & vật tư phụ' },
    { code: 'K03', name: 'Kho Thành Phẩm & Bán Thành Phẩm', desc: '20020300 - Hàng hoàn thiện chờ xuất' }
  ];

  const currentWarehouseObj = warehouseOptions.find(w => w.code === selectedWarehouse) || warehouseOptions[0];

  return (
    <>
      <header className="h-16 bg-[#032316] border-b border-[#0b4d32] text-white sticky top-0 z-40 px-3 sm:px-5 flex items-center justify-between shadow-md">
        {/* Left Section: Brand & Warehouse Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-[#063b25] transition-colors focus:outline-hidden"
            title="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl p-1 shadow-sm flex items-center justify-center shrink-0 border border-emerald-800">
              <img 
                src="https://knsgblob.blob.core.windows.net/anhapp/Logo_knsg.png" 
                alt="Kềm Nghĩa Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight leading-none font-mono">
                  MMS<span className="text-[#F7941D]">.KNSG</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#007D3C] text-white border border-[#10b981]/50 px-1.5 py-0.5 rounded shadow-2xs">
                  KỀM NGHĨA WMS
                </span>
              </div>
              <p className="text-[10px] text-emerald-300/80 font-medium leading-tight mt-0.5">
                Warehouse Management System
              </p>
            </div>
          </div>

          <div className="hidden xl:block h-6 w-px bg-emerald-800/80 mx-1" />

          {/* Smartlog Warehouse Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#063b25] hover:bg-[#08482e] border border-emerald-700/60 text-xs font-semibold text-emerald-100 transition-all cursor-pointer shadow-2xs"
            >
              <Building2 className="w-3.5 h-3.5 text-[#F7941D] shrink-0" />
              <span className="font-mono text-emerald-300 font-bold">[{currentWarehouseObj.code}]</span>
              <span className="truncate max-w-[160px] text-emerald-100">{currentWarehouseObj.name}</span>
              <ChevronDown className="w-3 h-3 text-emerald-400 shrink-0" />
            </button>

            {showWarehouseDropdown && (
              <div className="absolute left-0 mt-2 w-80 bg-[#032316] border border-emerald-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-emerald-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Chọn Phân Xưởng / Kho Vận Hành Kềm Nghĩa
                  </span>
                </div>
                <div className="p-1 space-y-1">
                  {warehouseOptions.map(w => (
                    <button
                      key={w.code}
                      type="button"
                      onClick={() => {
                        setSelectedWarehouse(w.code as any);
                        setShowWarehouseDropdown(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl flex items-start gap-2.5 transition-all cursor-pointer ${
                        w.code === selectedWarehouse
                          ? 'bg-[#007D3C]/30 text-emerald-200 border border-[#007D3C]'
                          : 'hover:bg-[#063b25] text-emerald-300'
                      }`}
                    >
                      <Building2 className={`w-4 h-4 mt-0.5 shrink-0 ${w.code === selectedWarehouse ? 'text-[#F7941D]' : 'text-emerald-500'}`} />
                      <div>
                        <div className="text-xs font-bold font-mono text-white flex items-center gap-1.5">
                          <span>[{w.code}]</span> {w.name}
                        </div>
                        <div className="text-[11px] text-emerald-400 mt-0.5">{w.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Smart Global Search Bar & Hardware Status */}
        <div className="flex-1 max-w-xl mx-3 sm:mx-6 flex items-center gap-3">
          {/* Fast Search Input */}
          <div className="relative w-full">
            <Barcode className="w-4 h-4 text-[#F7941D] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="smart-global-search"
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              placeholder="Quét Barcode / Tìm SKU, Tên, Batch, PO, Kệ..."
              className="w-full pl-9 pr-14 py-1.5 text-xs bg-[#063b25]/90 hover:bg-[#063b25] focus:bg-[#021c11] border border-emerald-700/60 focus:border-[#007D3C] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#007D3C] transition-all text-white placeholder:text-emerald-300/60 font-medium"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchVal ? (
                <button
                  onClick={() => { setSearchVal(''); onSearch(''); }}
                  className="text-xs text-emerald-400 hover:text-white px-1"
                >
                  ×
                </button>
              ) : (
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#021c11] text-emerald-300 rounded border border-emerald-800">
                  F2
                </kbd>
              )}
            </div>
          </div>

          {/* Realtime Device & Network Status Pills */}
          <div className="hidden 2xl:flex items-center gap-2 shrink-0">
            {/* Database MMS1 */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#063b25] border border-emerald-700 text-[11px] font-mono text-emerald-400 shadow-2xs" title="Kết nối CSDL MMS1 SQL Server">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <Database className="w-3 h-3 text-emerald-300" />
              <span>MMS1</span>
            </div>

            {/* LAN Printer 10.17.16.102:8080 */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#063b25] border border-emerald-700 text-[11px] font-mono text-emerald-200 shadow-2xs" title="Máy in tem nhãn mã vạch HTTP POST: 10.17.16.102:8080">
              <Printer className="w-3 h-3 text-[#F7941D]" />
              <span>10.17.16.102:8080</span>
            </div>
          </div>
        </div>

        {/* Right Section: Quick Actions, Notification Badges & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Realtime UTC+7 Clock (Vietnam Time) */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#063b25] border border-emerald-700/80 text-[11px] font-mono text-emerald-100 shadow-2xs" title="Thời gian chuẩn hệ thống: Múi giờ Việt Nam (UTC+7 / GMT+7)">
            <Clock className="w-3.5 h-3.5 text-[#F7941D] animate-pulse" />
            <span className="font-bold text-white tracking-wider">{formatTime(currentUtc7Time, true)}</span>
            <span className="text-[10px] text-emerald-400">|</span>
            <span className="text-[10px] text-emerald-200">{formatDate(currentUtc7Time)}</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#007D3C] text-white rounded border border-emerald-500/40">UTC+7</span>
          </div>

          {/* Dedicated Handheld PDA Mode */}
          {onLaunchHandheld && (
            <button
              onClick={onLaunchHandheld}
              className="px-3.5 py-1.5 bg-[#007D3C] hover:bg-[#009647] active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-600/40"
              title="Chuyển sang chế độ Máy quét cầm tay PDA Laser"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Máy Quét PDA</span>
              <span className="sm:hidden font-mono">PDA</span>
            </button>
          )}

          {/* Operational Metrics Pills (Smartlog Style Quick Badges) */}
          <div className="hidden lg:flex items-center gap-1.5">
            {pendingQC > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] font-bold" title={`${pendingQC} phiếu đang chờ kiểm tra QC`}>
                <Clock className="w-3 h-3 text-amber-400" />
                <span>QC: {pendingQC}</span>
              </div>
            )}
            {waitingPutaway > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-[11px] font-bold" title={`${waitingPutaway} phiếu chờ xếp lên kệ`}>
                <Boxes className="w-3 h-3 text-blue-400" />
                <span>Lưu kệ: {waitingPutaway}</span>
              </div>
            )}
          </div>

          {/* Quick Login / Change Account */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-2.5 py-1.5 bg-[#063b25] hover:bg-[#08482e] text-emerald-200 hover:text-white font-semibold text-xs rounded-xl border border-emerald-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Đăng nhập tài khoản khác (UC-01)"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#F7941D]" />
            <span className="hidden xl:inline">Tài khoản</span>
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-[#063b25]/90 hover:bg-[#063b25] border border-emerald-700/60 hover:border-[#007D3C] transition-all text-left cursor-pointer shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-[#007D3C] text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-emerald-500/50 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] font-mono text-emerald-300 font-semibold truncate max-w-[170px]">
                  {currentUser.jobTitle ? `${currentUser.jobTitle} • ${currentUser.id}` : `${currentUser.id} • ${currentBadge.label}`}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-emerald-400" />
            </button>

            {/* Dropdown Menu */}
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-[#032316] border border-emerald-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2.5 border-b border-emerald-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Tài Khoản Đang Đăng Nhập
                    </span>
                    <span className="text-xs font-bold text-white">
                      {currentUser.fullName} ({currentUser.id})
                    </span>
                    {currentUser.jobTitle && (
                      <div className="text-[11px] text-amber-300 font-medium mt-0.5 flex items-center gap-1">
                        <span className="text-emerald-400">Chức danh:</span>
                        <span className="text-amber-200 font-bold">{currentUser.jobTitle}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-emerald-300 font-medium mt-0.5">
                      Phòng ban: {currentUser.department || 'Kho Vật Tư K01'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logoutUser();
                      setShowRoleDropdown(false);
                    }}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-rose-900/50"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Thoát</span>
                  </button>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full py-2.5 px-3 bg-[#007D3C] hover:bg-[#009647] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đổi Tài Khoản Đăng Nhập</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* UC-01: Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
      />
    </>
  );
};
