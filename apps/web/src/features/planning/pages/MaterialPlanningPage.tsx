import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  ClipboardPaste,
  Activity,
  Scale,
  Building2,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { planningService, PlanningUnitItem } from '../api/planningApi';
import { QuotaDeclarationTab } from '../components/QuotaDeclarationTab';
import { QuotaMonitoringTab } from '../components/QuotaMonitoringTab';
import { ThreeWayReconciliationTab } from '../components/ThreeWayReconciliationTab';

export const MaterialPlanningPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DECLARATION' | 'MONITORING' | 'RECONCILIATION'>('DECLARATION');
  const [planningUnits, setPlanningUnits] = useState<PlanningUnitItem[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const units = await planningService.getPlanningUnits();
        setPlanningUnits(units || []);
        if (units && units.length > 0) {
          setSelectedUnit(units[0].code);
        }
      } catch (err) {
        console.error('Lỗi nạp danh mục đơn vị kế hoạch:', err);
      }
    };
    fetchUnits();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-4xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Phân Hệ Kế Hoạch & Quản Lý Định Mức Vật Tư (PLN-01/02/03)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Quản Lý Định Mức Tháng & Cân Đối Kế Hoạch — Sử Dụng — Nhập Mua
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Hỗ trợ dán dữ liệu từ Excel với cơ chế kiểm soát mã CSDL tức thời, giám sát tiến độ tiêu hao định mức theo thời gian thực và ma trận cân đối 3 chiều chống đứt gãy chuyền sản xuất.
          </p>
        </div>

        {/* Subtle Background Glow */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('DECLARATION')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'DECLARATION'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>1. Khai Báo Định Mức (Dán Excel) [PLN-01]</span>
        </button>

        <button
          onClick={() => setActiveTab('MONITORING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'MONITORING'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Theo Dõi Tiêu Hao Realtime [PLN-02]</span>
        </button>

        <button
          onClick={() => setActiveTab('RECONCILIATION')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'RECONCILIATION'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>3. Cân Đối Kế Hoạch — Sử Dụng — Nhập Mua [PLN-03]</span>
        </button>
      </div>

      {/* Tab Content Rendering */}
      <div>
        {activeTab === 'DECLARATION' && (
          <QuotaDeclarationTab
            planningUnits={planningUnits}
            currentUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onSaveSuccess={() => {
              // Optionally switch or refresh
            }}
          />
        )}

        {activeTab === 'MONITORING' && (
          <QuotaMonitoringTab
            planningUnits={planningUnits}
            currentUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        )}

        {activeTab === 'RECONCILIATION' && (
          <ThreeWayReconciliationTab
            currentMonth={currentMonth}
            currentYear={currentYear}
          />
        )}
      </div>
    </div>
  );
};
