import React, { useState, useEffect } from 'react';
import {
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Save,
  Trash2,
  Copy,
  Plus,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Search,
  Sparkles,
  Info,
  Edit3,
  Loader2,
  Lock
} from 'lucide-react';
import { useWarehouse } from '../../../app/providers/warehouseStore';
import { permissionService } from '../../administration/api/permissionApi';
import {
  planningService,
  PlanningUnitItem,
  ValidatePasteItemResult,
  BulkSaveQuotaInputItem
} from '../api/planningApi';

interface QuotaDeclarationTabProps {
  planningUnits: PlanningUnitItem[];
  currentUnit: string;
  onSelectUnit: (unit: string) => void;
  currentMonth: number;
  currentYear: number;
  onSaveSuccess?: () => void;
}

export const QuotaDeclarationTab: React.FC<QuotaDeclarationTabProps> = ({
  planningUnits,
  currentUnit,
  onSelectUnit,
  currentMonth,
  currentYear,
  onSaveSuccess
}) => {
  const { currentUser } = useWarehouse();
  const canCreateQuota = currentUser?.role ? permissionService.hasPermission(currentUser.role, 'pln.create') : false;
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedUnit, setSelectedUnit] = useState<string>(currentUnit || (planningUnits[0]?.code || 'tp_inox'));

  const [pasteText, setPasteText] = useState<string>('');
  const [gridItems, setGridItems] = useState<ValidatePasteItemResult[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'VALID' | 'INVALID' | 'DUPLICATE'>('ALL');

  useEffect(() => {
    if (currentUnit) setSelectedUnit(currentUnit);
  }, [currentUnit]);

  // Parse clipboard text copied from Excel (Tabs & Newlines)
  const parsePasteInput = async (text: string) => {
    if (!text || !text.trim()) return;
    setIsValidating(true);
    setErrorMessage(null);

    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const rawList: { rawMaterialCode: string; rawQuantity: number; rawUnit?: string; rawNote?: string }[] = [];

      for (const line of lines) {
        // Split by Tab (\t) from Excel or comma
        const cols = line.split('\t').map(c => c.trim());
        if (cols.length === 0 || !cols[0]) continue;

        // Skip Header row if user copied headers
        const firstColLower = cols[0].toLowerCase();
        if (firstColLower.includes('mã') || firstColLower.includes('sku') || firstColLower.includes('material')) {
          continue;
        }

        const rawCode = cols[0];
        // Clean quantity format (replace comma with dot if needed)
        const rawQtyStr = (cols[1] || '0').replace(',', '.');
        const rawQty = parseFloat(rawQtyStr) || 0;
        const rawUnit = cols[2] || undefined;
        const rawNote = cols[3] || undefined;

        rawList.push({
          rawMaterialCode: rawCode,
          rawQuantity: rawQty,
          rawUnit,
          rawNote
        });
      }

      if (rawList.length === 0) {
        setErrorMessage('Không tìm thấy dữ liệu hợp lệ trong vùng dán. Vui lòng kiểm tra lại định dạng.');
        setIsValidating(false);
        return;
      }

      // Send to Backend for fast catalog validation
      const validationRes = await planningService.validatePasteData(rawList);
      setGridItems(validationRes.items);
      setPasteText(''); // Clear paste box on success
    } catch (err: any) {
      setErrorMessage('Lỗi khi đối soát dữ liệu dán: ' + (err.message || err));
    } finally {
      setIsValidating(false);
    }
  };

  // Handle single row update (Inline Edit)
  const handleUpdateItem = async (index: number, field: keyof ValidatePasteItemResult, value: any) => {
    const updated = [...gridItems];
    const item = { ...updated[index], [field]: value };

    // If code changed, re-validate single row
    if (field === 'rawMaterialCode' && value.trim()) {
      try {
        const valRes = await planningService.validatePasteData([{
          rawMaterialCode: value.trim(),
          rawQuantity: item.quantity || 1,
          rawUnit: item.unit,
          rawNote: item.note
        }]);
        if (valRes.items.length > 0) {
          const first = valRes.items[0];
          item.isValid = first.isValid;
          item.errorMessage = first.errorMessage;
          item.materialId = first.materialId;
          item.bravoId = first.bravoId;
          item.materialName = first.materialName;
          item.unit = first.unit;
        }
      } catch {}
    }

    if (field === 'quantity') {
      const q = parseFloat(value) || 0;
      item.quantity = q;
      if (q <= 0) {
        item.isValid = false;
        item.errorMessage = 'Số lượng định mức phải > 0';
      } else if (item.materialId) {
        item.isValid = true;
        item.errorMessage = undefined;
      }
    }

    updated[index] = item;
    setGridItems(updated);
  };

  const handleDeleteRow = (index: number) => {
    const updated = gridItems.filter((_, i) => i !== index);
    setGridItems(updated);
  };

  const handleAddNewEmptyRow = () => {
    const newRow: ValidatePasteItemResult = {
      rowIndex: gridItems.length + 1,
      rawMaterialCode: '',
      isValid: false,
      errorMessage: 'Chưa nhập mã vật tư',
      quantity: 100,
      isDuplicate: false
    };
    setGridItems([...gridItems, newRow]);
  };

  // Group Duplicate SKU Rows by Summing Quantities
  const handleGroupDuplicates = () => {
    const map = new Map<string, ValidatePasteItemResult>();
    for (const item of gridItems) {
      const key = (item.materialId || item.rawMaterialCode).toLowerCase().trim();
      if (!key) continue;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.quantity += item.quantity;
        if (item.note && !existing.note?.includes(item.note)) {
          existing.note = existing.note ? `${existing.note}; ${item.note}` : item.note;
        }
        existing.isDuplicate = false;
      } else {
        map.set(key, { ...item, isDuplicate: false });
      }
    }
    const merged = Array.from(map.values()).map((it, idx) => ({ ...it, rowIndex: idx + 1 }));
    setGridItems(merged);
  };

  // Copy previous month
  const handleCopyPreviousMonth = async () => {
    let sourceMonth = selectedMonth - 1;
    let sourceYear = selectedYear;
    if (sourceMonth === 0) {
      sourceMonth = 12;
      sourceYear = selectedYear - 1;
    }

    if (!confirm(`Bạn có chắc chắn muốn sao chép toàn bộ định mức từ Tháng ${sourceMonth}/${sourceYear} sang Tháng ${selectedMonth}/${selectedYear} cho đơn vị này?`)) {
      return;
    }

    setIsCopying(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await planningService.copyPreviousMonthQuota({
        planningUnit: selectedUnit,
        sourceMonth,
        sourceYear,
        targetMonth: selectedMonth,
        targetYear: selectedYear
      });
      setSuccessMessage(`✅ Sao chép thành công ${res.copiedCount} dòng định mức từ Tháng ${sourceMonth}/${sourceYear}!`);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi sao chép định mức');
    } finally {
      setIsCopying(false);
    }
  };

  // Save to database
  const handleSaveQuota = async () => {
    const validItems = gridItems.filter(it => it.isValid && it.materialId && it.quantity > 0);
    if (validItems.length === 0) {
      setErrorMessage('Không có dòng vật tư hợp lệ nào để lưu.');
      return;
    }

    const invalidCount = gridItems.filter(it => !it.isValid).length;
    if (invalidCount > 0) {
      if (!confirm(`Có ${invalidCount} dòng dữ liệu bị lỗi/sai mã. Hệ thống sẽ BỎ QUA các dòng lỗi và chỉ lưu ${validItems.length} dòng hợp lệ. Bạn có muốn tiếp tục?`)) {
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payloadItems: BulkSaveQuotaInputItem[] = validItems.map(it => ({
        materialId: it.materialId!,
        quantity: it.quantity,
        unit: it.unit,
        note: it.note
      }));

      const res = await planningService.bulkSaveQuota({
        planningUnit: selectedUnit,
        month: selectedMonth,
        year: selectedYear,
        items: payloadItems
      });

      setSuccessMessage(`🎉 Đã lưu thành công ${res.totalProcessed} dòng định mức cho Tháng ${selectedMonth}/${selectedYear} (Thêm mới: ${res.insertedCount}, Cập nhật: ${res.updatedCount})!`);
      setGridItems([]);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu bảng định mức');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered rows
  const displayedItems = gridItems.filter(it => {
    if (filterMode === 'VALID') return it.isValid;
    if (filterMode === 'INVALID') return !it.isValid;
    if (filterMode === 'DUPLICATE') return it.isDuplicate;
    return true;
  });

  const validRowsCount = gridItems.filter(it => it.isValid).length;
  const invalidRowsCount = gridItems.filter(it => !it.isValid).length;
  const duplicateRowsCount = gridItems.filter(it => it.isDuplicate).length;

  return (
    <div className="space-y-6">
      {/* 1. Header Setting Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                1. Đơn Vị Kế Hoạch / Phân Xưởng
              </label>
              <select
                value={selectedUnit}
                onChange={e => {
                  setSelectedUnit(e.target.value);
                  onSelectUnit(e.target.value);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none min-w-[240px]"
              >
                {planningUnits.map(u => (
                  <option key={u.code} value={u.code}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                2. Tháng Áp Dụng
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    Tháng {m < 10 ? `0${m}` : m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                3. Năm
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {canCreateQuota && (
              <button
                onClick={handleCopyPreviousMonth}
                disabled={isCopying}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Sao chép toàn bộ định mức từ tháng trước"
              >
                {isCopying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                <span>Copy Định Mức Tháng Trước</span>
              </button>
            )}
          </div>
        </div>

        {/* Format Instruction Alert or View-Only Banner */}
        {canCreateQuota ? (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-emerald-950">
            <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Quy định 4 Cột Excel khi Dán:</span> Copy các cột theo thứ tự{' '}
              <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
                [Cột 1: Mã Vật Tư] [Cột 2: Số Lượng Định Mức] [Cột 3: ĐVT] [Cột 4: Ghi Chú]
              </code>{' '}
              từ Excel rồi bấm <kbd className="bg-white border border-emerald-300 px-1 rounded shadow-xs font-mono font-bold">Ctrl + V</kbd> vào ô bên dưới. Hệ thống sẽ tự động so khớp tức thì với CSDL để kiểm tra tính hợp lệ.
            </div>
          </div>
        ) : (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-950">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Chế Độ Xem Định Mức Đơn Vị:</span> Bạn đang theo dõi định mức tháng đã được phê duyệt của phân xưởng. Chức năng khai báo và chỉnh sửa định mức do <strong>Phòng Kế Hoạch Sản Xuất</strong> thực hiện.
            </div>
          </div>
        )}
      </div>

      {/* 2. Smart Paste Dropzone Box (Only for users with pln.create) */}
      {canCreateQuota && (
      <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-colors shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <ClipboardPaste className="w-4 h-4 text-emerald-600" />
            <span>VÙNG DÁN DỮ LIỆU TỪ EXCEL (Ctrl + V)</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Dán dữ liệu trực tiếp vào ô bên dưới để tự động phân tích
          </span>
        </div>

        <textarea
          rows={3}
          value={pasteText}
          onChange={e => {
            setPasteText(e.target.value);
            parsePasteInput(e.target.value);
          }}
          onPaste={e => {
            const pastedData = e.clipboardData.getData('text');
            if (pastedData) {
              e.preventDefault();
              parsePasteInput(pastedData);
            }
          }}
          placeholder="👉 Click vào đây và ấn Ctrl + V để dán danh sách định mức từ file Excel của bạn..."
          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all placeholder:text-slate-400 placeholder:italic"
        />

        {isValidating && (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang đối soát mã với CSDL MMS1 & Bravo...</span>
          </div>
        )}
      </div>
      )}

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900">✕</button>
        </div>
      )}

      {/* 3. Interactive Data Grid Preview */}
      {gridItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Table Toolbar & Stats */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800">
                BẢNG XEM TRƯỚC ({gridItems.length} dòng):
              </span>
              <button
                onClick={() => setFilterMode('ALL')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${filterMode === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                Tất cả ({gridItems.length})
              </button>
              <button
                onClick={() => setFilterMode('VALID')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 ${filterMode === 'VALID' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'}`}
              >
                <CheckCircle2 className="w-3 h-3" /> Hợp lệ ({validRowsCount})
              </button>
              {invalidRowsCount > 0 && (
                <button
                  onClick={() => setFilterMode('INVALID')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 ${filterMode === 'INVALID' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800'}`}
                >
                  <AlertCircle className="w-3 h-3" /> Sai mã ({invalidRowsCount})
                </button>
              )}
              {duplicateRowsCount > 0 && (
                <button
                  onClick={() => setFilterMode('DUPLICATE')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1 ${filterMode === 'DUPLICATE' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'}`}
                >
                  <AlertTriangle className="w-3 h-3" /> Trùng ({duplicateRowsCount})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {duplicateRowsCount > 0 && (
                <button
                  onClick={handleGroupDuplicates}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Gộp Dòng Trùng ({duplicateRowsCount})
                </button>
              )}
              <button
                onClick={handleAddNewEmptyRow}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm 1 dòng
              </button>
              <button
                onClick={() => setGridItems([])}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa bảng
              </button>
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto max-h-[450px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">STT</th>
                  <th className="py-2.5 px-3 w-28">Trạng Thái</th>
                  <th className="py-2.5 px-3 w-36">Mã Vật Tư</th>
                  <th className="py-2.5 px-3 w-32">Mã Bravo</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Tên Vật Tư (CSDL)</th>
                  <th className="py-2.5 px-3 w-20">ĐVT</th>
                  <th className="py-2.5 px-3 w-32 text-right">Số Lượng ĐM</th>
                  <th className="py-2.5 px-3 min-w-[160px]">Ghi Chú</th>
                  <th className="py-2.5 px-2 w-10 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedItems.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !item.isValid
                        ? 'bg-rose-50/40'
                        : item.isDuplicate
                        ? 'bg-amber-50/40'
                        : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2 px-3">
                      {item.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hợp lệ
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]"
                          title={item.errorMessage}
                        >
                          <AlertCircle className="w-3 h-3 text-rose-600" /> {item.errorMessage || 'Sai mã'}
                        </span>
                      )}
                      {item.isDuplicate && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded font-bold text-[9px]">
                          Trùng
                        </span>
                      )}
                    </td>

                    {/* Material Code Input */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={item.rawMaterialCode}
                        onChange={e => handleUpdateItem(idx, 'rawMaterialCode', e.target.value)}
                        className={`w-full px-2 py-1 bg-white border rounded font-mono font-bold text-xs focus:ring-2 focus:outline-none ${
                          item.isValid ? 'border-slate-300 text-slate-900 focus:ring-emerald-500' : 'border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-500'
                        }`}
                        placeholder="Mã SKU..."
                      />
                    </td>

                    {/* Bravo Code */}
                    <td className="py-2 px-3 font-mono text-slate-500">
                      {item.bravoId || '—'}
                    </td>

                    {/* Material Name */}
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {item.materialName || (
                        <span className="text-rose-500 italic text-[11px]">Không tìm thấy vật tư</span>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-3 text-slate-600 font-bold">
                      {item.unit || '—'}
                    </td>

                    {/* Quantity Input */}
                    <td className="py-1 px-2 text-right">
                      <input
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        value={item.quantity}
                        onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs text-right text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* Note Input */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={e => handleUpdateItem(idx, 'note', e.target.value)}
                        placeholder="Ghi chú..."
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </td>

                    {/* Delete */}
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleDeleteRow(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Xóa dòng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Save Action */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-600 font-semibold">
              Sẵn sàng lưu: <span className="font-extrabold text-emerald-700">{validRowsCount} / {gridItems.length}</span> dòng hợp lệ vào CSDL.
            </div>

            <button
              onClick={handleSaveQuota}
              disabled={isSaving || validRowsCount === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang lưu vào CSDL...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>LƯU & KÍCH HOẠT ĐỊNH MỨC THÁNG ({validRowsCount} DÒNG)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
