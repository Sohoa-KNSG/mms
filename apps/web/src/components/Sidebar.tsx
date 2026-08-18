import React from 'react';
import {
  LayoutDashboard,
  Truck,
  CheckSquare,
  ArrowDownToLine,
  Boxes,
  ArrowUpFromLine,
  FileBarChart,
  Settings,
  X,
  MapPin,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { permissionService } from '../services/permissionService';

export type NavModule =
  | 'dashboard'
  | 'handheld'
  | 'receiving'
  | 'qc'
  | 'putaway'
  | 'inventory'
  | 'outbound'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  isOpen,
  onClose
}) => {
  const { currentUser, qcTickets, receivingOrders, issueRequests, batches } = useWarehouse();

  const pendingQC = qcTickets.filter(q => q.evaluation === 'PENDING').length;
  const waitingPutaway = receivingOrders.filter(r => r.status === 'QC_PASSED').length;
  const pendingApproval = issueRequests.filter(r => r.status === 'PENDING_APPROVAL').length;
  const pendingPutawayBatchesCount = batches.filter(
    b => b.locationCode === 'TEMP-INBOUND' || b.locationCode.startsWith('TEMP')
  ).length;

  const rawNavItems = [
    {
      id: 'dashboard' as NavModule,
      label: 'Tổng Quan & KPIs',
      sublabel: 'Dashboard & Cảnh Báo Kho',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'handheld' as NavModule,
      label: 'Máy Quét PDA (Laser)',
      sublabel: 'Cất Kệ / Soạn FIFO / Tra Cứu',
      icon: Smartphone,
      badge: (pendingPutawayBatchesCount + pendingApproval) > 0 ? `${pendingPutawayBatchesCount + pendingApproval}` : null,
      badgeColor: 'bg-slate-200 text-slate-800 font-mono font-bold'
    },
    {
      id: 'receiving' as NavModule,
      label: '1. Nhận Hàng (Inbound)',
      sublabel: 'Nhận PO, Hàng Mẫu, In Mã Vạch',
      icon: Truck,
      badge: receivingOrders.filter(r => r.status === 'WAITING_QC').length || null,
      badgeColor: 'bg-slate-200 text-slate-700 font-mono'
    },
    {
      id: 'qc' as NavModule,
      label: '2. Kiểm Tra QC',
      sublabel: 'Tiêu Chuẩn, Đạt/Không Đạt',
      icon: CheckSquare,
      badge: pendingQC || null,
      badgeColor: 'bg-slate-200 text-slate-700 font-mono'
    },
    {
      id: 'putaway' as NavModule,
      label: '3. Nhập Kho & Kệ',
      sublabel: 'Gợi Ý Ô Kệ & Cất Hàng',
      icon: ArrowDownToLine,
      badge: waitingPutaway || null,
      badgeColor: 'bg-slate-200 text-slate-700 font-mono'
    },
    {
      id: 'inventory' as NavModule,
      label: '4. Tồn Kho & Sơ Đồ Kệ',
      sublabel: 'Quản Lý Batch, Sơ Đồ, Min/Max',
      icon: Boxes,
      badge: null
    },
    {
      id: 'outbound' as NavModule,
      label: '5. Đề Nghị & Xuất Kho',
      sublabel: 'Phê Duyệt & Soạn FIFO/FEFO',
      icon: ArrowUpFromLine,
      badge: pendingApproval || null,
      badgeColor: 'bg-slate-200 text-slate-700 font-mono'
    },
    {
      id: 'reports' as NavModule,
      label: '6. Báo Cáo & Sổ Giao Dịch',
      sublabel: 'Sổ X-N-T, Transaction Ledger',
      icon: FileBarChart,
      badge: null
    },
    {
      id: 'settings' as NavModule,
      label: '7. Danh Mục & Hệ Thống',
      sublabel: 'Vật Tư, Kệ Kho, Phân Quyền',
      icon: Settings,
      badge: null
    }
  ];

  // UC-02: Dynamic filtering according to user role permissions
  const allowedModules = permissionService.getAllowedModules(currentUser.role);
  const navItems = rawNavItems.filter(item => allowedModules.includes(item.id));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container: Clean light grayish industrial layout */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-30 h-full lg:h-[calc(100vh-4rem)] w-64 flex flex-col shrink-0 transition-all duration-200 ease-in-out bg-slate-50 border-r border-slate-200 text-slate-700 shadow-2xs ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 flex items-center justify-between lg:hidden border-b border-slate-200 bg-slate-100 text-slate-800">
          <span className="font-bold text-sm">Danh Mục Chức Năng</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warehouse Scope Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-100/70">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-slate-600" />
            <span className="tracking-wide">KHO TỔNG NHÀ MÁY (WMS)</span>
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            Khu công nghệ cao • 3 Phân xưởng
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectModule(item.id);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-3 transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold border border-slate-300 shadow-xs ring-1 ring-slate-200'
                    : 'hover:bg-slate-200/60 text-slate-600 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-tight">{item.label}</span>
                    {item.badge !== null && item.badge !== 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1.5 ${
                          isActive ? 'bg-slate-100 text-slate-900 border border-slate-200' : (item.badgeColor || 'bg-slate-200 text-slate-700')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] line-clamp-1 block ${
                      isActive ? 'text-slate-500 font-normal' : 'text-slate-400'
                    }`}
                  >
                    {item.sublabel}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Low-noise calm status footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-100/60">
          <div className="rounded-lg p-2.5 bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-600" />
              <span className="text-[11px] font-semibold text-slate-700">Chế Độ Sáng Tối Giản</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
              Low-Noise
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
