import {
  LayoutDashboard, Radio, ScanSearch, TrendingUp, Bell, DoorOpen,
  Lightbulb, FileText, Settings as SettingsIcon, Shield, Play, Pause, RotateCcw,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export type PageKey =
  | 'dashboard' | 'live' | 'detection' | 'prediction' | 'alerts'
  | 'gates' | 'recommendations' | 'reports' | 'settings';

const NAV: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'live', label: 'Live Monitoring', icon: Radio },
  { key: 'detection', label: 'AI Detection', icon: ScanSearch },
  { key: 'prediction', label: 'Crowd Prediction', icon: TrendingUp },
  { key: 'alerts', label: 'Alerts Center', icon: Bell },
  { key: 'gates', label: 'Gate Management', icon: DoorOpen },
  { key: 'recommendations', label: 'AI Recommendations', icon: Lightbulb },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({
  page, onNavigate, mobileOpen, onCloseMobile,
}: {
  page: PageKey;
  onNavigate: (p: PageKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { running, start, pause, reset, alerts } = useApp();
  const activeAlerts = alerts.filter(a => a.status === 'active').length;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={onCloseMobile} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-navy-950/95 backdrop-blur-xl transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/5 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 shadow-[0_0_20px_-6px_rgba(14,165,233,0.8)]">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">CrowdGuard <span className="text-accent-400">AI</span></div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Safety Monitor</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { onNavigate(item.key); onCloseMobile(); }}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                  active
                    ? 'bg-accent-500/15 text-white ring-1 ring-accent-500/30'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                )}
              >
                <Icon className={cn('h-4.5 w-4.5', active ? 'text-accent-400' : 'text-slate-500 group-hover:text-slate-300')} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.key === 'alerts' && activeAlerts > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-crit-500 px-1 text-[10px] font-bold text-white">
                    {activeAlerts}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="card space-y-2 p-3">
            <div className="label">Simulation</div>
            <div className="flex gap-2">
              {running ? (
                <button onClick={pause} className="btn-ghost flex-1 !py-1.5 !text-xs">
                  <Pause className="h-3.5 w-3.5" /> Pause
                </button>
              ) : (
                <button onClick={start} className="btn-primary flex-1 !py-1.5 !text-xs">
                  <Play className="h-3.5 w-3.5" /> Start
                </button>
              )}
              <button onClick={reset} className="btn-ghost !py-1.5 !text-xs" title="Reset simulation">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500">
              Demo simulation engine. Values are simulated, not from a live AI model.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
