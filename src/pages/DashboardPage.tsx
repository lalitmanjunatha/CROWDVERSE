import { useApp } from '@/context/AppContext';
import { Card, CardHeader, StatCard } from '@/components/ui';
import { ZoneMap } from '@/components/ZoneMap';
import { ZoneCard } from '@/components/ZoneCard';
import { SimulationControls } from '@/components/SimulationControls';
import { WorkflowTracker } from '@/components/WorkflowTracker';
import { AlertList } from '@/components/AlertList';
import { densityLevel, occupancy } from '@/lib/density';
import { Users, AlertTriangle, LayoutGrid, DoorOpen, Activity, Radio, Lightbulb, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts';

const ZONE_COLORS: Record<string, string> = {
  A: '#38bdf8', B: '#34d399', C: '#fbbf24', D: '#fb923c', E: '#a78bfa', F: '#f472b6',
};

export function DashboardPage() {
  const { zones, counts, alerts, recommendations, history, workflowStage, acknowledgeAlert, resolveAlert } = useApp();
  const totalPeople = Object.values(counts).reduce((a, b) => a + b, 0);
  const overcrowded = zones.filter(z => densityLevel(counts[z.id] ?? 0, z) === 'red').length;
  const activeAlerts = alerts.filter(a => a.status === 'active').length;
  const totalCapacity = zones.reduce((a, z) => a + z.capacity, 0);
  const availCapacity = Math.max(0, totalCapacity - totalPeople);
  const pendingRecs = recommendations.filter(r => r.status === 'pending').length;

  const trendData = history.slice(-20).map(h => ({
    time: new Date(h.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    total: Object.values(h.values).reduce((a, b) => a + b, 0),
  }));

  const distributionData = zones.map(z => ({
    name: `Zone ${z.id}`,
    pct: Math.round(occupancy(counts[z.id] ?? 0, z.capacity)),
    color: ZONE_COLORS[z.id],
  }));

  const recentAlerts = alerts.slice(0, 4);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Operations Dashboard</h1>
        <p className="text-sm text-slate-400">Real-time overview of crowd safety across all monitored zones.</p>
      </div>

      {/* Workflow tracker */}
      <Card>
        <CardHeader title="Automated Workflow Engine" subtitle="Object detection → counting → monitoring → prediction → alerts → recommendations → admin → verification → repeat" icon={Activity} />
        <WorkflowTracker stage={workflowStage} />
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total People" value={totalPeople.toLocaleString()} sub="Estimated across zones" icon={Users} tone="accent" />
        <StatCard label="Monitored Zones" value={zones.length} sub="All operational" icon={LayoutGrid} tone="default" />
        <StatCard label="Overcrowded" value={overcrowded} sub={overcrowded ? 'Needs attention' : 'Within limits'} icon={AlertTriangle} tone={overcrowded ? 'crit' : 'safe'} />
        <StatCard label="Active Alerts" value={activeAlerts} sub={`${pendingRecs} pending recommendations`} icon={Radio} tone={activeAlerts ? 'crit' : 'safe'} />
        <StatCard label="Available Capacity" value={availCapacity.toLocaleString()} sub={`of ${totalCapacity.toLocaleString()} total`} icon={DoorOpen} tone="safe" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Map */}
        <Card className="lg:col-span-2">
          <CardHeader title="Live Crowd Monitoring Map" subtitle="Zone occupancy & density status" icon={Radio} />
          <ZoneMap />
        </Card>

        {/* Simulation controls */}
        <SimulationControls />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Trend */}
        <Card className="lg:col-span-2">
          <CardHeader title="Total Crowd Over Time" subtitle="Estimated people across all zones" icon={TrendingUp} />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e6edf7' }} />
                <Area type="monotone" dataKey="total" stroke="#38bdf8" strokeWidth={2} fill="url(#totalGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribution */}
        <Card>
          <CardHeader title="Zone Occupancy" subtitle="Percentage of capacity" icon={LayoutGrid} />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0e1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#e6edf7' }} />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {distributionData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Zone cards */}
        <Card className="lg:col-span-2">
          <CardHeader title="Zone-Wise Occupancy" subtitle="Live crowd density per zone" icon={LayoutGrid} />
          <div className="grid gap-3 sm:grid-cols-2">
            {zones.map(z => <ZoneCard key={z.id} zone={z} count={counts[z.id] ?? 0} />)}
          </div>
        </Card>

        {/* Recent alerts */}
        <Card>
          <CardHeader title="Recent Alerts" subtitle="Latest overcrowding events" icon={AlertTriangle} />
          <AlertList alerts={recentAlerts} onAck={acknowledgeAlert} onResolve={resolveAlert} compact />
        </Card>
      </div>

      {/* Recommendations preview */}
      {recommendations.filter(r => r.status === 'pending').length > 0 && (
        <Card>
          <CardHeader title="Latest AI Recommendations" subtitle="Advisory — requires administrator approval" icon={Lightbulb} />
          <div className="space-y-2">
            {recommendations.filter(r => r.status === 'pending').slice(0, 2).map(r => {
              const from = zones.find(z => z.id === r.fromZoneId);
              const to = zones.find(z => z.id === r.toZoneId);
              return (
                <div key={r.id} className="rounded-lg border border-white/5 bg-navy-900/60 p-3">
                  <p className="text-xs text-slate-200">
                    Redirect incoming visitors from <span className="font-semibold text-white">Zone {from?.id} – {from?.name}</span> toward <span className="font-semibold text-accent-400">Zone {to?.id} – {to?.name}</span>.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">{r.reason}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
