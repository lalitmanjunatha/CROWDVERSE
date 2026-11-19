import { useApp } from '@/context/AppContext';
import { densityLevel, occupancy, DENSITY_META } from '@/lib/density';
import { cn } from '@/lib/utils';

export function ZoneMap({ onSelect, activeFrom }: { onSelect?: (zoneId: string) => void; activeFrom?: string | null }) {
  const { zones, counts } = useApp();

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/5 bg-grid bg-navy-900">
      {/* radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.08),transparent_60%)]" />

      {/* connecting lines */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="link" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(56,189,248,0.05)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.25)" />
          </linearGradient>
        </defs>
        {zones.map((a, i) =>
          zones.slice(i + 1).map(b => (
            <line
              key={`${a.id}-${b.id}`}
              x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`}
              stroke="url(#link)" strokeWidth="1" strokeDasharray="3 4"
            />
          ))
        )}
      </svg>

      {zones.map(z => {
        const count = counts[z.id] ?? 0;
        const level = densityLevel(count, z);
        const m = DENSITY_META[level];
        const pct = occupancy(count, z.capacity);
        return (
          <button
            key={z.id}
            onClick={() => onSelect?.(z.id)}
            className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
            style={{ left: `${z.x}%`, top: `${z.y}%` }}
          >
            <div className={cn('relative grid place-items-center rounded-xl px-3 py-2 ring-1 transition-all group-hover:scale-105', m.bg, m.ring, activeFrom === z.id && 'ring-2 ring-accent-400 shadow-[0_0_20px_-4px_rgba(56,189,248,0.8)]')}>
              {level === 'red' && <div className="absolute inset-0 rounded-xl ring-2 ring-crit-500/60 animate-pulse-soft" />}
              {activeFrom === z.id && <div className="absolute -top-1.5 -right-1.5 grid h-4 w-4 place-items-center rounded-full bg-accent-500 text-[9px] font-bold text-white shadow">1</div>}
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', m.dot)} />
                <span className="text-xs font-bold text-white">Zone {z.id}</span>
              </div>
              <div className="text-[10px] text-slate-300">{z.shortName}</div>
              <div className={cn('text-sm font-semibold', m.text)}>{Math.round(pct)}%</div>
            </div>
          </button>
        );
      })}

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-3 rounded-lg bg-navy-950/70 px-3 py-2 backdrop-blur">
        {(['green', 'yellow', 'orange', 'red'] as const).map(l => (
          <div key={l} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', DENSITY_META[l].dot)} />
            <span className="text-[10px] text-slate-300">{DENSITY_META[l].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
