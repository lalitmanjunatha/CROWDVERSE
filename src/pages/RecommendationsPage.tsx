import { useApp } from '@/context/AppContext';
import { Card, CardHeader, StatCard } from '@/components/ui';
import { occupancy } from '@/lib/density';
import { Lightbulb, ArrowRight, CheckCircle2, XCircle, Shuffle, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';

export function RecommendationsPage() {
  const { recommendations, zones, counts, approveRecommendation, rejectRecommendation, applyRecommendation, dismissRecommendation } = useApp();
  const pending = recommendations.filter(r => r.status === 'pending');
  const decided = recommendations.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">AI Recommendations</h1>
          <p className="text-sm text-slate-400">Advisory crowd redistribution suggestions. All actions require administrator approval.</p>
        </div>
        <span className="chip bg-warn-500/15 text-warn-400 ring-1 ring-warn-500/30">Advisory Only</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pending" value={pending.length} icon={Lightbulb} tone="warn" />
        <StatCard label="Approved" value={recommendations.filter(r => r.status === 'approved').length} icon={CheckCircle2} tone="safe" />
        <StatCard label="Applied" value={recommendations.filter(r => r.status === 'applied').length} icon={Shuffle} tone="accent" />
        <StatCard label="Rejected" value={recommendations.filter(r => r.status === 'rejected').length} icon={XCircle} tone="default" />
      </div>

      <Card>
        <CardHeader title="Pending Recommendations" subtitle="Awaiting administrator decision" icon={Lightbulb} />
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Sparkles className="h-7 w-7 text-safe-400" />
            <p className="text-sm text-slate-300">No pending recommendations.</p>
            <p className="text-xs text-slate-500">When zones become overcrowded, suggestions appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(r => {
              const from = zones.find(z => z.id === r.fromZoneId)!;
              const to = zones.find(z => z.id === r.toZoneId)!;
              const fromPct = Math.round(occupancy(counts[r.fromZoneId] ?? 0, from.capacity));
              const toPct = Math.round(occupancy(counts[r.toZoneId] ?? 0, to.capacity));
              return (
                <div key={r.id} className="rounded-xl border border-white/5 bg-navy-900/60 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="label">Current Situation</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-200">
                    Zone {from.id} – {from.name}: <span className="font-semibold text-crit-400">{fromPct}% occupancy</span>
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="label">AI Recommendation</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-200">
                    <span>Redirect incoming visitors towards</span>
                    <span className="font-semibold text-accent-400">Zone {to.id} – {to.name}</span>
                    <ArrowRight className="h-4 w-4 text-accent-400" />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg bg-navy-800/60 p-2.5">
                      <div className="label">Reason</div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{r.reason}</p>
                    </div>
                    <div className="rounded-lg bg-navy-800/60 p-2.5">
                      <div className="label">Expected Result</div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{r.expectedResult}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => applyRecommendation(r.id)} className="btn-primary !text-xs">
                      <Shuffle className="h-3.5 w-3.5" /> Approve & Apply
                    </button>
                    <button onClick={() => approveRecommendation(r.id)} className="btn-ghost !text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve Only
                    </button>
                    <button onClick={() => rejectRecommendation(r.id)} className="btn-ghost !text-xs">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button onClick={() => dismissRecommendation(r.id)} className="btn-ghost !text-xs ml-auto">Dismiss</button>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="h-3 w-3" /> {timeAgo(r.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {decided.length > 0 && (
        <Card>
          <CardHeader title="Decision History" subtitle="Previous recommendations" icon={CheckCircle2} />
          <div className="space-y-2">
            {decided.slice(0, 15).map(r => {
              const from = zones.find(z => z.id === r.fromZoneId);
              const to = zones.find(z => z.id === r.toZoneId);
              const statusCls = {
                approved: 'bg-safe-500/15 text-safe-400',
                rejected: 'bg-crit-500/15 text-crit-400',
                applied: 'bg-accent-500/15 text-accent-400',
                pending: '',
              } as const;
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-navy-900/60 p-2.5">
                  <div className="text-xs text-slate-300">
                    Zone {from?.id} → Zone {to?.id} <span className="text-slate-500">· {timeAgo(r.createdAt)}</span>
                  </div>
                  <span className={cn('chip', statusCls[r.status])}>{r.status}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
