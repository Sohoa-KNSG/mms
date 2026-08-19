import React, { useState, useMemo } from 'react';
import {
  ArrowUpFromLine,
  Truck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText,
  Boxes,
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Sparkles,
  Layers,
  ChevronRight,
  User,
  Building2,
  Calendar,
  Layers3,
  ShieldCheck,
  TrendingUp,
  X,
  Info
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { IssueRequest, IssueRequestType, IssueRequestStatus } from '../types';

// Danh mục Tổ / Đơn vị Kế hoạch sản xuất Kềm Nghĩa
interface PlanningUnitConfig {
  code: string;
  name: string;
  bravoDeptCode: string;
  bravoDeptName: string;
  defaultManager: string;
}

const PLANNING_UNITS: PlanningUnitConfig[] = [
  {
    code: 'KH_TO_DAP',
    name: 'Kế Hoạch Tổ Rèn & Dập Phôi',
    bravoDeptCode: 'PX01_DAP',
    bravoDeptName: '[PX01] Phân xưởng Rèn Dập Phôi',
    defaultManager: 'Nguyễn Văn Dập (Quản đốc Xưởng 1)'
  },
  {
    code: 'KH_TO_CAT',
    name: 'Kế Hoạch Tổ Cơ Khí & Cắt Dây CNC',
    bravoDeptCode: 'PX02_CAT',
    bravoDeptName: '[PX02] Phân xưởng Gia Công Cơ Khí & Cắt Dây',
    defaultManager: 'Lê Văn Cắt (Quản đốc Xưởng 2)'
  },
  {
    code: 'KH_TO_MAI',
    name: 'Kế Hoạch Tổ Mài & Tinh Chỉnh Kềm',
    bravoDeptCode: 'PX04_MAI',
    bravoDeptName: '[PX04] Phân xưởng Mài & Lắp Ráp Kềm',
    defaultManager: 'Phạm Thị Mài (Trưởng Ca Mài)'
  },
  {
    code: 'KH_TO_XIMA',
    name: 'Kế Hoạch Tổ Xi Mạ & Xử Lý Bề Mặt',
    bravoDeptCode: 'PX05_XIMA',
    bravoDeptName: '[PX05] Phân xưởng Xi Mạ & Đánh Bóng',
    defaultManager: 'Hoàng Văn Mạ (Kỹ sư Trưởng Xi Mạ)'
  },
  {
    code: 'KH_TO_DONGGOI',
    name: 'Kế Hoạch Tổ Bao Bì & Đóng Gói Xuất Khẩu',
    bravoDeptCode: 'PX06_DONGGOI',
    bravoDeptName: '[PX06] Phân xưởng Đóng Gói & Xuất Khẩu',
    defaultManager: 'Võ Thị Gói (Trưởng Bộ Phận Bao Bì)'
  },
  {
    code: 'KH_BAOTRI',
    name: 'Kế Hoạch Tổ Bảo Trì Cơ Điện & Thiết Bị',
    bravoDeptCode: 'PB_BAOTRI',
    bravoDeptName: '[PB07] Phòng Bảo Trì & Hạ Tầng Máy',
    defaultManager: 'Đặng Văn Điện (Trưởng Phòng Bảo Trì)'
  }
];

export const OutboundModule: React.FC = () => {
  const {
    issueRequests,
    materials,
    batches,
    createIssueRequest,
    approveIssueRequest,
    issueGoods,
    currentUser
  } = useWarehouse();

  const [activeTab, setActiveTab] = useState<'requests' | 'create' | 'picking' | 'print'>('requests');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected request for approval, picking, or printing
  const [selectedRequest, setSelectedRequest] = useState<IssueRequest | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Create Request State
  const [reqType, setReqType] = useState<IssueRequestType>('PLANNING');
  const [selectedPlanningUnit, setSelectedPlanningUnit] = useState<string>(PLANNING_UNITS[0].code);
  const [destinationBravoCode, setDestinationBravoCode] = useState<string>(PLANNING_UNITS[0].bravoDeptCode);
  const [purpose, setPurpose] = useState('');
  const [productionOrder, setProductionOrder] = useState('');
  const [overQuotaReason, setOverQuotaReason] = useState('');
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16).replace('T', ' ')
  );

  // Request item rows with quota tracking
  const [requestItems, setRequestItems] = useState<{
    materialId: string;
    quantity: number;
    notes: string;
    bomLimit: number;
    bomUsed: number;
  }[]>([
    {
      materialId: materials[0]?.id || '',
      quantity: 50,
      notes: '',
      bomLimit: 500,
      bomUsed: 120
    }
  ]);

  // Picking allocation state
  const [pickingDetails, setPickingDetails] = useState<{
    itemId: string;
    batchId: string;
    quantity: number;
  }[]>([]);

  // Active planning unit config object
  const activePlanConfig = useMemo(() => {
    return PLANNING_UNITS.find(p => p.code === selectedPlanningUnit) || PLANNING_UNITS[0];
  }, [selectedPlanningUnit]);

  // Handle unit selection change
  const handlePlanningUnitChange = (unitCode: string) => {
    setSelectedPlanningUnit(unitCode);
    const target = PLANNING_UNITS.find(p => p.code === unitCode);
    if (target) {
      setDestinationBravoCode(target.bravoDeptCode);
    }
  };

  const handleAddItemRow = () => {
    const defaultMat = materials[0];
    setRequestItems([
      ...requestItems,
      {
        materialId: defaultMat?.id || '',
        quantity: 10,
        notes: '',
        bomLimit: 300,
        bomUsed: 50
      }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (requestItems.length <= 1) return;
    setRequestItems(requestItems.filter((_, i) => i !== idx));
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      alert('Vui lòng nhập mục đích xuất kho!');
      return;
    }

    if (reqType === 'OVER_PLANNING' && !overQuotaReason.trim()) {
      alert('Vui lòng nhập lý do xuất vượt định mức BOM để Ban Giám Đốc xem xét phê duyệt!');
      return;
    }

    const fullPurpose = reqType === 'OVER_PLANNING' 
      ? `[VƯỢT ĐỊNH MỨC] ${purpose.trim()} (Lý do: ${overQuotaReason.trim()})`
      : purpose.trim();

    const newReq = createIssueRequest({
      type: reqType,
      department: activePlanConfig.name,
      purpose: fullPurpose,
      productionOrder: productionOrder.trim() || undefined,
      requiredDate,
      items: requestItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        notes: item.notes
      }))
    });

    alert(`Đã tạo Đề nghị xuất kho ${newReq.code} thành công!\nĐơn vị: ${activePlanConfig.name}\nĐiểm đến Bravo: ${activePlanConfig.bravoDeptName}\nĐang chuyển sang hàng chờ phê duyệt.`);
    setActiveTab('requests');
    setSelectedRequest(newReq);
  };

  const handleApprove = (approved: boolean) => {
    if (!selectedRequest) return;
    approveIssueRequest(selectedRequest.id, approved, approvalComment);
    alert(approved ? 'Đã phê duyệt đề nghị xuất kho!' : 'Đã từ chối đề nghị xuất kho!');
    setSelectedRequest(null);
    setApprovalComment('');
  };

  const handleStartPicking = (req: IssueRequest) => {
    setSelectedRequest(req);
    const initialPicks: { itemId: string; batchId: string; quantity: number }[] = [];

    req.items.forEach(item => {
      const availableBatches = batches
        .filter(b => b.materialId === item.materialId && b.quantity > 0)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

      let needed = item.approvedQuantity || item.requestedQuantity;
      for (const b of availableBatches) {
        if (needed <= 0) break;
        const take = Math.min(b.quantity, needed);
        initialPicks.push({
          itemId: item.id,
          batchId: b.id,
          quantity: take
        });
        needed -= take;
      }
    });

    setPickingDetails(initialPicks);
    setActiveTab('picking');
  };

  const handleExecuteIssue = () => {
    if (!selectedRequest) return;
    issueGoods(selectedRequest.id, pickingDetails);
    alert(`Đã hoàn tất thủ tục xuất kho cho phiếu ${selectedRequest.code}! Số lượng tồn kho đã được trừ dứt điểm.`);
    setActiveTab('requests');
    setSelectedRequest(null);
  };

  const filteredRequests = issueRequests.filter(r => {
    if (filterStatus !== 'ALL' && r.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.code.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q) ||
        r.productionOrder?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: IssueRequestStatus) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Chờ Phê Duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-[#007D3C] border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã Duyệt - Chờ Soạn
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Từ Chối
          </span>
        );
      case 'ISSUED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#007D3C] border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Đã Xuất Kho
          </span>
        );
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-[#007D3C] text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" /> KỀM NGHĨA OUTBOUND LOGISTICS (OUT-01 / OUT-02 / OUT-03)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Đăng Ký & Quản Lý Đề Nghị Xuất Kho Sản Xuất
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm soát định mức BOM theo từng phân xưởng, đối soát hạn mức Bravo ERP, duyệt đa cấp và soạn hàng FIFO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#007D3C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hàng Chờ Đề Nghị ({issueRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#007D3C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> + Đăng Ký Yêu Cầu Mới
          </button>
        </div>
      </div>

      {/* Tab 1: Create Issue Request - Revamped Form */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateRequest} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          {/* Header Title & User Identity Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">
                Phiếu Đăng Ký Nhu Cầu Xuất Kho Vật Tư
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cung cấp vật tư, phụ tùng và bao bì cho các đơn vị xưởng sản xuất Kềm Nghĩa.
              </p>
            </div>

            {/* Requester Identity Info Badge */}
            <div className="p-2.5 px-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-lg bg-[#007D3C] text-white flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">
                  {currentUser.fullName} <span className="text-slate-400 font-normal">({currentUser.username})</span>
                </div>
                <div className="text-[11px] text-[#007D3C] font-semibold">
                  Tổ Đăng Ký: {activePlanConfig.name}
                </div>
              </div>
            </div>
          </div>

          {/* 1. Chọn Luồng Nghiệp Vụ (3 Loại Đề Nghị) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Phân Loại Nhu Cầu Xuất Kho:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  type: 'PLANNING' as IssueRequestType,
                  code: 'OUT-01',
                  label: 'Theo Kế Hoạch Định Mức (BOM)',
                  desc: 'Xuất theo lệnh sản xuất tháng, so chiếu hạn mức BOM còn lại.'
                },
                {
                  type: 'OVER_PLANNING' as IssueRequestType,
                  code: 'OUT-03',
                  label: 'Xuất Vượt Định Mức (Over-Plan)',
                  desc: 'Bù hao hụt phôi, gãy khuôn gá, yêu cầu Quản đốc & BGĐ duyệt.'
                },
                {
                  type: 'UNPLANNED' as IssueRequestType,
                  code: 'OUT-02',
                  label: 'Ngoài Kế Hoạch (Đột Xuất)',
                  desc: 'Hóa chất, keo, dầu mỡ bảo dưỡng, mẫu R&D thử nghiệm.'
                }
              ].map(t => (
                <button
                  type="button"
                  key={t.type}
                  onClick={() => setReqType(t.type)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    reqType === t.type
                      ? 'border-[#007D3C] bg-emerald-50/40 ring-2 ring-[#007D3C]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{t.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      reqType === t.type ? 'bg-[#007D3C] text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {t.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Thông Tin Đơn Vị Kế Hoạch & Phân Xưởng Nhận Hàng Bravo */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#007D3C]" /> 2. Đơn Vị Kế Hoạch & Điểm Nhận Hàng Bravo ERP:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Đơn vị kế hoạch */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Đơn Vị Kế Hoạch (Planning Unit) *
                </label>
                <select
                  value={selectedPlanningUnit}
                  onChange={e => handlePlanningUnitChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20 font-medium"
                >
                  {PLANNING_UNITS.map(unit => (
                    <option key={unit.code} value={unit.code}>
                      [{unit.code}] - {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phân xưởng đích đến Bravo */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Phân Xưởng Đích Bravo (Destination) *
                </label>
                <input
                  type="text"
                  readOnly
                  value={activePlanConfig.bravoDeptName}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-700 font-bold"
                />
              </div>

              {/* Quản đốc phụ trách duyệt */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Quản Đốc / Người Duyệt Dự Kiến
                </label>
                <input
                  type="text"
                  readOnly
                  value={activePlanConfig.defaultManager}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-100 text-slate-600 italic"
                />
              </div>

              {/* Lệnh sản xuất LSX */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mã Lệnh Sản Xuất (LSX No.)
                </label>
                <input
                  type="text"
                  value={productionOrder}
                  onChange={e => setProductionOrder(e.target.value)}
                  placeholder="e.g. LSX-KN-202608-019"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20"
                />
              </div>

              {/* Thời gian cần hàng */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Thời Gian Cần Hàng Tại Xưởng *
                </label>
                <input
                  type="text"
                  value={requiredDate}
                  onChange={e => setRequiredDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-mono focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20"
                />
              </div>

              {/* Mục đích sử dụng */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Mục Đích Xuất Kho *
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="e.g. Cấp thép rèn phôi kềm cắt da 5000 cây..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20"
                />
              </div>
            </div>

            {/* Input bổ sung nếu là Xuất Vượt Định Mức */}
            {reqType === 'OVER_PLANNING' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  YÊU CẦU GIẢI TRÌNH XUẤT VƯỢT ĐỊNH MỨC BOM:
                </div>
                <input
                  type="text"
                  required
                  value={overQuotaReason}
                  onChange={e => setOverQuotaReason(e.target.value)}
                  placeholder="Nhập chi tiết nguyên nhân phát sinh (VD: Lỗi công đoạn dập lệch 2%, gãy gá nhiệt luyện...)"
                  className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            )}
          </div>

          {/* 3. Danh Mục Vật Tư & Kiểm Tra Định Mức BOM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-[#007D3C]" /> 3. Danh Mục Vật Tư Yêu Cầu & Đối Soát Định Mức:
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-bold text-[#007D3C] hover:text-[#009647] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Dòng Vật Tư
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 min-w-[260px]">Mã & Tên Vật Tư (SKU)</th>
                    <th className="p-3 text-right">Định Mức BOM</th>
                    <th className="p-3 text-right">Đã Dùng</th>
                    <th className="p-3 text-right">Hạn Mức Còn</th>
                    <th className="p-3 text-right w-36">SL Yêu Cầu</th>
                    <th className="p-3">Ghi Chú Công Đoạn</th>
                    <th className="p-3 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requestItems.map((item, idx) => {
                    const selMat = materials.find(m => m.id === item.materialId);
                    const remaining = item.bomLimit - item.bomUsed;
                    const isOver = item.quantity > remaining && reqType === 'PLANNING';

                    return (
                      <tr key={idx} className={`hover:bg-slate-50/80 ${isOver ? 'bg-rose-50/30' : ''}`}>
                        <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <select
                            value={item.materialId}
                            onChange={e => {
                              const updated = [...requestItems];
                              updated[idx].materialId = e.target.value;
                              setRequestItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                          >
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>
                                [{m.code}] - {m.name} ({m.unit})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-right font-mono text-slate-700">
                          {item.bomLimit} {selMat?.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {item.bomUsed} {selMat?.unit}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#007D3C]">
                          {remaining} {selMat?.unit}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => {
                                const updated = [...requestItems];
                                updated[idx].quantity = Math.max(1, Number(e.target.value));
                                setRequestItems(updated);
                              }}
                              className={`w-full px-2.5 py-1 text-xs border rounded-lg font-mono font-bold text-right ${
                                isOver
                                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                                  : 'border-slate-200 text-[#007D3C]'
                              }`}
                            />
                            <span className="text-[11px] text-slate-500 shrink-0">{selMat?.unit}</span>
                          </div>
                          {isOver && (
                            <span className="text-[10px] text-rose-600 block mt-0.5 text-right font-medium">
                              Vượt hạn mức {item.quantity - remaining}!
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={e => {
                              const updated = [...requestItems];
                              updated[idx].notes = e.target.value;
                              setRequestItems(updated);
                            }}
                            placeholder="Ghi chú khuôn gá / máy..."
                            className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            disabled={requestItems.length === 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer text-base"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#007D3C]" />
              Hệ thống sẽ tự động gán Flow duyệt theo mã tổ <strong>{activePlanConfig.code}</strong>.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] active:scale-95 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Gửi Đề Nghị Xuất Kho
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Requests Queue View */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã đề nghị, xưởng, LSX..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-hidden focus:ring-2 focus:ring-[#007D3C]/20"
                />
              </div>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING_APPROVAL">Chờ phê duyệt</option>
                <option value="APPROVED">Đã duyệt (Chờ soạn)</option>
                <option value="ISSUED">Đã xuất kho</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>

            <span className="text-xs text-slate-500">
              Có <strong>{filteredRequests.length}</strong> phiếu đề nghị xuất kho
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Mã Đề Nghị</th>
                    <th className="p-3.5">Loại</th>
                    <th className="p-3.5">Phân Xưởng / Người Yêu Cầu</th>
                    <th className="p-3.5">Lệnh SX (LSX)</th>
                    <th className="p-3.5">Mục Đích Xuất</th>
                    <th className="p-3.5">Thời Gian Cần</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#007D3C]">{req.code}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                          {req.type === 'PLANNING' ? 'Định Mức' : req.type === 'OVER_PLANNING' ? 'Vượt Mức' : 'Đột Xuất'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900">{req.department}</div>
                        <div className="text-[11px] text-slate-400">{req.requester}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-800">{req.productionOrder || '—'}</td>
                      <td className="p-3.5 text-slate-700 max-w-[220px] truncate">{req.purpose}</td>
                      <td className="p-3.5 font-mono text-slate-500">{req.requiredDate}</td>
                      <td className="p-3.5">{getStatusBadge(req.status)}</td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {req.status === 'PENDING_APPROVAL' && (
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-[#007D3C] hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors"
                          >
                            Phê Duyệt
                          </button>
                        )}
                        {req.status === 'APPROVED' && (
                          <button
                            onClick={() => handleStartPicking(req)}
                            className="px-2.5 py-1 text-xs font-semibold bg-[#007D3C] hover:bg-[#009647] text-white rounded-lg cursor-pointer transition-colors"
                          >
                            Soạn Hàng FIFO
                          </button>
                        )}
                        {req.status === 'ISSUED' && (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActiveTab('print');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 inline-flex cursor-pointer transition-colors"
                          >
                            <Printer className="w-3 h-3" /> Phiếu Xuất
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Picking Wizard with FIFO Recommendations */}
      {activeTab === 'picking' && selectedRequest && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#007D3C]" />
                <h3 className="font-bold text-slate-900 text-base">
                  Trợ Lý Soạn Hàng Thông Minh (Smart Picking FIFO / FEFO)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Phiếu: <strong>{selectedRequest.code}</strong> • Đơn vị: {selectedRequest.department}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('requests')}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Quay Lại
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Lô Hàng Được Hệ Thống Gợi Ý Lấy Theo Thứ Tự Nhập Trước (FIFO):
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Mã SKU</th>
                    <th className="p-3">Tên Vật Tư</th>
                    <th className="p-3">Mã Lô Được Chọn</th>
                    <th className="p-3">📍 Vị Trí Kệ Kho</th>
                    <th className="p-3">Hạn Dùng (EXP)</th>
                    <th className="p-3">Ưu Tiên</th>
                    <th className="p-3 text-right">SL Cần Lấy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pickingDetails.map((pick, idx) => {
                    const batch = batches.find(b => b.id === pick.batchId);
                    return (
                      <tr key={idx} className={`hover:bg-slate-50/50 ${idx === 0 ? 'bg-emerald-50/30' : ''}`}>
                        <td className="p-3 font-mono font-bold text-slate-900">{batch?.materialCode}</td>
                        <td className="p-3 font-medium text-slate-800">{batch?.materialName}</td>
                        <td className="p-3 font-mono font-bold text-[#007D3C]">{batch?.batchNumber}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#007D3C] border border-emerald-200 text-[11px] font-bold font-mono">
                            📍 {batch?.locationCode}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-rose-600">{batch?.expiryDate}</td>
                        <td className="p-3">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007D3C] text-white">
                              ⭐ Ưu tiên #1
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#007D3C] text-sm">
                          {pick.quantity} {batch?.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <span className="text-emerald-900">
              Khi bấm <strong>"Xác Nhận Xuất Kho"</strong>, hệ thống sẽ trừ số dư các lô trên và cập nhật CSDL MMS1 tức thời.
            </span>
            <button
              onClick={handleExecuteIssue}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] active:scale-95 rounded-xl shadow-xs cursor-pointer transition-all"
            >
              Xác Nhận Xuất Kho & Cập Nhật Tồn
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Printable 20-Line Delivery Note (Phiếu Xuất Kho Chuẩn Kềm Nghĩa) */}
      {activeTab === 'print' && selectedRequest && (
        <div className="space-y-4">
          <div className="flex justify-end gap-3 no-print">
            <button
              onClick={() => setActiveTab('requests')}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
            >
              Quay Lại
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" /> In Phiếu Xuất Kho Chuẩn (Print)
            </button>
          </div>

          {/* Standard printable invoice sheet */}
          <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm max-w-4xl mx-auto text-slate-900 print:border-none print:shadow-none print:p-0">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
              <div>
                <h4 className="font-extrabold text-sm uppercase text-[#007D3C]">CÔNG TY CỔ PHẦN KỀM NGHĨA</h4>
                <p className="text-[11px] text-slate-600">Lô B1-7, Đường N2, KCN Tây Bắc Củ Chi, TP. Hồ Chí Minh</p>
                <p className="text-[11px] text-slate-600">Hệ Thống Quản Lý Kho MMS • Hotline: (028) 3974 0651</p>
              </div>
              <div className="text-right text-[11px]">
                <div className="font-bold">Mẫu số: 02 - VT</div>
                <div className="text-slate-500">(Ban hành theo TT 200/2014/TT-BTC)</div>
                <div className="font-mono font-bold text-slate-900 mt-1">Số: {selectedRequest.deliveryNoteNumber || 'PXK-20260819-001'}</div>
              </div>
            </div>

            <div className="text-center my-6">
              <h2 className="text-xl font-extrabold uppercase tracking-wide">PHIẾU XUẤT KHO VẬT TƯ SẢN XUẤT</h2>
              <p className="text-xs text-slate-500 italic mt-1">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </p>
            </div>

            {/* Beneficiary Info */}
            <div className="grid grid-cols-2 gap-y-2 text-xs mb-6">
              <div>- Họ tên người nhận hàng: <span className="font-bold">{selectedRequest.requester}</span></div>
              <div>- Đơn vị / Phân xưởng: <span className="font-bold">{selectedRequest.department}</span></div>
              <div>- Lý do xuất kho: <span className="font-medium">{selectedRequest.purpose}</span></div>
              <div>- Xuất tại kho: <span className="font-bold">Kho Tổng Vật Tư MMS1 (20020100)</span></div>
              <div>- Theo đề nghị số: <span className="font-mono font-semibold">{selectedRequest.code}</span></div>
              <div>- Lệnh sản xuất (LSX): <span className="font-mono font-semibold">{selectedRequest.productionOrder || 'N/A'}</span></div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-slate-400 text-xs mb-8">
              <thead>
                <tr className="bg-slate-100 text-center font-bold">
                  <th className="border border-slate-400 p-2 w-10">STT</th>
                  <th className="border border-slate-400 p-2">Tên, nhãn hiệu, quy cách vật tư</th>
                  <th className="border border-slate-400 p-2 w-24">Mã số (SKU)</th>
                  <th className="border border-slate-400 p-2 w-16">ĐVT</th>
                  <th className="border border-slate-400 p-2 w-20">Yêu cầu</th>
                  <th className="border border-slate-400 p-2 w-20">Thực xuất</th>
                  <th className="border border-slate-400 p-2 w-28">Đơn giá (đ)</th>
                  <th className="border border-slate-400 p-2 w-32">Thành tiền (đ)</th>
                </tr>
              </thead>
              <tbody>
                {selectedRequest.items.map((item, idx) => {
                  const mat = materials.find(m => m.id === item.materialId);
                  const price = mat?.standardPrice || 100000;
                  const total = item.issuedQuantity * price;
                  return (
                    <tr key={idx}>
                      <td className="border border-slate-400 p-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-2 font-medium">{item.materialName}</td>
                      <td className="border border-slate-400 p-2 text-center font-mono font-semibold">{item.materialCode}</td>
                      <td className="border border-slate-400 p-2 text-center">{item.unit}</td>
                      <td className="border border-slate-400 p-2 text-right font-mono">{item.requestedQuantity}</td>
                      <td className="border border-slate-400 p-2 text-right font-mono font-bold text-[#007D3C]">{item.issuedQuantity}</td>
                      <td className="border border-slate-400 p-2 text-right font-mono">{price.toLocaleString('vi-VN')}</td>
                      <td className="border border-slate-400 p-2 text-right font-mono font-bold">{total.toLocaleString('vi-VN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Signature blocks */}
            <div className="grid grid-cols-4 gap-4 text-center text-xs mt-12 pt-6">
              <div>
                <div className="font-bold uppercase">Người Lập Phiếu</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">{currentUser.fullName}</div>
              </div>
              <div>
                <div className="font-bold uppercase">Người Nhận Hàng</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">{selectedRequest.requester}</div>
              </div>
              <div>
                <div className="font-bold uppercase">Thủ Kho</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">Thủ Kho MMS1</div>
              </div>
              <div>
                <div className="font-bold uppercase">Giám Đốc Duyệt</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">Ban Giám Đốc Sản Xuất</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {selectedRequest && activeTab === 'requests' && selectedRequest.status === 'PENDING_APPROVAL' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Phê Duyệt Đề Nghị Xuất Kho: {selectedRequest.code}
              </h3>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div>- Bộ phận: <strong className="text-slate-900">{selectedRequest.department}</strong></div>
              <div>- Mục đích: <span className="text-slate-800">{selectedRequest.purpose}</span></div>
              <div>- Lệnh SX: <span className="font-mono font-semibold">{selectedRequest.productionOrder || 'N/A'}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ý Kiến Phê Duyệt / Ghi Chú:</label>
              <textarea
                rows={2}
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                placeholder="Đồng ý xuất theo định mức sản xuất..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#007D3C]/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => handleApprove(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
              >
                Từ Chối
              </button>
              <button
                onClick={() => handleApprove(true)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#007D3C] hover:bg-[#009647] rounded-lg cursor-pointer shadow-xs"
              >
                Đồng Ý Phê Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

