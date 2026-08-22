import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Search,
  RefreshCw,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  FileText,
  Image as ImageIcon,
  Check,
  Loader2,
  Trash2
} from 'lucide-react';
import {
  qualityService,
  QcConfigurationModel,
  QcCheckConfiguration,
  QcCriterionInput,
  SaveQcConfigurationRequest
} from '../api/qualityApi';

export const QcCriteriaConfigTab: React.FC = () => {
  const [configData, setConfigData] = useState<QcConfigurationModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCheckId, setSelectedCheckId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | '2' | '3'>('ALL');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Form State
  const [formCheckId, setFormCheckId] = useState<number | null>(null);
  const [formQcGroupCode, setFormQcGroupCode] = useState('');
  const [formQcGroupName, setFormQcGroupName] = useState('');
  const [formDeclarationLevel, setFormDeclarationLevel] = useState<2 | 3>(2);
  const [formMaterialGroupCode, setFormMaterialGroupCode] = useState('');
  const [formMaterialId, setFormMaterialId] = useState('');
  const [formExpectedChangedAt, setFormExpectedChangedAt] = useState<string | undefined>(undefined);
  const [formCriteria, setFormCriteria] = useState<QcCriterionInput[]>([]);

  // Load Configuration Data (QC-01)
  const loadConfiguration = async (checkId?: number) => {
    setIsLoading(true);
    setActionErrorMsg(null);
    try {
      const data = await qualityService.getConfiguration(checkId);
      setConfigData(data);
      if (data.checks && data.checks.length > 0) {
        if (!selectedCheckId || !data.checks.some(c => c.checkId === selectedCheckId)) {
          setSelectedCheckId(data.checks[0].checkId);
        }
      } else {
        setSelectedCheckId(null);
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Lỗi tải cấu hình tiêu chí QC');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  // Filter checks
  const filteredChecks = (configData?.checks || []).filter(c => {
    const matchSearch =
      !searchQuery ||
      c.checkId.toString().includes(searchQuery) ||
      (c.qcGroupCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.qcGroupName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.materialGroupCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.materialId || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchLevel =
      levelFilter === 'ALL' ||
      (levelFilter === '2' && c.declarationLevel === 2) ||
      (levelFilter === '3' && c.declarationLevel === 3);

    return matchSearch && matchLevel;
  });

  const selectedCheck = (configData?.checks || []).find(c => c.checkId === selectedCheckId);
  const selectedCriteria = (configData?.criteria || []).filter(cr => cr.checkId === selectedCheckId);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setFormCheckId(null);
    setFormQcGroupCode('');
    setFormQcGroupName('');
    setFormDeclarationLevel(2);
    setFormMaterialGroupCode('');
    setFormMaterialId('');
    setFormExpectedChangedAt(undefined);
    setFormCriteria([
      {
        criterionCode: 'TC_NGOAI_QUAN',
        criterionName: 'Kiểm tra ngoại quan, khuyết tật bề mặt',
        specification: 'Bề mặt nhẵn phẳng, không trầy xước, không rỉ sét',
        sampleImage: ''
      },
      {
        criterionCode: 'TC_KICH_THUOC',
        criterionName: 'Kiểm tra kích thước hình học',
        specification: 'Đúng theo bản vẽ kỹ thuật dung sai ±0.05mm',
        sampleImage: ''
      }
    ]);
    setActionErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (check: QcCheckConfiguration) => {
    setModalMode('EDIT');
    setFormCheckId(check.checkId);
    setFormQcGroupCode(check.qcGroupCode || '');
    setFormQcGroupName(check.qcGroupName || '');
    setFormDeclarationLevel((check.declarationLevel === 3 ? 3 : 2) as 2 | 3);
    setFormMaterialGroupCode(check.materialGroupCode || '');
    setFormMaterialId(check.materialId || '');
    setFormExpectedChangedAt(check.changedAt);

    const checkCriteria = (configData?.criteria || [])
      .filter(cr => cr.checkId === check.checkId)
      .map(cr => ({
        criterionId: cr.criterionId,
        criterionCode: cr.criterionCode || '',
        criterionName: cr.criterionName || '',
        specification: cr.specification || '',
        sampleImage: cr.sampleImage || ''
      }));

    setFormCriteria(
      checkCriteria.length > 0
        ? checkCriteria
        : [
            {
              criterionCode: 'TC_CHUNG',
              criterionName: 'Tiêu chí kiểm tra chung',
              specification: 'Đạt tiêu chuẩn kỹ thuật',
              sampleImage: ''
            }
          ]
    );
    setActionErrorMsg(null);
    setIsModalOpen(true);
  };

  // Handle Add Criterion Row in Form
  const handleAddCriterionRow = () => {
    setFormCriteria(prev => [
      ...prev,
      {
        criterionCode: `TC_${Date.now().toString().slice(-4)}`,
        criterionName: '',
        specification: '',
        sampleImage: ''
      }
    ]);
  };

  // Handle Remove Criterion Row in Form
  const handleRemoveCriterionRow = (index: number) => {
    if (formCriteria.length <= 1) {
      alert('Cấu hình QC bắt buộc phải có ít nhất 01 tiêu chí.');
      return;
    }
    setFormCriteria(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Form Submission (Save QC Configuration)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQcGroupCode.trim() || !formQcGroupName.trim()) {
      alert('Vui lòng nhập đầy đủ Mã và Tên nhóm QC.');
      return;
    }

    if (formDeclarationLevel === 2 && !formMaterialGroupCode.trim()) {
      alert('Cấp khai báo 2 yêu cầu nhập Mã nhóm vật tư.');
      return;
    }

    if (formDeclarationLevel === 3 && !formMaterialId.trim()) {
      alert('Cấp khai báo 3 yêu cầu nhập Mã vật tư cụ thể.');
      return;
    }

    if (formCriteria.some(c => !c.criterionCode.trim() || !c.criterionName.trim())) {
      alert('Mỗi tiêu chí kiểm tra bắt buộc phải có Mã và Tên tiêu chí.');
      return;
    }

    setIsSubmitting(true);
    setActionErrorMsg(null);

    try {
      const payload: SaveQcConfigurationRequest = {
        checkId: formCheckId ?? undefined,
        qcGroupCode: formQcGroupCode.trim(),
        qcGroupName: formQcGroupName.trim(),
        declarationLevel: formDeclarationLevel,
        materialGroupCode: formDeclarationLevel === 2 ? formMaterialGroupCode.trim() : undefined,
        materialId: formDeclarationLevel === 3 ? formMaterialId.trim() : undefined,
        expectedChangedAt: formExpectedChangedAt,
        criteria: formCriteria.map(c => ({
          criterionId: c.criterionId,
          criterionCode: c.criterionCode.trim(),
          criterionName: c.criterionName.trim(),
          specification: c.specification?.trim() || undefined,
          sampleImage: c.sampleImage?.trim() || undefined
        }))
      };

      const res = await qualityService.saveConfiguration(payload);
      setActionSuccessMsg(
        `Lưu cấu hình QC thành công! Mã kiểm #${res.checkId} (${res.criterionCount} tiêu chí) đã được áp dụng.`
      );
      setIsModalOpen(false);
      await loadConfiguration(res.checkId);
      setSelectedCheckId(res.checkId);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Lỗi khi lưu cấu hình QC');
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
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm mã kiểm, nhóm QC, vật tư..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-emerald-600"
            />
          </div>

          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-emerald-600"
          >
            <option value="ALL">Tất cả cấp khai báo</option>
            <option value="2">Cấp 2: Nhóm Vật Tư</option>
            <option value="3">Cấp 3: Mã Vật Tư Cụ Thể</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadConfiguration(selectedCheckId || undefined)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Khai Báo Cấu Hình Mới (QC-01)
          </button>
        </div>
      </div>

      {/* Main Content Grid: Master / Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Checks List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Danh Sách Mã Kiểm QC ({filteredChecks.length})</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
              Đang tải danh mục cấu hình QC...
            </div>
          ) : filteredChecks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
              Không tìm thấy cấu hình tiêu chí QC nào.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredChecks.map(check => {
                const isSelected = selectedCheckId === check.checkId;
                const criteriaCount = (configData?.criteria || []).filter(cr => cr.checkId === check.checkId).length;

                return (
                  <div
                    key={check.checkId}
                    onClick={() => setSelectedCheckId(check.checkId)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-emerald-800 font-mono bg-emerald-100 px-2 py-0.5 rounded">
                          Mã Kiểm #{check.checkId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            check.declarationLevel === 3
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {check.declarationLevel === 3 ? 'Cấp 3: Vật tư cụ thể' : 'Cấp 2: Nhóm vật tư'}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        {criteriaCount} tiêu chí
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 truncate mb-1">
                      {check.qcGroupName || check.qcGroupCode}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>
                        {check.declarationLevel === 3 ? (
                          <>Vật tư: <strong className="font-mono text-purple-700">{check.materialId}</strong></>
                        ) : (
                          <>Nhóm VT: <strong className="font-mono text-blue-700">{check.materialGroupCode || check.qcGroupCode}</strong></>
                        )}
                      </span>
                      <span className="font-mono text-[10px]">
                        Nhóm QC: <strong>{check.qcGroupCode}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Criteria of Selected Check */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCheck ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              {/* Header Details */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 font-mono text-base">
                      Cấu Hình Mã Kiểm #{selectedCheck.checkId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedCheck.declarationLevel === 3
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {selectedCheck.declarationLevel === 3 ? 'Cấp 3: Vật Tư Riêng Biệt' : 'Cấp 2: Toàn Bộ Nhóm Vật Tư'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Nhóm QC: <strong className="text-slate-900">{selectedCheck.qcGroupName}</strong> ({selectedCheck.qcGroupCode})
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">
                    Phạm vi: {selectedCheck.declarationLevel === 3 ? `Mã Vật Tư = ${selectedCheck.materialId}` : `Nhóm Vật Tư = ${selectedCheck.materialGroupCode || selectedCheck.qcGroupCode}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedCheck)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Chỉnh Sửa Bộ Tiêu Chí
                </button>
              </div>

              {/* Criteria Detail Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <span>Bộ Tiêu Chí Đánh Giá Kỹ Thuật ({selectedCriteria.length})</span>
                </div>

                {selectedCriteria.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    Chưa có tiêu chí kiểm tra chi tiết nào cho mã kiểm này.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {selectedCriteria.map((criterion, idx) => (
                      <div
                        key={criterion.criterionId || idx}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-bold text-xs text-slate-900 font-mono">
                              {criterion.criterionCode}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-700">
                            {criterion.criterionName}
                          </span>
                        </div>

                        {criterion.specification && (
                          <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800">
                            <span className="font-semibold text-slate-500">Thông số kỹ thuật / Tiêu chuẩn: </span>
                            <span className="font-medium text-emerald-800">{criterion.specification}</span>
                          </div>
                        )}

                        {criterion.sampleImage && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                            <a
                              href={criterion.sampleImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline truncate hover:text-blue-800"
                            >
                              Xem ảnh mẫu quy chuẩn / lỗi ({criterion.sampleImage})
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
              Chọn một mã kiểm QC bên trái để xem chi tiết tiêu chuẩn kiểm tra.
            </div>
          )}
        </div>
      </div>

      {/* Modal Add / Edit QC Criteria Configuration */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  {modalMode === 'CREATE' ? 'Khai Báo Cấu Hình Tiêu Chí QC Mới' : `Chỉnh Sửa Cấu Hình Mã Kiểm #${formCheckId}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập tiêu chuẩn kiểm tra chất lượng theo Nhóm vật tư (Cấp 2) hoặc Mã vật tư cụ thể (Cấp 3)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Group & Scope Configuration */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  1. Phạm Vi Áp Dụng & Nhóm Tiêu Chí QC
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã Nhóm QC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formQcGroupCode}
                      onChange={e => setFormQcGroupCode(e.target.value.toUpperCase())}
                      placeholder="VD: QC_THEP_TAM, QC_NHUA"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tên Nhóm QC <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formQcGroupName}
                      onChange={e => setFormQcGroupName(e.target.value)}
                      placeholder="VD: Nhóm Kiểm Tra Thép Tấm Dập"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cấp Khai Báo <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formDeclarationLevel}
                      onChange={e => setFormDeclarationLevel(Number(e.target.value) as 2 | 3)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600 font-semibold"
                    >
                      <option value={2}>Cấp 2: Toàn Bộ Nhóm Vật Tư (Kế thừa)</option>
                      <option value={3}>Cấp 3: Mã Vật Tư Cụ Thể (Ưu tiên ghi đè)</option>
                    </select>
                  </div>

                  {formDeclarationLevel === 2 ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mã Nhóm Vật Tư Áp Dụng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formMaterialGroupCode}
                        onChange={e => setFormMaterialGroupCode(e.target.value.toUpperCase())}
                        placeholder="VD: NVL_THEP, PHUKIEN_NHUA"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600 font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mã Vật Tư Cụ Thể Áp Dụng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formMaterialId}
                        onChange={e => setFormMaterialId(e.target.value.toUpperCase())}
                        placeholder="VD: VT00129, KN-THEP-01"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-emerald-600 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Criteria List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    2. Danh Sách Tiêu Chí Kiểm Tra Chi Tiết ({formCriteria.length})
                  </span>

                  <button
                    type="button"
                    onClick={handleAddCriterionRow}
                    className="px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm Dòng Tiêu Chí
                  </button>
                </div>

                <div className="space-y-3">
                  {formCriteria.map((criterion, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2.5 relative group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            required
                            value={criterion.criterionCode}
                            onChange={e => {
                              const val = e.target.value.toUpperCase();
                              setFormCriteria(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, criterionCode: val } : item))
                              );
                            }}
                            placeholder="Mã tiêu chí (VD: TC_DO_DAY)"
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono w-48 focus:outline-emerald-600"
                          />
                          <input
                            type="text"
                            required
                            value={criterion.criterionName}
                            onChange={e => {
                              const val = e.target.value;
                              setFormCriteria(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, criterionName: val } : item))
                              );
                            }}
                            placeholder="Tên tiêu chí (VD: Độ dày tấm thép)"
                            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg flex-1 focus:outline-emerald-600"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCriterionRow(idx)}
                          disabled={formCriteria.length <= 1}
                          className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30 cursor-pointer"
                          title="Xóa tiêu chí này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={criterion.specification || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setFormCriteria(prev =>
                              prev.map((item, i) => (i === idx ? { ...item, specification: val } : item))
                            );
                          }}
                          placeholder="Thông số kỹ thuật / Dung sai (VD: 1.20 ± 0.05 mm)"
                          className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600"
                        />

                        <input
                          type="text"
                          value={criterion.sampleImage || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setFormCriteria(prev =>
                              prev.map((item, i) => (i === idx ? { ...item, sampleImage: val } : item))
                            );
                          }}
                          placeholder="Link / Đường dẫn ảnh mẫu kiểm tra (tùy chọn)"
                          className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang Lưu Dữ Liệu...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Xác Nhận Lưu Cấu Hình
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
