import { Play, Pause, RotateCcw, Plus, ArrowRightLeft, Gauge } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function SimulationControls() {
  const { zones, counts, running, start, pause, reset, influx, movePeople, settings, updateSettings } = useApp();
  const [influxZone, setInfluxZone] = useState(zones[0]?.id ?? 'A');
  const [influxAmt, setInfluxAmt] = useState(150);
  const [moveFrom, setMoveFrom] = useState(zones[0]?.id ?? 'A');
  const [moveTo, setMoveTo] = useState(zones[1]?.id ?? 'B');
  const [moveAmt, setMoveAmt] = useState(80);

  return (
    <div className="card space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-accent-400" />
        <h3 className="text-sm font-semibold text-white">Simulation Controls</h3>
        <span className="ml-auto chip bg-warn-500/15 text-warn-400 ring-1 ring-warn-500/30">Demo Simulation</span>
      </div>

      <div className="flex gap-2">
        {running ? (
          <button onClick={pause} className="btn-ghost flex-1">
            <Pause className="h-4 w-4" /> Pause
          </button>
        ) : (
          <button onClick={start} className="btn-primary flex-1">
            <Play className="h-4 w-4" /> Start
          </button>
        )}
        <button onClick={reset} className="btn-ghost">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>

      <div className="space-y-2">
        <div className="label">Simulation Speed</div>
        <input
          type="range" min={1000} max={8000} step={500}
          value={settings.tickIntervalMs}
          onChange={e => updateSettings({ tickIntervalMs: Number(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Fast (1s)</span><span>Tick every {(settings.tickIntervalMs / 1000).toFixed(1)}s</span><span>Slow (8s)</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="label">Sudden Crowd Increase</div>
        <div className="flex gap-2">
          <select value={influxZone} onChange={e => setInfluxZone(e.target.value)} className="flex-1 rounded-lg border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white">
            {zones.map(z => <option key={z.id} value={z.id}>Zone {z.id} – {z.name}</option>)}
          </select>
          <input type="number" value={influxAmt} onChange={e => setInfluxAmt(Number(e.target.value))} className="w-20 rounded-lg border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white" />
          <button onClick={() => influx(influxZone, influxAmt)} className="btn-ghost !px-2.5" title="Add people">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="label">Manual Crowd Movement</div>
        <div className="flex flex-wrap gap-2">
          <select value={moveFrom} onChange={e => setMoveFrom(e.target.value)} className="flex-1 rounded-lg border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white">
            {zones.map(z => <option key={z.id} value={z.id}>From Zone {z.id}</option>)}
          </select>
          <select value={moveTo} onChange={e => setMoveTo(e.target.value)} className="flex-1 rounded-lg border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white">
            {zones.map(z => <option key={z.id} value={z.id}>To Zone {z.id}</option>)}
          </select>
          <input type="number" value={moveAmt} onChange={e => setMoveAmt(Number(e.target.value))} className="w-20 rounded-lg border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white" />
          <button onClick={() => movePeople(moveFrom, moveTo, moveAmt)} className="btn-ghost !px-2.5" title="Move people">
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 rounded-lg bg-navy-900/60 p-2.5">
        <div className="label">Live Zone Counts</div>
        <div className="grid grid-cols-3 gap-1.5">
          {zones.map(z => (
            <div key={z.id} className={cn('rounded-md px-2 py-1 text-[11px]')}>
              <div className="text-slate-400">Zone {z.id}</div>
              <div className="font-semibold text-white">{(counts[z.id] ?? 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
