import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { occupancy, densityLevel, DENSITY_META } from '@/lib/density';
import { ArrowRight, ArrowRightLeft, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal that asks the admin how many people to move from one zone to another.
 * Triggered by the two-click zone flow on Live Monitoring.
 */
export function MovePeopleModal({
  fromZoneId,
  toZoneId,
  onClose,
}: {
  fromZoneId: string | null;
  toZoneId: string | null;
  onClose: () => void;
}) {
  const { zones, counts, movePeople } = useApp();
  const [amount, setAmount] = useState(0);
  const [moved, setMoved] = useState(false);

  const from = zones.find(z => z.id === fromZoneId);
  const to = zones.find(z => z.id === toZoneId);
  const fromCount = fromZoneId ? (counts[fromZoneId] ?? 0) : 0;
  const toAvail = to ? Math.max(0, to.capacity - (counts[to.id] ?? 0)) : 0;

  useEffect(() => {
    // default suggestion: 20% of source, capped by target's free capacity
    if (from && to) {
      const suggested = Math.min(Math.round(fromCount * 0.2), toAvail, fromCount);
      setAmount(Math.max(0, suggested));
      setMoved(false);
    }
  }, [fromZoneId, toZoneId]);

  if (!from || !to || !toZoneId) return null;

  function confirm() {
    movePeople(from!.id, to!.id, amount);
    setMoved(true);
    setTimeout(onClose, 900);
  }

  const maxMove = Math.min(fromCount, to.capacity - (counts[to.id] ?? 0));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-navy-850 p-5 shadow-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-500/15 text-accent-400 ring-1 ring-accent-500/30">
              <ArrowRightLeft className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-sm font-semibold text-white">Shift People Between Zones</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* From → To summary */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-white/5 bg-navy-900/60 p-3">
            <div className="label">From</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-xs font-bold text-white">{from.id}</span>
              <span className="text-sm font-medium text-white">{from.name}</span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-400">
              <Users className="mr-1 inline h-3 w-3" />{fromCount.toLocaleString()} people
            </div>
          </div>
          <ArrowRight className="h-5 w-5 flex-shrink-0 text-accent-400" />
          <div className="flex-1 rounded-lg border border-white/5 bg-navy-900/60 p-3">
            <div className="label">To</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-xs font-bold text-white">{to.id}</span>
              <span className="text-sm font-medium text-white">{to.name}</span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-400">
              {toAvail.toLocaleString()} spots available
            </div>
          </div>
        </div>

        {/* Amount selector */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="label">People to move</label>
            <span className="text-sm font-semibold text-accent-400">{amount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(1, maxMove)}
            step={5}
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={maxMove}
              value={amount}
              onChange={e => setAmount(Math.max(0, Math.min(maxMove, Number(e.target.value))))}
              className="w-28 rounded-lg border border-white/10 bg-navy-800 px-2.5 py-1.5 text-sm text-white"
            />
            <div className="flex flex-wrap gap-1.5">
              {[0.1, 0.25, 0.5].map(frac => (
                <button
                  key={frac}
                  onClick={() => setAmount(Math.max(0, Math.min(maxMove, Math.round(fromCount * frac))))}
                  className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
                >
                  {frac * 100}%
                </button>
              ))}
              <button
                onClick={() => setAmount(Math.max(0, maxMove))}
                className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/10"
              >
                Max
              </button>
            </div>
          </div>
          {maxMove <= 0 && (
            <p className="mt-2 text-[11px] text-warn-400">Either the source zone is empty or the target zone is at capacity.</p>
          )}
        </div>

        {/* Resulting states */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-navy-900/60 p-2.5">
            <div className="label">After: Zone {from.id}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{Math.max(0, fromCount - amount).toLocaleString()}</span>
              <DensityPill zoneId={from.id} count={Math.max(0, fromCount - amount)} />
            </div>
          </div>
          <div className="rounded-lg bg-navy-900/60 p-2.5">
            <div className="label">After: Zone {to.id}</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">{((counts[to.id] ?? 0) + amount).toLocaleString()}</span>
              <DensityPill zoneId={to.id} count={(counts[to.id] ?? 0) + amount} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <button onClick={confirm} disabled={amount <= 0 || moved} className="btn-primary flex-1">
            <ArrowRightLeft className="h-4 w-4" /> {moved ? 'Moved' : 'Confirm Move'}
          </button>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DensityPill({ zoneId, count }: { zoneId: string; count: number }) {
  const { zones } = useApp();
  const z = zones.find(zz => zz.id === zoneId);
  if (!z) return null;
  const level = densityLevel(count, z);
  const m = DENSITY_META[level];
  return (
    <span className={cn('chip', m.bg, m.text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {Math.round(occupancy(count, z.capacity))}%
    </span>
  );
}
