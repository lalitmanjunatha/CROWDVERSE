import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, StatCard } from '@/components/ui';
import { ZoneMap } from '@/components/ZoneMap';
import { ZoneCard } from '@/components/ZoneCard';
import { SimulationControls } from '@/components/SimulationControls';
import { MovePeopleModal } from '@/components/MovePeopleModal';
import { densityLevel, occupancy, DENSITY_META } from '@/lib/density';
import { Radio, Users, AlertTriangle, Activity, Sliders, ArrowRightLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LiveMonitoringPage() {
  const { zones, counts } = useApp();
  // Two-click move flow: first click sets `from`, second click opens modal with `to`.
  const [fromZone, setFromZone] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const totalPeople = Object.values(counts).reduce((a, b) => a + b, 0);
  const overcrowded = zones.filter(z => densityLevel(counts[z.id] ?? 0, z) === 'red').length;
  const highCount = zones.filter(z => densityLevel(counts[z.id] ?? 0, z) === 'orange').length;
  const selZone = zones.find(z => z.id === selected);
  const fromZoneObj = zones.find(z => z.id === fromZone);

  function handleZoneClick(id: string) {
    setSelected(id);
    if (fromZone === null) {
      // first click — mark as source
      setFromZone(id);
    } else if (fromZone === id) {
      // clicked same zone — cancel selection
      setFromZone(null);
    } else {
      // second click on a different zone — open move modal
      setMoveTarget(id);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Live Monitoring</h1>
          <p className="text-sm text-slate-400">Zone-wise crowd density and occupancy in real time.</p>
        </div>
        {fromZone && (
          <div className="flex items-center gap-2 rounded-lg bg-accent-500/15 px-3 py-2 ring-1 ring-accent-500/30 animate-fade-in">
            <ArrowRightLeft className="h-4 w-4 text-accent-400" />
            <span className="text-xs text-accent-300">
              Source: <span className="font-semibold text-white">Zone {fromZone} – {fromZoneObj?.name}</span>. Click another zone to move people.
            </span>
            <button onClick={() => setFromZone(null)} className="ml-1 text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total People" value={totalPeople.toLocaleString()} icon={Users} tone="accent" />
        <StatCard label="Overcrowded Zones" value={overcrowded} icon={AlertTriangle} tone={overcrowded ? 'crit' : 'safe'} />
        <StatCard label="High-Density Zones" value={highCount} icon={Activity} tone={highCount ? 'high' : 'safe'} />
        <StatCard label="Monitored Zones" value={zones.length} icon={Radio} tone="default" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Interactive Zone Map"
            subtitle={fromZone ? 'Click another zone to shift people' : 'Click a zone to inspect; click a second zone to move people'}
            icon={Radio}
          />
          <ZoneMap onSelect={handleZoneClick} activeFrom={fromZone} />

          {selZone && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/5 bg-navy-900/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="label">Zone {selZone.id} – {selZone.name}</span>
                  <span className={cn('chip', DENSITY_META[densityLevel(counts[selZone.id] ?? 0, selZone)].bg, DENSITY_META[densityLevel(counts[selZone.id] ?? 0, selZone)].text)}>
                    {DENSITY_META[densityLevel(counts[selZone.id] ?? 0, selZone)].label}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-semibold text-white">{counts[selZone.id] ?? 0}</div>
                    <div className="text-[11px] text-slate-400">people</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-accent-400">{Math.round(occupancy(counts[selZone.id] ?? 0, selZone.capacity))}%</div>
                    <div className="text-[11px] text-slate-400">of {selZone.capacity.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <ZoneAdjuster zoneId={selZone.id} />
            </div>
          )}
        </Card>

        <SimulationControls />
      </div>

      <Card>
        <CardHeader title="All Zones" subtitle="Click a zone, then another, to move people between them" icon={Sliders} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map(z => (
            <ZoneCard
              key={z.id}
              zone={z}
              count={counts[z.id] ?? 0}
              onClick={() => handleZoneClick(z.id)}
              highlighted={fromZone === z.id}
            />
          ))}
        </div>
      </Card>

      <MovePeopleModal
        fromZoneId={fromZone}
        toZoneId={moveTarget}
        onClose={() => { setMoveTarget(null); setFromZone(null); }}
      />
    </div>
  );
}

function ZoneAdjuster({ zoneId }: { zoneId: string }) {
  const { counts, setZoneCount } = useApp();
  const count = counts[zoneId] ?? 0;
  return (
    <div className="rounded-lg border border-white/5 bg-navy-900/60 p-3">
      <div className="label mb-2">Adjust Crowd Count</div>
      <input
        type="range" min={0} max={2000} step={10}
        value={count}
        onChange={e => setZoneCount(zoneId, Number(e.target.value))}
        className="w-full"
      />
      <div className="mt-2 flex items-center justify-between">
        <button onClick={() => setZoneCount(zoneId, Math.max(0, count - 50))} className="btn-ghost !px-2.5 !py-1 !text-xs">-50</button>
        <span className="text-sm font-semibold text-white">{count.toLocaleString()}</span>
        <button onClick={() => setZoneCount(zoneId, count + 50)} className="btn-ghost !px-2.5 !py-1 !text-xs">+50</button>
      </div>
    </div>
  );
}
