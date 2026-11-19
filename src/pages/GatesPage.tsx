import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, StatCard } from '@/components/ui';
import { DensityBadge } from '@/components/Badges';
import { densityLevel, occupancy, DENSITY_META } from '@/lib/density';
import { DoorOpen, Lock, Unlock, AlertTriangle, ShieldCheck, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GateState } from '@/types';

export function GatesPage() {
  const { gates, gateStates, zones, counts, setGateState } = useApp();
  const [confirm, setConfirm] = useState<{ gateId: string; state: GateState } | null>(null);

  const openCount = gateStates.filter(g => g.state === 'open').length;
  const restricted = gateStates.filter(g => g.state === 'restricted').length;
  const closed = gateStates.filter(g => g.state === 'closed').length;

  function applyChange() {
    if (!confirm) return;
    setGateState(confirm.gateId, confirm.state);
    setConfirm(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-white">Gate Management</h1>
        <p className="text-sm text-slate-400">Simulated gate status and flow control. Advisory only — no physical gates are controlled.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-accent-500/10 px-3 py-2 ring-1 ring-accent-500/20">
        <ShieldCheck className="h-4 w-4 text-accent-400" />
        <span className="text-xs text-accent-300">SOFTWARE PROTOTYPE — Gate operations are simulated. Emergency exits can never be locked or disabled and always remain accessible.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Open Gates" value={openCount} icon={Unlock} tone="safe" />
        <StatCard label="Restricted" value={restricted} icon={DoorOpen} tone="warn" />
        <StatCard label="Closed" value={closed} icon={Lock} tone="default" />
        <StatCard label="Emergency Exits" value={gates.filter(g => g.isEmergency).length} sub="Always accessible" icon={ShieldCheck} tone="safe" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {gates.map(g => {
          const state = gateStates.find(s => s.id === g.id);
          const zone = zones.find(z => z.id === g.zoneId);
          const zoneCount = counts[g.zoneId] ?? 0;
          const level = zone ? densityLevel(zoneCount, zone) : 'green';
          const m = DENSITY_META[level];
          const cur = state?.state ?? 'open';

          const stateMeta = {
            open: { label: 'Open', cls: 'bg-safe-500/15 text-safe-400 ring-safe-500/30', icon: Unlock },
            closed: { label: 'Closed', cls: 'bg-crit-500/15 text-crit-400 ring-crit-500/30', icon: Lock },
            restricted: { label: 'Restricted', cls: 'bg-warn-500/15 text-warn-400 ring-warn-500/30', icon: DoorOpen },
          } as const;
          const sm = stateMeta[cur];
          const StateIcon = sm.icon;

          return (
            <Card key={g.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn('grid h-10 w-10 place-items-center rounded-lg ring-1', g.isEmergency ? 'bg-crit-500/15 ring-crit-500/30' : 'bg-white/5 ring-white/10')}>
                    {g.isEmergency ? <AlertCircle className="h-5 w-5 text-crit-400" /> : <DoorOpen className="h-5 w-5 text-accent-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{g.name}</div>
                    <div className="text-[11px] text-slate-400">Links to Zone {g.zoneId} – {zone?.name}</div>
                  </div>
                </div>
                <span className={cn('chip ring-1', sm.cls)}>
                  <StateIcon className="h-3.5 w-3.5" /> {sm.label}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-navy-900/60 p-2.5">
                  <div className="label">Nearby Crowd</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">{zoneCount.toLocaleString()}</span>
                    <DensityBadge level={level} />
                  </div>
                </div>
                <div className="rounded-lg bg-navy-900/60 p-2.5">
                  <div className="label">Flow Capacity</div>
                  <div className="mt-0.5 text-lg font-semibold text-white">
                    {cur === 'open' ? '100%' : cur === 'restricted' ? '35%' : '0%'}
                  </div>
                </div>
              </div>

              {g.isEmergency ? (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-safe-500/10 px-3 py-2 ring-1 ring-safe-500/20">
                  <ShieldCheck className="h-4 w-4 text-safe-400" />
                  <span className="text-xs text-safe-300">Emergency exit — permanently open. Cannot be locked or restricted.</span>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setConfirm({ gateId: g.id, state: 'open' })}
                    disabled={cur === 'open'}
                    className="btn-ghost flex-1 !py-1.5 !text-xs disabled:opacity-30"
                  >
                    <Unlock className="h-3.5 w-3.5" /> Open
                  </button>
                  <button
                    onClick={() => setConfirm({ gateId: g.id, state: 'restricted' })}
                    disabled={cur === 'restricted'}
                    className="btn-ghost flex-1 !py-1.5 !text-xs disabled:opacity-30"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" /> Restrict
                  </button>
                  <button
                    onClick={() => setConfirm({ gateId: g.id, state: 'closed' })}
                    disabled={cur === 'closed'}
                    className="btn-ghost flex-1 !py-1.5 !text-xs disabled:opacity-30"
                  >
                    <Lock className="h-3.5 w-3.5" /> Close
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-navy-850 p-5 shadow-card" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-warn-400" />
              <h3 className="text-sm font-semibold text-white">Confirm Gate Change</h3>
            </div>
            <p className="mt-3 text-xs text-slate-300">
              Simulated operation: set <span className="font-semibold text-white">{gates.find(g => g.id === confirm.gateId)?.name}</span> to{' '}
              <span className="font-semibold text-accent-400">{confirm.state}</span>. This affects simulated crowd flow only — no physical gate is controlled.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={applyChange} className="btn-primary flex-1">Confirm</button>
              <button onClick={() => setConfirm(null)} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
