import { useApp } from '@/context/AppContext';
import { densityLevel, DENSITY_META } from '@/lib/density';
import { timeAgo } from '@/lib/utils';
import { SeverityBadge } from './Badges';
import { CheckCircle2, Bell, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertEvent } from '@/types';

export function AlertList({ alerts, onAck, onResolve, compact }: {
  alerts: AlertEvent[];
  onAck?: (id: string) => void;
  onResolve?: (id: string) => void;
  compact?: boolean;
}) {
  const { zones } = useApp();
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
        <Bell className="h-7 w-7 text-slate-600" />
        <p className="text-sm text-slate-400">No alerts recorded.</p>
        <p className="text-xs text-slate-500">Alerts appear here when zones cross their thresholds.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {alerts.map(a => {
        const zone = zones.find(z => z.id === a.zoneId);
        const level = zone ? densityLevel(0, zone) : null; // not meaningful; use severity
        return (
          <div
            key={a.id}
            className={cn(
              'rounded-lg border border-white/5 bg-navy-900/60 p-3',
              a.status === 'active' && a.severity === 'critical' && 'ring-1 ring-crit-500/30'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className={cn('mt-0.5 h-4 w-4', a.severity === 'critical' ? 'text-crit-400' : a.severity === 'warning' ? 'text-warn-400' : 'text-accent-400')} />
                <div>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={a.severity} />
                    <span className="text-[10px] text-slate-500">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-200">{a.message}</p>
                  {!compact && <p className="mt-1 text-[11px] text-slate-400">{a.recommendation}</p>}
                </div>
              </div>
              {a.status === 'active' && (onAck || onResolve) && (
                <div className="flex gap-1">
                  {onAck && <button onClick={() => onAck(a.id)} className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/10">Ack</button>}
                  {onResolve && <button onClick={() => onResolve(a.id)} className="rounded-md bg-safe-500/15 px-2 py-1 text-[10px] text-safe-400 hover:bg-safe-500/25">Resolve</button>}
                </div>
              )}
              {a.status !== 'active' && (
                <span className={cn('chip', a.status === 'resolved' ? 'bg-safe-500/15 text-safe-400' : 'bg-white/5 text-slate-400')}>
                  {a.status === 'resolved' && <CheckCircle2 className="h-3 w-3" />} {a.status}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
