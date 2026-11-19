import { useState } from 'react';
import { AppProvider } from '@/context/AppContext';
import { Sidebar, type PageKey } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { AlertToasts } from '@/components/AlertToasts';
import { DashboardPage } from '@/pages/DashboardPage';
import { LiveMonitoringPage } from '@/pages/LiveMonitoringPage';
import { DetectionPage } from '@/pages/DetectionPage';
import { PredictionPage } from '@/pages/PredictionPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { GatesPage } from '@/pages/GatesPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Menu } from 'lucide-react';

function Shell() {
  const [page, setPage] = useState<PageKey>('dashboard');
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <div className="flex min-h-screen bg-navy-950 bg-grid">
      <Sidebar page={page} onNavigate={setPage} mobileOpen={mobileNav} onCloseMobile={() => setMobileNav(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center md:hidden">
          <button onClick={() => setMobileNav(true)} className="m-2 grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-slate-200">
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <TopBar onOpenAlerts={() => setPage('alerts')} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          <div className="animate-fade-in">
            {page === 'dashboard' && <DashboardPage />}
            {page === 'live' && <LiveMonitoringPage />}
            {page === 'detection' && <DetectionPage />}
            {page === 'prediction' && <PredictionPage />}
            {page === 'alerts' && <AlertsPage />}
            {page === 'gates' && <GatesPage />}
            {page === 'recommendations' && <RecommendationsPage />}
            {page === 'reports' && <ReportsPage />}
            {page === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>
      <AlertToasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
