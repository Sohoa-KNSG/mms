import React, { useState } from 'react';
import {
  ArrowUpFromLine,
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
  ChevronRight
} from 'lucide-react';
import { useWarehouse } from '../services/warehouseStore';
import { IssueRequest, IssueRequestType, IssueRequestStatus } from '../types';

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
  const [department, setDepartment] = useState('Xưởng Sản xuất 1');
  const [purpose, setPurpose] = useState('');
  const [productionOrder, setProductionOrder] = useState('');
  const [requiredDate, setRequiredDate] = useState(new Date().toISOString().slice(0, 16).replace('T', ' '));
  const [requestItems, setRequestItems] = useState<{ materialId: string; quantity: number; notes: string }[]>([
    { materialId: materials[0]?.id || '', quantity: 50, notes: '' }
  ]);

  // Picking allocation state
  const [pickingDetails, setPickingDetails] = useState<{
    itemId: string;
    batchId: string;
    quantity: number;
  }[]>([]);

  const handleAddItemRow = () => {
    setRequestItems([
      ...requestItems,
      { materialId: materials[0]?.id || '', quantity: 10, notes: '' }
    ]);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      alert('Vui lòng nhập mục đích xuất kho!');
      return;
    }

    const newReq = createIssueRequest({
      type: reqType,
      department,
      purpose,
      productionOrder: productionOrder.trim() || undefined,
      requiredDate,
      items: requestItems
    });

    alert(`Đã tạo Đề nghị xuất kho ${newReq.code} thành công! Đang chuyển sang chờ phê duyệt.`);
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
    // Suggest FIFO batches for each requested item
    const initialPicks: { itemId: string; batchId: string; quantity: number }[] = [];

    req.items.forEach(item => {
      // Find batches of this material sorted by expiry / createdAt (FIFO/FEFO)
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
    alert(`Đã hoàn tất thủ tục xuất kho cho phiếu ${selectedRequest.code}! Số lượng tồn kho đã được trừ.`);
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
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ Phê Duyệt</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã Duyệt - Chờ Soạn Hàng</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"><XCircle className="w-3 h-3" /> Từ Chối</span>;
      case 'ISSUED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã Xuất Kho (Thành Công)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ArrowUpFromLine className="w-4 h-4" /> Outbound Logistics & Picking
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Đề Nghị Xuất Kho, Phê Duyệt & Soạn Hàng (UC19 - UC24)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý đề nghị xuất theo kế hoạch / vượt định mức, quy trình duyệt, soạn hàng FIFO và in Phiếu Xuất Kho chuẩn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'requests' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Danh Sách Đề Nghị ({issueRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Tạo Đề Nghị Xuất
          </button>
        </div>
      </div>

      {/* Tab 1: Create Issue Request */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateRequest} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="font-bold text-slate-900 text-base">Tạo Phiếu Đề Nghị Xuất Kho Vật Tư</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ xuất sản xuất theo lệnh LSX, xuất vượt định mức hoặc xuất bảo trì sửa chữa đột xuất.
            </p>
          </div>

          {/* Issue Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: 'PLANNING' as IssueRequestType, label: 'Theo Định Mức Kế Hoạch (Planning)', desc: 'Căn cứ theo BOM đơn hàng sản xuất' },
              { type: 'OVER_PLANNING' as IssueRequestType, label: 'Vượt Định Mức (Over Planning)', desc: 'Cần Quản đốc & Giám đốc duyệt bổ sung' },
              { type: 'UNPLANNED' as IssueRequestType, label: 'Không Theo Kế Hoạch', desc: 'Bảo trì máy, phục vụ R&D, dự án mẫu' }
            ].map(t => (
              <button
                type="button"
                key={t.type}
                onClick={() => setReqType(t.type)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  reqType === t.type
                    ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{t.label}</div>
                <div className="text-[11px] text-slate-500 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>

          {/* Header Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Bộ Phận / Xưởng Yêu Cầu *</label>
              <input
                type="text"
                required
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lệnh Sản Xuất (LSX No.)</label>
              <input
                type="text"
                value={productionOrder}
                onChange={e => setProductionOrder(e.target.value)}
                placeholder="e.g. LSX-2026-08-015"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Thời Gian Cần Hàng *</label>
              <input
                type="text"
                value={requiredDate}
                onChange={e => setRequiredDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Mục Đích Xuất Kho *</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="e.g. Lắp ráp 500 mạch điều khiển IoT SmartHome..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
            />
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Danh Mục Vật Tư Yêu Cầu Xuất:
              </span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Dòng Vật Tư
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Mã & Tên Vật Tư (SKU)</th>
                    <th className="p-3">Số Lượng Yêu Cầu</th>
                    <th className="p-3">Ghi Chú</th>
                    <th className="p-3 w-12 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requestItems.map((item, idx) => {
                    const selMat = materials.find(m => m.id === item.materialId);
                    return (
                      <tr key={idx}>
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 min-w-[240px]">
                          <select
                            value={item.materialId}
                            onChange={e => {
                              const updated = [...requestItems];
                              updated[idx].materialId = e.target.value;
                              setRequestItems(updated);
                            }}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          >
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.code} - {m.name} ({m.unit})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 w-32">
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
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md font-mono font-bold text-blue-700 text-right"
                            />
                            <span className="text-[11px] text-slate-500 shrink-0">{selMat?.unit}</span>
                          </div>
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
                            placeholder="Ghi chú chi tiết..."
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => setRequestItems(requestItems.filter((_, i) => i !== idx))}
                            disabled={requestItems.length === 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-20 cursor-pointer"
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

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm cursor-pointer"
            >
              Gửi Đề Nghị Xuất Kho
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Requests List View */}
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
                  placeholder="Tìm mã đề nghị, bộ phận, LSX..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64"
                />
              </div>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
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
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Mã Đề Nghị</th>
                    <th className="p-3.5">Loại</th>
                    <th className="p-3.5">Bộ Phận / Người Yêu Cầu</th>
                    <th className="p-3.5">Lệnh SX (LSX)</th>
                    <th className="p-3.5">Mục Đích Xuất</th>
                    <th className="p-3.5">Ngày Cần Hàng</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-purple-700">{req.code}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
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
                            className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg cursor-pointer"
                          >
                            Phê Duyệt
                          </button>
                        )}
                        {req.status === 'APPROVED' && (
                          <button
                            onClick={() => handleStartPicking(req)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
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
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 inline-flex cursor-pointer"
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
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Trợ Lý Soạn Hàng Thông Minh (Smart Picking FIFO / FEFO)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Phiếu: <strong>{selectedRequest.code}</strong> • Mục đích: {selectedRequest.purpose}
              </p>
            </div>
            <button
              onClick={() => setActiveTab('requests')}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Quay Lại
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Lô Hàng Được Hệ Thống Gợi Ý Lấy Theo Thứ Tự Hạn Dùng (FEFO):
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
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
                      <tr key={idx} className={`hover:bg-slate-50/50 ${idx === 0 ? 'bg-amber-50/40' : ''}`}>
                        <td className="p-3 font-mono font-bold text-slate-900">{batch?.materialCode}</td>
                        <td className="p-3 font-medium text-slate-800">{batch?.materialName}</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">{batch?.batchNumber}</td>
                        <td className="p-3">
                          <span className="badge-location">
                            📍 {batch?.locationCode}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-rose-600">{batch?.expiryDate}</td>
                        <td className="p-3">
                          {idx === 0 ? (
                            <span className="badge-fifo-priority">
                              ⭐ Ưu tiên #1
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700 text-sm">
                          {pick.quantity} {batch?.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
            <span className="text-blue-800">
              Khi bấm <strong>"Xác Nhận Xuất Kho"</strong>, hệ thống sẽ trừ số dư các lô trên và sinh <strong>Phiếu Xuất Kho chính thức (PXK)</strong>.
            </span>
            <button
              onClick={handleExecuteIssue}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm cursor-pointer"
            >
              Xác Nhận Xuất Kho & Cập Nhật Tồn
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Printable 20-Line Delivery Note (Phiếu Xuất Kho Chuẩn) */}
      {activeTab === 'print' && selectedRequest && (
        <div className="space-y-4">
          <div className="flex justify-end gap-3 no-print">
            <button
              onClick={() => setActiveTab('requests')}
              className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
            >
              Quay Lại
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In Phiếu Xuất Kho Chuẩn (Print)
            </button>
          </div>

          {/* Standard 20-line printable invoice sheet */}
          <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm max-w-4xl mx-auto text-slate-900 print:border-none print:shadow-none print:p-0">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-6">
              <div>
                <h4 className="font-extrabold text-sm uppercase">CÔNG TY CỔ PHẦN CÔNG NGHỆ CAO MMS</h4>
                <p className="text-[11px] text-slate-600">Địa chỉ: Lô E2a-7, Đường D1, Khu Công Nghệ Cao, TP. Thủ Đức</p>
                <p className="text-[11px] text-slate-600">Điện thoại: (028) 3899 9999 • Mã số thuế: 0312345678</p>
              </div>
              <div className="text-right text-[11px]">
                <div className="font-bold">Mẫu số: 02 - VT</div>
                <div className="text-slate-500">(Ban hành theo TT 200/2014/TT-BTC)</div>
                <div className="font-mono font-bold text-slate-900 mt-1">Số: {selectedRequest.deliveryNoteNumber || 'PXK-20260814-001'}</div>
              </div>
            </div>

            <div className="text-center my-6">
              <h2 className="text-xl font-extrabold uppercase tracking-wide">PHIẾU XUẤT KHO VẬT TƯ</h2>
              <p className="text-xs text-slate-500 italic mt-1">
                Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
              </p>
            </div>

            {/* Beneficiary Info */}
            <div className="grid grid-cols-2 gap-y-2 text-xs mb-6">
              <div>- Họ tên người nhận hàng: <span className="font-bold">{selectedRequest.requester}</span></div>
              <div>- Đơn vị / Xưởng: <span className="font-bold">{selectedRequest.department}</span></div>
              <div>- Lý do xuất kho: <span className="font-medium">{selectedRequest.purpose}</span></div>
              <div>- Xuất tại kho: <span className="font-bold">Kho Tổng Nhà Máy</span></div>
              <div>- Theo đề nghị số: <span className="font-mono font-semibold">{selectedRequest.code}</span></div>
              <div>- Lệnh sản xuất (LSX): <span className="font-mono font-semibold">{selectedRequest.productionOrder || 'N/A'}</span></div>
            </div>

            {/* 20-row standard table */}
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
                      <td className="border border-slate-400 p-2 text-right font-mono font-bold text-blue-800">{item.issuedQuantity}</td>
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
                <div className="mt-16 font-semibold text-slate-800">Trần Văn Nam</div>
              </div>
              <div>
                <div className="font-bold uppercase">Giám Đốc Duyệt</div>
                <div className="text-[10px] text-slate-400 italic">(Ký, họ tên)</div>
                <div className="mt-16 font-semibold text-slate-800">Nguyễn Văn Quản Trị</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {selectedRequest && activeTab === 'requests' && selectedRequest.status === 'PENDING_APPROVAL' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Phê Duyệt Đề Nghị Xuất Kho: {selectedRequest.code}</h3>
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
                placeholder="Đồng ý xuất theo định mức..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Đóng
              </button>
              <button
                onClick={() => handleApprove(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                Từ Chối
              </button>
              <button
                onClick={() => handleApprove(true)}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
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
