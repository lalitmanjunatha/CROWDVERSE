import type { DensityLevel, ZoneConfig } from '@/types';

export function occupancy(count: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return (count / capacity) * 100;
}

export function densityLevel(count: number, zone: ZoneConfig): DensityLevel {
  const pct = occupancy(count, zone.capacity);
  if (pct >= zone.thresholds.red) return 'red';
  if (pct >= zone.thresholds.orange) return 'orange';
  if (pct >= zone.thresholds.yellow) return 'yellow';
  return 'green';
}

export const DENSITY_META: Record<DensityLevel, { label: string; color: string; text: string; bg: string; ring: string; dot: string }> = {
  green: { label: 'Normal', color: '#10b981', text: 'text-safe-400', bg: 'bg-safe-500/15', ring: 'ring-safe-500/30', dot: 'bg-safe-400' },
  yellow: { label: 'Moderate', color: '#f59e0b', text: 'text-warn-400', bg: 'bg-warn-500/15', ring: 'ring-warn-500/30', dot: 'bg-warn-400' },
  orange: { label: 'High', color: '#f97316', text: 'text-high-400', bg: 'bg-high-500/15', ring: 'ring-high-500/30', dot: 'bg-high-400' },
  red: { label: 'Overcrowding', color: '#ef4444', text: 'text-crit-400', bg: 'bg-crit-500/15', ring: 'ring-crit-500/40', dot: 'bg-crit-400' },
};

export function densityFromPct(pct: number, thresholds: { yellow: number; orange: number; red: number }): DensityLevel {
  if (pct >= thresholds.red) return 'red';
  if (pct >= thresholds.orange) return 'orange';
  if (pct >= thresholds.yellow) return 'yellow';
  return 'green';
}
