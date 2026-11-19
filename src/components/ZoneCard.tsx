import type { ZoneConfig } from '@/types';
import { densityLevel, occupancy, DENSITY_META } from '@/lib/density';
import { cn } from '@/lib/utils';
import { DensityBadge } from './Badges';
import { ProgressBar } from './ui';

export function ZoneCard({
  zone, count, onClick, compact, highlighted,
}: {
  zone: ZoneConfig;
  count: number;
  onClick?: () => void;
  compact?: boolean;
  highlighted?: boolean;
}) {
  const pct = occupancy(count, zone.capacity);
  const level = densityLevel(count, zone.capacity >= 0 ? zone : zone);
  const m = DENSITY_META[level];
  const avail = Math.max(0, zone.capacity - count);

  return (
    <button
      onClick={onClick}
      className={cn(
        'card group relative w-full overflow-hidden p-4 text-left transition-all hover:ring-1 hover:ring-white/10',
        level === 'red' && 'ring-1 ring-crit-500/40',
        level === 'orange' && 'ring-1 ring-high-500/30',
        highlighted && 'ring-2 ring-accent-400 shadow-[0_0_24px_-6px_rgba(56,189,248,0.7)]'
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-0.5', highlighted ? 'bg-accent-400' : m.dot)} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-white/5 text-xs font-bold text-white ring-1 ring-white/10">
              {zone.id}
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">{zone.name}</div>
              {!compact && <div className="text-[11px] text-slate-400">Capacity {zone.capacity.toLocaleString()}</div>}
            </div>
          </div>
        </div>
        <DensityBadge level={level} />
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-white">{count.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400">people</div>
        </div>
        <div className="text-right">
          <div className={cn('text-lg font-semibold', m.text)}>{Math.round(pct)}%</div>
          <div className="text-[11px] text-slate-400">{avail.toLocaleString()} free</div>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar pct={pct} level={level} />
      </div>
    </button>
  );
}
