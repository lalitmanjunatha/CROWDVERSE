import { useApp } from '@/context/AppContext';
import { useEffect } from 'react';
import { CheckCircle2, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Lightweight toast stack driven by the most recent active alerts. */
export function AlertToasts() {
  const { alerts, acknowledgeAlert } = useApp();
  const active = alerts.filter(a => a.status === 'active').slice(0, 3);

  // auto-dismiss handled by user; but keep list stable by id
  useEffect(() => { /* no-op, stability */ }, [alerts]);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {active.map(a => {
        const Icon = a.severity === 'critical' ? AlertTriangle : a.severity === 'warning' ? AlertTriangle : Info;
        const tone = a.severity === 'critical' ? 'ring-crit-500/40 bg-crit-500/10' : a.severity === 'warning' ? 'ring-warn-500/30 bg-warn-500/10' : 'ring-accent-500/30 bg-accent-500/10';
        const iconColor = a.severity === 'critical' ? 'text-crit-400' : a.severity === 'warning' ? 'text-warn-400' : 'text-accent-400';
        return (
          <div key={a.id} className={cn('pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 p-3 backdrop-blur-xl shadow-card animate-slide-in', tone)}>
            <Icon className={cn('mt-0.5 h-5 w-5 flex-shrink-0', iconColor)} />
            <div className="flex-1">
              <p className="text-xs font-medium text-white">{a.message}</p>
              <p className="mt-1 text-[11px] text-slate-300">{a.recommendation}</p>
            </div>
            <button onClick={() => acknowledgeAlert(a.id)} className="text-slate-400 hover:text-white" aria-label="Dismiss">
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
