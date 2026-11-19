import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, StatCard } from '@/components/ui';
import { AlertList } from '@/components/AlertList';
import { AlertTriangle, Bell, CheckCircle2, Activity, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'active' | 'acknowledged' | 'resolved';

export function AlertsPage() {
  const { alerts, acknowledgeAlert, resolveAlert, clearAlerts } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = alerts.filter(a => filter === 'all' ? true : a.status === filter);
  const counts = {
    active: alerts.filter(a => a.status === 'active').length,
    ack: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
  };

  const filters: { key: Filter; label: string; n: number }[] = [
    { key: 'all', label: 'All', n: alerts.length },
    { key: 'active', label: 'Active', n: counts.active },
    { key: 'acknowledged', label: 'Acknowledged', n: counts.ack },
    { key: 'resolved', label: 'Resolved', n: counts.resolved },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Alerts Center</h1>
          <p className="text-sm text-slate-400">All overcrowding alerts and their resolution status.</p>
        </div>
        {alerts.length > 0 && (
          <button onClick={clearAlerts} className="btn-ghost !text-xs">
            <Trash2 className="h-3.5 w-3.5" /> Clear History
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active Alerts" value={counts.active} icon={AlertTriangle} tone={counts.active ? 'crit' : 'safe'} />
        <StatCard label="Critical (active)" value={counts.critical} icon={Bell} tone={counts.critical ? 'crit' : 'safe'} />
        <StatCard label="Acknowledged" value={counts.ack} icon={Activity} tone="warn" />
        <StatCard label="Resolved" value={counts.resolved} icon={CheckCircle2} tone="safe" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn('chip ring-1 transition-colors', filter === f.key ? 'bg-accent-500/15 text-accent-400 ring-accent-500/30' : 'bg-white/5 text-slate-400 ring-white/5 hover:text-slate-200')}
            >
              {f.label} <span className="opacity-70">({f.n})</span>
            </button>
          ))}
        </div>
        <AlertList alerts={filtered} onAck={acknowledgeAlert} onResolve={resolveAlert} />
      </Card>
    </div>
  );
}
