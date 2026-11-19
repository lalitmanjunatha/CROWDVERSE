import type { GateConfig, GateStateRow, ZoneConfig } from '@/types';

/**
 * Advance the simulation by one tick.
 * - Moves people from high-occupancy zones toward lower-occupancy ones,
 *   scaled by the open/restricted gate throughput linked to the source zone.
 * - Adds mild stochastic drift so graphs look alive without runaway growth.
 */
export function simulateTick(
  zones: ZoneConfig[],
  counts: Record<string, number>,
  gates: GateConfig[],
  gateStates: GateStateRow[],
  movementRate: number,
  tickMs: number
): Record<string, number> {
  const next: Record<string, number> = { ...counts };
  const stateById = new Map(gateStates.map(g => [g.id, g]));

  // Throughput multiplier for a zone based on its linked non-emergency gates.
  const gateMultiplier = (zoneId: string) => {
    const linked = gates.filter(g => g.zoneId === zoneId && !g.isEmergency);
    if (linked.length === 0) return 1;
    let mult = 0;
    for (const g of linked) {
      const s = stateById.get(g.id);
      if (!s) continue;
      if (s.state === 'open') mult += 1;
      else if (s.state === 'restricted') mult += 0.35;
      // closed contributes 0
    }
    return Math.max(0.15, mult);
  };

  const minutes = tickMs / 60000;
  const baseMove = movementRate * minutes;

  const ranked = zones
    .map(z => ({ id: z.id, pct: (next[z.id] ?? 0) / z.capacity }))
    .sort((a, b) => b.pct - a.pct);

  for (let i = 0; i < ranked.length; i++) {
    const src = ranked[i];
    if (src.pct < 0.45) continue;
    for (let j = ranked.length - 1; j > i; j--) {
      const dst = ranked[j];
      if (dst.id === src.id) continue;
      const gap = src.pct - dst.pct;
      if (gap < 0.12) continue;
      const flow = Math.min(
        Math.ceil(baseMove * gap * 2.2 * gateMultiplier(src.id)),
        next[src.id] ?? 0
      );
      if (flow <= 0) continue;
      next[src.id] = Math.max(0, (next[src.id] ?? 0) - flow);
      next[dst.id] = (next[dst.id] ?? 0) + flow;
      break;
    }
  }

  for (const z of zones) {
    const drift = Math.round((Math.random() - 0.5) * 2);
    next[z.id] = Math.max(0, (next[z.id] ?? 0) + drift);
  }
  return next;
}

export function suddenInflux(
  counts: Record<string, number>,
  zoneId: string,
  amount: number
): Record<string, number> {
  return { ...counts, [zoneId]: Math.max(0, (counts[zoneId] ?? 0) + amount) };
}

export function movePeople(
  counts: Record<string, number>,
  fromId: string,
  toId: string,
  amount: number
): Record<string, number> {
  const actual = Math.min(amount, counts[fromId] ?? 0);
  return {
    ...counts,
    [fromId]: (counts[fromId] ?? 0) - actual,
    [toId]: (counts[toId] ?? 0) + actual,
  };
}
