import { useApp } from '@/context/AppContext';
import { Card, CardHeader, StatCard } from '@/components/ui';
import { timeToCapacity } from '@/lib/recommend';
import { densityLevel, occupancy, DENSITY_META } from '@/lib/density';
import { TrendingUp, AlertTriangle, Clock, Activity, ArrowUpRight } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, Cell,
  Area, AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils';

const ZONE_COLORS: Record<string, string> = {
  A: '#38bdf8', B: '#34d399', C: '#fbbf24', D: '#fb923c', E: '#a78bfa', F: '#f472b6',
};

export function PredictionPage() {
  const { zones, counts, history } = useApp();

  const historyData = history.slice(-20).map(h => {
    const row: any = { time: new Date(h.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
    for (const z of zones) row[`Z${z.id}`] = h.values[z.id] ?? 0;
    return row;
  });

  // per-zone trend + time-to-capacity
  const predictions = zones.map(z => {
    const series = history.map(h => ({ t: h.t, value: h.values[z.id] ?? 0 }));
    const ttc = timeToCapacity(series, z.capacity);
    const last = series[series.length - 1]?.value ?? 0;
    const first = series[0]?.value ?? 0;
    const trend = last - first;
    const pct = occupancy(counts[z.id] ?? 0, z.capacity);
    const level = densityLevel(counts[z.id] ?? 0, z);
    return { z, ttc, trend, pct, level };
  });

  const building = predictions.filter(p => p.ttc !== null && p.ttc < 60).sort((a, b) => (a.ttc ?? 999) - (b.ttc ?? 999));

  // predicted vs current bar
  const compareData = zones.map(z => {
    const series = history.map(h => ({ t: h.t, value: h.values[z.id] ?? 0 }));
    const ttc = timeToCapacity(series, z.capacity);
    const cur = counts[z.id] ?? 0;
    const projected = ttc !== null ? Math.min(z.capacity, cur + Math.max(1, Math.round((cur - (series[0]?.value ?? cur)) * 2))) : cur;
    return { name: `Zone ${z.id}`, current: cur, projected, color: ZONE_COLORS[z.id] };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Crowd Prediction</h1>
          <p className="text-sm text-slate-400">Trend analysis and early warnings for potential overcrowding.</p>
        </div>
        <span className="chip bg-warn-500/15 text-warn-400 ring-1 ring-warn-500/30">Simulated Prediction</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Zones Building Up" value={building.length} sub="Reaching capacity < 60min" icon={ArrowUpRight} tone={building.length ? 'high' : 'safe'} />
        <StatCard label="Critical Predictions" value={predictions.filter(p => p.ttc !== null && p.ttc < 20).length} sub="< 20 min to capacity" icon={AlertTriangle} tone="crit" />
        <StatCard label="Stable Zones" value={predictions.filter(p => p.ttc === null).length} sub="No upward trend detected" icon={Activity} tone="safe" />
        <StatCard label="Data Points" value={history.length} sub="History samples" icon={Clock} tone="default" />
      </div>

      {/* Build-up warnings */}
      <Card>
        <CardHeader title="Potential Crowd Build-Up" subtitle="Zones trending toward capacity (simulated linear projection)" icon={TrendingUp} />
        {building.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Activity className="h-7 w-7 text-safe-400" />
            <p className="text-sm text-slate-300">No zones currently trending toward capacity.</p>
            <p className="text-xs text-slate-500">Run the simulation longer or add crowd to see predictions.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {building.map(p => (
              <div key={p.z.id} className={cn('flex items-center justify-between rounded-lg border p-3', p.ttc! < 20 ? 'border-crit-500/30 bg-crit-500/10' : 'border-high-500/30 bg-high-500/10')}>
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-white/5 text-sm font-bold text-white">{p.z.id}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{p.z.name}</div>
                    <div className="text-[11px] text-slate-400">{Math.round(p.pct)}% occupancy · trend +{p.trend} people</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn('text-lg font-semibold', p.ttc! < 20 ? 'text-crit-400' : 'text-high-400')}>~{p.ttc} min</div>
                  <div className="text-[11px] text-slate-400">to capacity</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Crowd over time per zone */}
      <Card>
        <CardHeader title="Crowd Count Over Time" subtitle="Per-zone history (simulated)" icon={Activity} />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e6edf7' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {zones.map(z => (
                <Line key={z.id} type="monotone" dataKey={`Z${z.id}`} stroke={ZONE_COLORS[z.id]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* distribution */}
        <Card>
          <CardHeader title="Zone-Wise Distribution" subtitle="Current crowd per zone" icon={Activity} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones.map(z => ({ name: `Zone ${z.id}`, count: counts[z.id] ?? 0, color: ZONE_COLORS[z.id] }))} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e6edf7' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {zones.map(z => <Cell key={z.id} fill={ZONE_COLORS[z.id]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* predicted vs current */}
        <Card>
          <CardHeader title="Predicted vs Current" subtitle="Short-term projection (simulated)" icon={TrendingUp} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={compareData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e6edf7' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="current" stroke="#38bdf8" fill="#38bdf833" strokeWidth={2} />
                <Area type="monotone" dataKey="projected" stroke="#fb923c" fill="#fb923c33" strokeWidth={2} strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
