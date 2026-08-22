import React, { useState } from 'react';
import { WarehouseProvider, useWarehouse } from './app/providers/warehouseStore';
import { Sidebar, NavModule } from './app/layout/Sidebar';
import { Navbar } from './app/layout/Navbar';
import { Dashboard } from './features/dashboard';
import { ReceivingModule } from './features/receiving';
import { QualityControlModule, QcConfigurationPage } from './features/quality';
import { PutawayModule } from './features/location-operations';
import { InventoryModule } from './features/inventory';
import { BatchAuditManagement } from './features/inventory/components/BatchAuditManagement';
import { CycleCountModule } from './features/cycle-count';
import { RequestIssuePage } from './features/request-issue';
import { OutboundModule } from './features/outbound';
import { ReportsModule } from './features/reports';
import { SettingsModule } from './features/administration';
import { HandheldModule } from './features/handheld';
import { MaterialPlanningPage } from './features/planning';
import { BarcodeLabelModal } from './shared/components/BarcodeLabelModal';
import { LoginPage } from './features/access';
import { TvDashboardPage } from './features/dashboard';
import { Loader2, Warehouse } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isAuthChecking, onLoginSuccess, currentUser, logoutUser } = useWarehouse();
  const [isTvMode, setIsTvMode] = useState(false);
  
  const getInitialModule = (role: string): NavModule => {
    const r = (role || '').toLowerCase();
    if (r.includes('kiemke') || r.includes('kiem_ke') || r.includes('audit')) return 'cycle_count';
    if (r.includes('qc') || r.includes('qa')) return 'qc';
    if (r.includes('yeucau') || r.includes('sx') || r.includes('bophan') || r.includes('prod')) return 'request_issue';
    if (r.includes('admin')) return 'dashboard';
    return 'receiving';
  };

  const [activeModule, setActiveModule] = useState<NavModule>(() => getInitialModule(currentUser?.role || ''));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync module when user logs in or switches
  React.useEffect(() => {
    if (currentUser?.role) {
      setActiveModule(getInitialModule(currentUser.role));
    }
  }, [currentUser?.id, currentUser?.role]);

  // 1. Loading state during initial session check
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-center justify-center mb-4">
          <Warehouse className="w-8 h-8 text-emerald-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Đang kết nối phiên làm việc CSDL...</span>
        </div>
      </div>
    );
  }

  // 2. UC-01 (AUTH-01): If not authenticated, render the full-screen Login View (scr_login)
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={onLoginSuccess} />;
  }

  // 2.1. Dedicated TV Dashboard Viewer Role (Chỉ xem TV Dashboard)
  const isTvViewer = currentUser?.role === 'tv_viewer' || currentUser?.id === 'tv_kho' || currentUser?.id === 'tv';
  if (isTvViewer) {
    return <TvDashboardPage onClose={logoutUser} />;
  }

  // 3. Authenticated state: Render MMS App Shell
  return (
    <div className="min-h-screen bg-slate-100 industrial-grid-bg flex flex-col font-sans text-slate-900 antialiased selection:bg-[#007D3C] selection:text-white animate-in fade-in duration-200">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onSearch={(_q) => {}}
        onLaunchHandheld={() => setActiveModule('handheld')}
        onLaunchTv={() => setIsTvMode(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={(mod) => {
            setActiveModule(mod);
            setIsMobileSidebarOpen(false);
          }}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {activeModule === 'dashboard' && <Dashboard onNavigate={setActiveModule} />}
            {activeModule === 'handheld' && <HandheldModule onExitToDesktop={() => setActiveModule('dashboard')} />}
            {activeModule === 'planning' && <MaterialPlanningPage initialTab="DECLARATION" />}
            {activeModule === 'planning_declare' && <MaterialPlanningPage initialTab="DECLARATION" />}
            {activeModule === 'planning_monitor' && <MaterialPlanningPage initialTab="MONITORING" />}
            {activeModule === 'planning_reconcile' && <MaterialPlanningPage initialTab="RECONCILIATION" />}
            {activeModule === 'receiving' && <ReceivingModule />}
            {activeModule === 'qc' && <QualityControlModule />}
            {activeModule === 'qc_config' && <QcConfigurationPage />}
            {activeModule === 'putaway' && <PutawayModule />}
            {activeModule === 'inventory' && <InventoryModule />}
            {activeModule === 'batch_audit' && <BatchAuditManagement />}
            {activeModule === 'cycle_count' && <CycleCountModule />}
            {activeModule === 'request_issue' && <RequestIssuePage />}
            {activeModule === 'outbound' && <OutboundModule />}
            {activeModule === 'reports' && <ReportsModule />}
            {activeModule === 'settings' && <SettingsModule />}
          </div>
        </main>
      </div>

      {/* Global TV Operations Wallboard (UC-29) */}
      {isTvMode && (
        <TvDashboardPage onClose={() => setIsTvMode(false)} />
      )}

      {/* Global Printable Barcode Label Modal */}
      <BarcodeLabelModal />
    </div>
  );
};

export function App() {
  return (
    <WarehouseProvider>
      <AppContent />
    </WarehouseProvider>
  );
}

export default App;
