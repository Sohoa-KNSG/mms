import React, { useState, useEffect } from 'react';
import {
  Link2,
  Unlink,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Sliders
} from 'lucide-react';
import {
  qualityService,
  MaterialAssignmentPage,
  MaterialQcAssignment,
  QcCheckOption,
  AssignMaterialCheckRequest
} from '../api/qualityApi';

export const MaterialQcAssignmentTab: React.FC = () => {
  const [data, setData] = useState<MaterialAssignmentPage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');

  // Modal / Assign Action States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialQcAssignment | null>(null);
  const [targetScope, setTargetScope] = useState<'MATERIAL' | 'MATERIAL_GROUP'>('MATERIAL');
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Load Material Assignments (QC-02)
  const loadAssignments = async (search?: string, targetPage: number = 1) => {
    setIsLoading(true);
    setActionErrorMsg(null);
    try {
      const res = await qualityService.getMaterialAssignments(search, targetPage, 25);
      setData(res);
      setPage(targetPage);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Lỗi tải danh sách gán mã kiểm');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments(searchQuery, 1);
  }, []);

  // Filter items
  const filteredItems = (data?.items || []).filter(item => {
    if (statusFilter === 'ASSIGNED') return !!item.checkId;
    if (statusFilter === 'UNASSIGNED') return !item.checkId;
    return true;
  });

  // Open Assign Modal for a material
  const handleOpenAssign = (material: MaterialQcAssignment) => {
    setSelectedMaterial(material);
    setTargetScope('MATERIAL');
    setSelectedCheckId(material.checkId || null);
    setActionErrorMsg(null);
    setIsAssignModalOpen(true);
  };

  // Submit Assign / Unassign Request
  const handleSubmitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    setIsSubmitting(true);
    setActionErrorMsg(null);

    try {
      const targetCode =
        targetScope === 'MATERIAL'
          ? selectedMaterial.materialId
          : selectedMaterial.materialGroupCode || selectedMaterial.materialId;

      const request: AssignMaterialCheckRequest = {
        scope: targetScope,
        targetCode,
        checkId: selectedCheckId ?? undefined,
        expectedCheckId: targetScope === 'MATERIAL' ? selectedMaterial.checkId ?? undefined : undefined
      };

      const result = await qualityService.assignMaterialCheck(request);
      setActionSuccessMsg(
        selectedCheckId
          ? `Gán mã kiểm #${selectedCheckId} thành công cho ${result.affectedMaterialCount} vật tư (${targetScope === 'MATERIAL' ? 'Cấp vật tư' : 'Cấp nhóm vật tư'})!`
          : `Đã hủy gán mã kiểm tra thành công cho ${result.affectedMaterialCount} vật tư!`
      );
      setIsAssignModalOpen(false);
      await loadAssignments(searchQuery, page);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Lỗi khi gán mã kiểm tra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                loadAssignments(e.target.value, 1);
              }}
              placeholder="Tìm mã VT, tên VT, Bravo ID, nhóm..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-72 focus:outline-emerald-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-emerald-600"
          >
            <option value="ALL">Tất cả vật tư</option>
            <option value="ASSIGNED">Đã gán Mã Kiểm QC</option>
            <option value="UNASSIGNED">Chưa có Mã Kiểm QC</option>
          </select>
        </div>

        <button
          onClick={() => loadAssignments(searchQuery, page)}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới ({data?.totalCount || 0})
        </button>
      </div>

      {/* Material Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
            Đang tải danh sách gán mã kiểm tra vật tư...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Không tìm thấy vật tư nào phù hợp với bộ lọc tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã Vật Tư</th>
                  <th className="py-3 px-4">Mã Bravo</th>
                  <th className="py-3 px-4">Tên Vật Tư</th>
                  <th className="py-3 px-4">ĐVT</th>
                  <th className="py-3 px-4">Nhóm VT</th>
                  <th className="py-3 px-4">Trạng Thái QC</th>
                  <th className="py-3 px-4">Mã Kiểm Áp Dụng</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => {
                  const hasCheck = !!item.checkId;

                  return (
                    <tr key={item.materialId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {item.materialId}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {item.bravoId || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate">
                        {item.materialName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.unit || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          {item.materialGroupCode || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {hasCheck ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <ShieldCheck className="w-3 h-3" />
                            Phải Kiểm QC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Miễn Kiểm QC
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {hasCheck ? (
                          <div>
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              #{item.checkId}
                            </span>
                            <span className="text-slate-500 text-[11px] ml-1.5 font-medium">
                              ({item.qcGroupName || item.qcGroupCode})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa gán</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenAssign(item)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg border border-emerald-200 text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Link2 className="w-3 h-3" />
                          {hasCheck ? 'Thay Đổi Mã Kiểm' : 'Gán Mã Kiểm'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalCount > 25 && (
          <div className="flex items-center justify-between text-xs bg-slate-50 p-4 border-t border-slate-200">
            <span className="text-slate-500">
              Hiển thị trang {page} / {Math.ceil(data.totalCount / 25)} (Tổng cộng {data.totalCount} vật tư)
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => loadAssignments(searchQuery, page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Trước
              </button>
              <button
                disabled={page >= Math.ceil(data.totalCount / 25)}
                onClick={() => loadAssignments(searchQuery, page + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              >
                Sau <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Assign QC Check to Material */}
      {isAssignModalOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-emerald-600" />
                  Gán Mã Kiểm Tra QC Cho Vật Tư (QC-02)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập mã kiểm tra để tự động yêu cầu kiểm tra chất lượng khi nhận hàng
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitAssign} className="p-4 sm:p-6 space-y-4">
              {/* Target Material Info */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mã vật tư:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedMaterial.materialId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tên vật tư:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[250px]">{selectedMaterial.materialName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nhóm vật tư:</span>
                  <span className="font-mono font-semibold text-blue-700">{selectedMaterial.materialGroupCode || '—'}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Mã kiểm hiện tại:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {selectedMaterial.checkId ? `#${selectedMaterial.checkId}` : 'Chưa có'}
                  </span>
                </div>
              </div>

              {/* Assignment Scope */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phạm Vi Gán Mã Kiểm <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetScope('MATERIAL')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      targetScope === 'MATERIAL'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Chỉ Riêng Vật Tư Này (Cấp 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope('MATERIAL_GROUP')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      targetScope === 'MATERIAL_GROUP'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Toàn Bộ Nhóm VT (Cấp 2)
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {targetScope === 'MATERIAL'
                    ? `Áp dụng riêng biệt cho mã [${selectedMaterial.materialId}]`
                    : `Áp dụng đồng loạt cho toàn bộ vật tư thuộc nhóm [${selectedMaterial.materialGroupCode || '—'}]`}
                </p>
              </div>

              {/* Select Check Configuration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Mã Cấu Hình Tiêu Chí QC <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCheckId ?? ''}
                  onChange={e => setSelectedCheckId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600 font-semibold"
                >
                  <option value="">-- Hủy gán (Miễn kiểm tra QC) --</option>
                  {(data?.checks || []).map(check => (
                    <option key={check.checkId} value={check.checkId}>
                      Mã #{check.checkId} - {check.qcGroupName || check.qcGroupCode} ({check.declarationLevel === 3 ? 'Cấp 3: Vật tư' : 'Cấp 2: Nhóm VT'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang Lưu...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Xác Nhận Gán
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
