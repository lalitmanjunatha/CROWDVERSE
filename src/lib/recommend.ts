import type { Recommendation, ZoneConfig, ZoneState } from '@/types';
import { occupancy, densityLevel, DENSITY_META } from './density';

/**
 * Generate advisory recommendations to redistribute crowd from overcrowded
 * (or near-overcrowded) zones toward zones with sufficient available capacity.
 * Pure function — no side effects. Driven by the live simulation state.
 */
export function generateRecommendations(
  zones: ZoneConfig[],
  state: Record<string, number>,
  existing: Recommendation[]
): Recommendation[] {
  const recent = new Set(existing.filter(r => r.status === 'pending' || r.status === 'approved').map(r => `${r.fromZoneId}->${r.toZoneId}`));
  const out: Recommendation[] = [];

  const crowded = zones
    .map(z => ({ z, pct: occupancy(state[z.id] ?? 0, z.capacity), level: densityLevel(state[z.id] ?? 0, z) }))
    .filter(x => x.level === 'red' || x.level === 'orange')
    .sort((a, b) => b.pct - a.pct);

  const targets = zones
    .map(z => ({ z, pct: occupancy(state[z.id] ?? 0, z.capacity), avail: z.capacity - (state[z.id] ?? 0) }))
    .filter(x => x.pct < 60 && x.avail > 50)
    .sort((a, b) => a.pct - b.pct);

  for (const c of crowded) {
    const best = targets.find(t => t.z.id !== c.z.id && !recent.has(`${c.z.id}->${t.z.id}`));
    if (!best) continue;
    out.push({
      id: `rec-${c.z.id}-${best.z.id}-${Date.now()}`,
      fromZoneId: c.z.id,
      toZoneId: best.z.id,
      reason: `${best.z.name} currently has ${Math.round(100 - best.pct)}% available capacity (≈${best.avail} spots). ${c.z.name} is at ${Math.round(c.pct)}% occupancy (${DENSITY_META[c.level].label}).`,
      expectedResult: `Reduced crowd concentration in ${c.z.name}, easing pressure toward ${DENSITY_META[c.level].label.toLowerCase()} status.`,
      createdAt: Date.now(),
      status: 'pending',
    });
    recent.add(`${c.z.id}->${best.z.id}`);
  }
  return out;
}

/**
 * Estimate time-to-capacity (in minutes) for a zone given a recent trend.
 * Returns null if insufficient or non-increasing data.
 */
export function timeToCapacity(
  history: { t: number; value: number }[],
  capacity: number
): number | null {
  if (history.length < 3) return null;
  const recent = history.slice(-6);
  // linear regression slope (people per ms)
  const n = recent.length;
  const sx = recent.reduce((s, p) => s + p.t, 0);
  const sy = recent.reduce((s, p) => s + p.value, 0);
  const sxx = recent.reduce((s, p) => s + p.t * p.t, 0);
  const sxy = recent.reduce((s, p) => s + p.t * p.value, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom; // people per ms
  if (slope <= 0) return null;
  const last = recent[recent.length - 1];
  const remaining = capacity - last.value;
  if (remaining <= 0) return 0;
  const ms = remaining / slope;
  const minutes = ms / 60000;
  return minutes > 0 && minutes < 240 ? Math.round(minutes) : null;
}
