import React, { useState } from 'react';
import {
  Boxes,
  Bell,
  Search,
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
  KeyRound
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { UserRole } from '../types';
import { LoginModal } from './LoginModal';

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
    issueRequests, 
    batches,
    showLoginModal,
    setShowLoginModal,
    logoutUser
  } = useWarehouse();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const pendingQC = qcTickets.filter(q => q.evaluation === 'PENDING').length;
  const pendingIssue = issueRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
  const lowStockCount = batches.filter(b => b.quantity < 50).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearch(e.target.value);
  };

  const getRoleBadge = (role: UserRole | string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin')) return { label: 'Admin Hệ Thống', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
    if (r.includes('truongphong') || r.includes('ql_kho') || r.includes('quanly')) return { label: 'Trưởng Phòng Kho', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
    if (r.includes('thukho') || r.includes('kho')) return { label: 'Thủ Kho Trưởng', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (r.includes('nhanvien') || r.includes('nv_kho') || r.includes('sanxuat')) return { label: 'Nhân Viên Kho (PDA)', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    if (r.includes('qc') || r.includes('qa')) return { label: 'Kỹ Thuật QC/QA', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    return { label: 'Nhân Viên', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  const currentBadge = getRoleBadge(currentUser.role);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between shadow-2xs">
        {/* Left: Brand & Mobile Menu */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 flex items-center justify-center shrink-0 overflow-hidden rounded">
              <img src="https://knsgblob.blob.core.windows.net/anhapp/Logo_knsg.png" alt="Company Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">MMS WMS</span>
                <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  2026
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  MMS1 Online
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
                Quản lý kho vật tư & Chuỗi cung ứng sản xuất
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex items-center max-w-md w-full mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              placeholder="Tìm mã SKU, tên vật tư, số Batch, PO, Kệ..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all text-slate-800"
            />
            {searchVal && (
              <button
                onClick={() => { setSearchVal(''); onSearch(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dedicated Handheld / PDA Mode Button */}
          {onLaunchHandheld && (
            <button
              onClick={onLaunchHandheld}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="Chuyển sang Chế độ Máy quét cầm tay Handheld PDA"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Máy Quét PDA</span>
              <span className="sm:hidden font-mono">PDA</span>
            </button>
          )}

          {/* Quick Login Button */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Đăng nhập tài khoản CSDL (UC-01)"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>

          {/* Reset Data button */}
          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc chắn muốn khôi phục dữ liệu ban đầu?')) {
                resetData();
              }
            }}
            title="Khôi phục dữ liệu mẫu ban đầu"
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden xl:inline">Khôi phục mẫu</span>
          </button>

          {/* Notifications badge */}
          <div className="relative">
            <button
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
              title="Thông báo hoạt động"
            >
              <Bell className="w-4 h-4" />
              {(pendingQC > 0 || pendingIssue > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
              />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] font-medium text-slate-500">
                  {currentBadge.label}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {showRoleDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tài khoản đang đăng nhập
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {currentUser.fullName} ({currentUser.id})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logoutUser();
                      setShowRoleDropdown(false);
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>

                <div className="px-3 py-1.5 border-b border-slate-100">
                  <button
                    onClick={() => {
                      setShowRoleDropdown(false);
                      setShowLoginModal(true);
                    }}
                    className="w-full py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng nhập tài khoản khác (UC-01)</span>
                  </button>
                </div>

                <div className="px-3 pt-2 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Chuyển nhanh vai trò mẫu (Demo)
                  </span>
                </div>
                <div className="p-1 space-y-1 max-h-48 overflow-y-auto">
                  {users.map(u => {
                    const badge = getRoleBadge(u.role);
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2.5 transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.fullName}
                          className="w-7 h-7 rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{u.fullName}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.department}</div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${badge.bg}`}>
                          {u.role}
                        </span>
                      </button>
                    );
                  })}
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

