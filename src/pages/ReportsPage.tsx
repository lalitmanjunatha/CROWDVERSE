import { useApp } from '@/context/AppContext';
import { Card, CardHeader } from '@/components/ui';
import { occupancy, densityLevel, DENSITY_META } from '@/lib/density';
import { Download, FileText, BarChart3, AlertTriangle, Clock } from 'lucide-react';
import { cn, formatDateTime, timeAgo } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const ZONE_COLORS: Record<string, string> = {
  A: '#38bdf8', B: '#34d399', C: '#fbbf24', D: '#fb923c', E: '#a78bfa', F: '#f472b6',
};

export function ReportsPage() {
  const { zones, counts, alerts, recommendations } = useApp();
  const totalPeople = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalCapacity = zones.reduce((a, z) => a + z.capacity, 0);

  const zoneRows = zones.map(z => {
    const c = counts[z.id] ?? 0;
    const level = densityLevel(c, z);
    return { z, count: c, pct: occupancy(c, z.capacity), level };
  });

  const pieData = (['green', 'yellow', 'orange', 'red'] as const).map(l => ({
    name: DENSITY_META[l].label,
    value: zoneRows.filter(r => r.level === l).length,
    color: DENSITY_META[l].color,
  })).filter(d => d.value > 0);

  function downloadCSV() {
    const lines: string[] = [];
    lines.push('CrowdGuard AI – Crowd Safety Report');
    lines.push(`Generated,${new Date().toISOString()}`);
    lines.push('');
    lines.push('Zone,Name,Count,Capacity,Occupancy%,Status');
    for (const r of zoneRows) {
      lines.push(`${r.z.id},${r.z.name},${r.count},${r.z.capacity},${Math.round(r.pct)},${DENSITY_META[r.level].label}`);
    }
    lines.push('');
    lines.push(`Total Estimated People,${totalPeople}`);
    lines.push(`Total Capacity,${totalCapacity}`);
    lines.push('');
    lines.push('Alert History');
    lines.push('Time,Zone,Severity,Message,Status');
    for (const a of alerts) {
      lines.push(`${new Date(a.createdAt).toISOString()},${a.zoneId},${a.severity},"${a.message.replace(/"/g, '""')}",${a.status}`);
    }
    lines.push('');
    lines.push('Recommendations');
    lines.push('Time,From Zone,To Zone,Status,Reason');
    for (const r of recommendations) {
      lines.push(`${new Date(r.createdAt).toISOString()},${r.fromZoneId},${r.toZoneId},${r.status},"${r.reason.replace(/"/g, '""')}"`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crowdguard-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJSON() {
    const data = {
      generatedAt: new Date().toISOString(),
      summary: { totalPeople, totalCapacity, zones: zones.length, activeAlerts: alerts.filter(a => a.status === 'active').length },
      zones: zoneRows.map(r => ({ id: r.z.id, name: r.z.name, count: r.count, capacity: r.z.capacity, occupancyPct: Math.round(r.pct), status: DENSITY_META[r.level].label })),
      alerts,
      recommendations,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crowdguard-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const barData = zoneRows.map(r => ({ name: `Zone ${r.z.id}`, count: r.count, color: ZONE_COLORS[r.z.id] }));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Reports</h1>
          <p className="text-sm text-slate-400">Crowd statistics, alert history, and downloadable reports.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="btn-primary !text-xs">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={downloadJSON} className="btn-ghost !text-xs">
            <FileText className="h-3.5 w-3.5" /> JSON
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Zone Statistics" subtitle="Current occupancy and status" icon={BarChart3} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e6edf7' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-1.5 pr-3 font-medium">Zone</th>
                  <th className="py-1.5 pr-3 font-medium">Count</th>
                  <th className="py-1.5 pr-3 font-medium">Capacity</th>
                  <th className="py-1.5 pr-3 font-medium">Occ%</th>
                  <th className="py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {zoneRows.map(r => (
                  <tr key={r.z.id} className="border-t border-white/5">
                    <td className="py-1.5 pr-3 text-white">{r.z.id} – {r.z.name}</td>
                    <td className="py-1.5 pr-3 text-slate-200">{r.count.toLocaleString()}</td>
                    <td className="py-1.5 pr-3 text-slate-400">{r.z.capacity.toLocaleString()}</td>
                    <td className="py-1.5 pr-3 text-slate-200">{Math.round(r.pct)}%</td>
                    <td className="py-1.5">
                      <span className={cn('chip', DENSITY_META[r.level].bg, DENSITY_META[r.level].text)}>{DENSITY_META[r.level].label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Density Distribution" subtitle="Zones by safety status" icon={BarChart3} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e6edf7' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Alert History" subtitle={`${alerts.length} events recorded`} icon={AlertTriangle} />
        {alerts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No alerts recorded.</p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {alerts.map(a => (
              <div key={a.id} className="flex items-start justify-between gap-2 rounded-lg bg-navy-900/60 p-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className={cn('mt-0.5 h-3.5 w-3.5', a.severity === 'critical' ? 'text-crit-400' : a.severity === 'warning' ? 'text-warn-400' : 'text-accent-400')} />
                  <div>
                    <p className="text-xs text-slate-200">{a.message}</p>
                    <p className="text-[10px] text-slate-500">{formatDateTime(a.createdAt)}</p>
                  </div>
                </div>
                <span className={cn('chip', a.status === 'resolved' ? 'bg-safe-500/15 text-safe-400' : a.status === 'acknowledged' ? 'bg-warn-500/15 text-warn-400' : 'bg-crit-500/15 text-crit-400')}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Recommendation Log" subtitle={`${recommendations.length} total`} icon={Clock} />
        {recommendations.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No recommendations issued.</p>
        ) : (
          <div className="max-h-72 space-y-1.5 overflow-y-auto">
            {recommendations.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-navy-900/60 p-2.5 text-xs">
                <span className="text-slate-300">Zone {r.fromZoneId} → Zone {r.toZoneId} <span className="text-slate-500">· {timeAgo(r.createdAt)}</span></span>
                <span className={cn('chip', r.status === 'applied' ? 'bg-accent-500/15 text-accent-400' : r.status === 'approved' ? 'bg-safe-500/15 text-safe-400' : r.status === 'rejected' ? 'bg-crit-500/15 text-crit-400' : 'bg-warn-500/15 text-warn-400')}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
