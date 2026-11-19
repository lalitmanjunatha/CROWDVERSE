import { cn } from '@/lib/utils';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('card p-4 md:p-5', className)}>{children}</div>;
}

export function CardHeader({
  title, subtitle, icon: Icon, right,
}: {
  title: string;
  subtitle?: string;
  icon?: typeof import('lucide-react').Activity;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-accent-400 ring-1 ring-white/5">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function StatCard({
  label, value, sub, icon: Icon, tone = 'default',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: typeof import('lucide-react').Activity;
  tone?: 'default' | 'accent' | 'safe' | 'warn' | 'high' | 'crit';
}) {
  const tones = {
    default: 'text-accent-400',
    accent: 'text-accent-400',
    safe: 'text-safe-400',
    warn: 'text-warn-400',
    high: 'text-high-400',
    crit: 'text-crit-400',
  } as const;
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {Icon && <Icon className={cn('h-4 w-4', tones[tone])} />}
      </div>
      <div className="mt-2 stat-num">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ pct, level }: { pct: number; level: 'green' | 'yellow' | 'orange' | 'red' }) {
  const colors = { green: 'bg-safe-400', yellow: 'bg-warn-400', orange: 'bg-high-400', red: 'bg-crit-500' };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-navy-700">
      <div
        className={cn('h-full rounded-full transition-all duration-500', colors[level])}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

export function EmptyState({ title, sub, icon: Icon }: { title: string; sub?: string; icon?: typeof import('lucide-react').Activity }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      {Icon && <Icon className="h-8 w-8 text-slate-600" />}
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {sub && <p className="max-w-xs text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-base font-semibold text-white', className)}>{children}</h2>;
}
