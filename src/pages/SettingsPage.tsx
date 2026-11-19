import { useApp } from '@/context/AppContext';
import { Card, CardHeader } from '@/components/ui';
import { Settings as SettingsIcon, Save, RotateCcw, User, Gauge, Lightbulb, Sliders } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  const { zones, settings, updateSettings, setZoneCapacity, setZoneThreshold, resetConfig } = useApp();
  const [adminName, setAdminName] = useState(settings.admin.name);
  const [adminRole, setAdminRole] = useState(settings.admin.role);
  const [saved, setSaved] = useState(false);

  function saveAdmin() {
    updateSettings({ admin: { name: adminName || 'Administrator', role: adminRole || 'Event Safety Officer' } });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Configure zone capacities, alert thresholds, and monitoring behavior.</p>
        </div>
        <button onClick={resetConfig} className="btn-ghost !text-xs">
          <RotateCcw className="h-3.5 w-3.5" /> Reset All
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Admin profile */}
        <Card>
          <CardHeader title="Administrator Profile" subtitle="Displayed in the top bar" icon={User} />
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input value={adminName} onChange={e => setAdminName(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="label">Role</label>
              <input value={adminRole} onChange={e => setAdminRole(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white" />
            </div>
            <button onClick={saveAdmin} className="btn-primary !text-xs">
              <Save className="h-3.5 w-3.5" /> {saved ? 'Saved' : 'Save Profile'}
            </button>
          </div>
        </Card>

        {/* Simulation behavior */}
        <Card>
          <CardHeader title="Monitoring Behavior" subtitle="Simulation timing and automation" icon={Gauge} />
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Tick Interval</label>
                <span className="text-xs text-slate-300">{(settings.tickIntervalMs / 1000).toFixed(1)}s</span>
              </div>
              <input type="range" min={1000} max={8000} step={500} value={settings.tickIntervalMs} onChange={e => updateSettings({ tickIntervalMs: Number(e.target.value) })} className="mt-2 w-full" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Movement Rate</label>
                <span className="text-xs text-slate-300">{settings.movementRate} ppl/min</span>
              </div>
              <input type="range" min={4} max={40} step={2} value={settings.movementRate} onChange={e => updateSettings({ movementRate: Number(e.target.value) })} className="mt-2 w-full" />
            </div>
            <label className="flex items-center justify-between rounded-lg bg-navy-900/60 p-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent-400" />
                <div>
                  <div className="text-xs font-medium text-white">Auto-generate recommendations</div>
                  <div className="text-[10px] text-slate-400">Create redistribution advice when zones overcrowd</div>
                </div>
              </div>
              <button
                onClick={() => updateSettings({ autoRecommend: !settings.autoRecommend })}
                className={cn('relative h-6 w-11 rounded-full transition-colors', settings.autoRecommend ? 'bg-accent-500' : 'bg-navy-700')}
              >
                <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', settings.autoRecommend ? 'left-5.5' : 'left-0.5')} style={{ left: settings.autoRecommend ? '22px' : '2px' }} />
              </button>
            </label>
          </div>
        </Card>
      </div>

      {/* Zone configuration */}
      <Card>
        <CardHeader title="Zone Capacity & Thresholds" subtitle="Per-zone safety configuration" icon={Sliders} />
        <div className="grid gap-4 md:grid-cols-2">
          {zones.map(z => (
            <div key={z.id} className="rounded-xl border border-white/5 bg-navy-900/60 p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-xs font-bold text-white ring-1 ring-white/10">{z.id}</span>
                <div className="text-sm font-semibold text-white">{z.name}</div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <label className="label">Max Capacity</label>
                  <span className="text-xs text-slate-300">{z.capacity.toLocaleString()}</span>
                </div>
                <input type="range" min={100} max={3000} step={50} value={z.capacity} onChange={e => setZoneCapacity(z.id, Number(e.target.value))} className="mt-2 w-full" />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {(['yellow', 'orange', 'red'] as const).map(k => (
                  <div key={k}>
                    <div className="flex items-center justify-between">
                      <label className="label capitalize">{k}</label>
                      <span className="text-[11px] text-slate-300">{z.thresholds[k]}%</span>
                    </div>
                    <input type="range" min={30} max={99} value={z.thresholds[k]} onChange={e => setZoneThreshold(z.id, k, Number(e.target.value))} className="mt-1.5 w-full" />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-2 text-[10px]">
                <span className="chip bg-warn-500/15 text-warn-400">Moderate ≥ {z.thresholds.yellow}%</span>
                <span className="chip bg-high-500/15 text-high-400">High ≥ {z.thresholds.orange}%</span>
                <span className="chip bg-crit-500/15 text-crit-400">Overcrowding ≥ {z.thresholds.red}%</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-center text-[11px] text-slate-500">
        <SettingsIcon className="mr-1 inline h-3 w-3" /> Configuration is saved in your browser. Reset restores defaults.
      </p>
    </div>
  );
}
