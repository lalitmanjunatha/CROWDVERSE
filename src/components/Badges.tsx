import type { DensityLevel } from '@/types';
import { DENSITY_META } from '@/lib/density';
import { cn } from '@/lib/utils';

export function DensityBadge({ level, className }: { level: DensityLevel; className?: string }) {
  const m = DENSITY_META[level];
  return (
    <span className={cn('chip', m.bg, m.text, 'ring-1', m.ring, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: 'info' | 'warning' | 'critical' }) {
  const map = {
    info: { label: 'Informational', cls: 'bg-accent-500/15 text-accent-400 ring-accent-500/30' },
    warning: { label: 'Warning', cls: 'bg-warn-500/15 text-warn-400 ring-warn-500/30' },
    critical: { label: 'Critical', cls: 'bg-crit-500/15 text-crit-400 ring-crit-500/40' },
  } as const;
  const m = map[severity];
  return <span className={cn('chip ring-1', m.cls)}>{m.label}</span>;
}

export function StatusDot({ active, label }: { active: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn('h-2 w-2 rounded-full', active ? 'bg-safe-400 animate-pulse-soft' : 'bg-slate-500')} />
      {label && <span className="text-xs text-slate-300">{label}</span>}
    </span>
  );
}
