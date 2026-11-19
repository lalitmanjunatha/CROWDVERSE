import { Activity, AlertTriangle, Bell, Shield, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { densityLevel } from '@/lib/density';
import { cn } from '@/lib/utils';
import { StatusDot } from './Badges';

export function TopBar({ onOpenAlerts }: { onOpenAlerts?: () => void }) {
  const { zones, counts, alerts, settings, running } = useApp();
  const totalPeople = Object.values(counts).reduce((a, b) => a + b, 0);
  const overcrowded = zones.filter(z => densityLevel(counts[z.id] ?? 0, z) === 'red').length;
  const activeAlerts = alerts.filter(a => a.status === 'active').length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-navy-950/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 shadow-[0_0_20px_-6px_rgba(14,165,233,0.8)]">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-white">CrowdGuard <span className="text-accent-400">AI</span></div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Intelligent Crowd Safety</div>
        </div>
      </div>

      <div className="ml-2 hidden items-center gap-2 lg:flex">
        <div className="glass flex items-center gap-2 px-3 py-1.5">
          <StatusDot active={running} label={running ? 'Simulation Running' : 'Simulation Paused'} />
        </div>
        <div className="glass flex items-center gap-2 px-3 py-1.5">
          <Activity className="h-3.5 w-3.5 text-accent-400" />
          <span className="text-xs text-slate-300">{totalPeople.toLocaleString()} people</span>
        </div>
        {overcrowded > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-crit-500/15 px-3 py-1.5 ring-1 ring-crit-500/30">
            <AlertTriangle className="h-3.5 w-3.5 text-crit-400" />
            <span className="text-xs text-crit-400">{overcrowded} overcrowded</span>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={onOpenAlerts}
          className="relative grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          {activeAlerts > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-crit-500 px-1 text-[10px] font-bold text-white">
              {activeAlerts}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-2.5 py-1.5">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 text-xs font-semibold text-white">
            {settings.admin.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-xs font-medium text-white">{settings.admin.name}</div>
            <div className="text-[10px] text-slate-400">{settings.admin.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
