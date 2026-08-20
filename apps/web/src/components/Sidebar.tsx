import React from 'react';
import {
  LayoutDashboard,
  Truck,
  CheckSquare,
  ArrowDownToLine,
  Boxes,
  ClipboardList,
  ArrowUpFromLine,
  FileBarChart,
  Settings,
  X,
  MapPin,
  Smartphone,
  ShieldCheck,
  Package,
  Layers,
  Activity,
  Printer,
  Database,
  ChevronRight,
  Sparkles
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
  | 'cycle_count'
  | 'outbound'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeModule: NavModule;
  onSelectModule: (module: NavModule) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavGroup {
  groupTitle: string;
  items: {
    id: NavModule;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number | null;
    badgeColor?: string;
    isHighlight?: boolean;
  }[];
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

  const rawNavGroups: NavGroup[] = [
    {
      groupTitle: 'TỔNG QUAN & ĐIỀU HÀNH',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard & KPI Kho',
          sublabel: 'Tổng quan tồn & Lấp đầy kệ',
          icon: LayoutDashboard,
          badge: null
        }
      ]
    },
    {
      groupTitle: 'QUY TRÌNH NHẬP KHO (INBOUND)',
      items: [
        {
          id: 'receiving',
          label: '1. Nhận Hàng (PO/ASN)',
          sublabel: 'Tiếp nhận, In tem tiếp nhận',
          icon: Truck,
          badge: receivingOrders.filter(r => r.status === 'WAITING_QC').length || null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        },
        {
          id: 'qc',
          label: '2. Kiểm Tra QC',
          sublabel: 'Đánh giá tiêu chuẩn AQL',
          icon: CheckSquare,
          badge: pendingQC || null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        },
        {
          id: 'putaway',
          label: '3. Lưu Kho & Vị Trí Kệ',
          sublabel: 'Cất kệ, Tách lô, Đổi vị trí',
          icon: ArrowDownToLine,
          badge: waitingPutaway || null,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
        }
      ]
    },
    {
      groupTitle: 'TỒN KHO & KIỂM KÊ (INVENTORY)',
      items: [
        {
          id: 'inventory',
          label: '4. Quản Lý Tồn & Batch',
          sublabel: 'Tồn SKU, Mã lô, Sơ đồ kệ',
          icon: Boxes,
          badge: null
        },
        {
          id: 'cycle_count',
          label: '5. Kiểm Kê Cycle Count',
          sublabel: 'Đếm từng thùng, In tem (UC-27)',
          icon: ClipboardList,
          badge: 'MMS1',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-mono font-bold',
          isHighlight: true
        }
      ]
    },
    {
      groupTitle: 'QUY TRÌNH XUẤT KHO (OUTBOUND)',
      items: [
        {
          id: 'outbound',
          label: '6. Đề Nghị & Xuất Kho',
          sublabel: 'Soạn hàng FIFO/FEFO, Cấp phát',
          icon: ArrowUpFromLine,
          badge: pendingApproval || null,
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
        }
      ]
    },
    {
      groupTitle: 'THIẾT BỊ CẦM TAY (HANDHELD)',
      items: [
        {
          id: 'handheld',
          label: 'Máy Quét PDA Laser',
          sublabel: 'Màn hình cảm ứng công nghiệp',
          icon: Smartphone,
          badge: (pendingPutawayBatchesCount + pendingApproval) > 0 ? `${pendingPutawayBatchesCount + pendingApproval}` : null,
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-mono font-bold',
          isHighlight: true
        }
      ]
    },
    {
      groupTitle: 'BÁO CÁO & HỆ THỐNG (AUDIT)',
      items: [
        {
          id: 'reports',
          label: '7. Sổ Giao Dịch & Báo Cáo',
          sublabel: 'Nhật ký sự kiện, Sổ X-N-T',
          icon: FileBarChart,
          badge: null
        },
        {
          id: 'settings',
          label: '8. Danh Mục & Phân Quyền',
          sublabel: 'Vật tư, Kệ kho, Tài khoản',
          icon: Settings,
          badge: null
        }
      ]
    }
  ];

  // UC-02: Filter items according to user role permissions
  const allowedModules = permissionService.getAllowedModules(currentUser.role);
  const filteredNavGroups = rawNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => allowedModules.includes(item.id))
    }))
    .filter(group => group.items.length > 0);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Kềm Nghĩa Brand Industrial Dark Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-30 h-full lg:h-[calc(100vh-4rem)] w-72 flex flex-col shrink-0 transition-all duration-200 ease-in-out bg-[#02180e] border-r border-[#083a24] text-emerald-200 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="p-4 flex items-center justify-between lg:hidden border-b border-[#083a24] bg-[#01120a] text-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-lg p-1 flex items-center justify-center">
              <img 
                src="https://knsgblob.blob.core.windows.net/anhapp/Logo_knsg.png" 
                alt="Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">KỀM NGHĨA WMS</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-[#063b25]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {filteredNavGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              {/* Group Title */}
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400/90 font-mono">
                {group.groupTitle}
              </div>

              {/* Group Navigation Items */}
              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectModule(item.id)}
                      className={`w-full group text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 relative cursor-pointer ${
                        isActive
                          ? 'bg-[#007D3C] text-white font-bold shadow-md shadow-emerald-950/60'
                          : item.isHighlight
                          ? 'bg-[#063b25]/80 hover:bg-[#063b25] text-[#F7941D] font-bold border border-[#F7941D]/30'
                          : 'hover:bg-[#063b25]/80 text-emerald-200/90 hover:text-white font-medium'
                      }`}
                    >
                      {/* Left Active Accent Pill (Kềm Nghĩa Orange) */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#F7941D] rounded-r-full shadow-xs" />
                      )}

                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.isHighlight
                            ? 'bg-[#F7941D]/10 text-[#F7941D] group-hover:bg-[#F7941D]/20'
                            : 'bg-[#06301d] text-emerald-400 group-hover:text-[#F7941D] group-hover:bg-[#094228]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Label and Sublabel */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs truncate leading-tight flex items-center justify-between">
                          <span>{item.label}</span>
                        </div>
                        <div
                          className={`text-[10.5px] truncate leading-tight mt-0.5 ${
                            isActive ? 'text-emerald-100' : 'text-emerald-400/60 group-hover:text-emerald-300'
                          }`}
                        >
                          {item.sublabel}
                        </div>
                      </div>

                      {/* Badge counter */}
                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30'
                              : item.badgeColor || 'bg-[#063b25] text-emerald-200 border-emerald-700/60'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: System Infrastructure Status */}
        <div className="p-3 border-t border-[#083a24] bg-[#01120a]/80 shrink-0 space-y-2">
          <div className="p-2.5 rounded-xl bg-[#06301d]/80 border border-emerald-800/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Hạ Tầng Kềm Nghĩa
              </span>
              <span className="text-[10px] font-mono font-bold text-[#F7941D]">KNSG-v2.6</span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-emerald-300 pt-1 border-t border-emerald-900/60">
              <div>
                <span className="text-[10px] text-emerald-400/80 block">DB SERVER:</span>
                <span className="text-white font-semibold">10.17.16.106</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400/80 block">MÁY IN TEM:</span>
                <span className="text-white font-semibold text-[10px]">10.17.16.102:8080</span>
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-500 font-mono">
            KNSG SMARTLOG WMS • 2026
          </div>
        </div>
      </aside>
    </>
  );
};
