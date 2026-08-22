import React, { useState } from 'react';
import {
  Sliders,
  Layers,
  Award,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  Info
} from 'lucide-react';
import { QcCriteriaConfigTab } from '../components/QcCriteriaConfigTab';
import { MaterialQcAssignmentTab } from '../components/MaterialQcAssignmentTab';

export const QcConfigurationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'criteria' | 'assignments'>('criteria');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Quản Trị Tiêu Chuẩn Chất Lượng (QC Master Data)
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Khai Báo & Quản Lý Tiêu Chí Kiểm Định QC (QC-01 / QC-02)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập danh mục bộ chỉ tiêu kỹ thuật đo lường (QC-01) và phân bổ tiêu chuẩn kiểm tra cho từng mã SKU/vật tư (QC-02) trên CSDL MMS1.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('criteria')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'criteria'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Khai Báo Bộ Tiêu Chí (QC-01)</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Gán Tiêu Chí Cho Vật Tư (QC-02)</span>
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-teal-900">
        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Quy tắc phân quyền QC Master:</span> Màn hình này dành cho Kỹ sư Quản lý Chất lượng (QA/QC Lead) hoặc Quản trị viên để cấu hình bộ tiêu chuẩn. Nhân viên kiểm tra hiện trường (QC Inspector) chỉ cần phân quyền vào màn hình <strong>"Kiểm Định QC"</strong> để đánh giá hàng nhập.
        </div>
      </div>

      {/* Content Rendering */}
      <div>
        {activeTab === 'criteria' && <QcCriteriaConfigTab />}
        {activeTab === 'assignments' && <MaterialQcAssignmentTab />}
      </div>
    </div>
  );
};
