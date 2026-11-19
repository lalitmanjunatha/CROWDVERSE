import {
  ScanSearch, Layers, BarChart3, TrendingUp, BellRing, Lightbulb,
  UserCheck, CheckCircle2, Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowStage } from '@/types';

const STAGES: { key: WorkflowStage; label: string; icon: typeof ScanSearch; desc: string }[] = [
  { key: 'detection', label: 'Object Detection', icon: ScanSearch, desc: 'Estimate people in the area' },
  { key: 'classification', label: 'Zone Classification', icon: Layers, desc: 'Assign detections to zones' },
  { key: 'analysis', label: 'Crowd Analysis', icon: BarChart3, desc: 'Compute occupancy & density' },
  { key: 'prediction', label: 'Prediction', icon: TrendingUp, desc: 'Forecast overcrowding' },
  { key: 'alert', label: 'Alert Generation', icon: BellRing, desc: 'Flag zones needing attention' },
  { key: 'recommendation', label: 'AI Recommendation', icon: Lightbulb, desc: 'Suggest safer distribution' },
  { key: 'admin', label: 'Administrator Action', icon: UserCheck, desc: 'Approve or reject advice' },
  { key: 'verification', label: 'Verification', icon: CheckCircle2, desc: 'Confirm improvement' },
  { key: 'repeat', label: 'Repeat Monitoring', icon: Repeat, desc: 'Continue the loop' },
];

export function WorkflowTracker({ stage, compact }: { stage: number; compact?: boolean }) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1', compact ? 'flex-nowrap' : 'flex-nowrap')}>
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        const done = i < stage;
        const active = i === stage;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 ring-1 transition-all',
                active && 'bg-accent-500/15 ring-accent-500/40',
                done && 'bg-safe-500/10 ring-safe-500/20',
                !active && !done && 'bg-white/5 ring-white/5'
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-accent-400' : done ? 'text-safe-400' : 'text-slate-500')} />
              <div className="leading-tight">
                <div className={cn('text-xs font-medium', active ? 'text-white' : done ? 'text-slate-200' : 'text-slate-400')}>
                  {i + 1}. {s.label}
                </div>
                {!compact && <div className="text-[10px] text-slate-500">{s.desc}</div>}
              </div>
            </div>
            {i < STAGES.length - 1 && <div className={cn('h-px w-4', done ? 'bg-safe-500/40' : 'bg-white/10')} />}
          </div>
        );
      })}
    </div>
  );
}
