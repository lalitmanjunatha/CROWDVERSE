import type { AlertEvent, AppSettings, GateStateRow, Recommendation, ZoneConfig, ZoneState } from '@/types';
import { DEFAULT_GATES, DEFAULT_ZONES } from '@/types';

const KEYS = {
  zones: 'cg_zones',
  zoneState: 'cg_zone_state',
  gates: 'cg_gate_state',
  alerts: 'cg_alerts',
  recs: 'cg_recs',
  settings: 'cg_settings',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export const storage = {
  loadZones: (): ZoneConfig[] => read(KEYS.zones, DEFAULT_ZONES),
  saveZones: (z: ZoneConfig[]) => write(KEYS.zones, z),

  loadZoneState: (): Record<string, number> => {
    const raw = read<Record<string, number> | null>(KEYS.zoneState, null);
    if (raw) return raw;
    // sensible demo defaults
    return { A: 320, B: 180, C: 980, D: 90, E: 410, F: 120 };
  },
  saveZoneState: (s: Record<string, number>) => write(KEYS.zoneState, s),

  loadGateState: (): GateStateRow[] => {
    const raw = read<GateStateRow[] | null>(KEYS.gates, null);
    if (raw) return raw;
    return DEFAULT_GATES.map(g => ({
      id: g.id,
      state: g.isEmergency ? 'open' : 'open',
      flow: g.isEmergency ? 0 : 60,
      updatedAt: Date.now(),
    }));
  },
  saveGateState: (g: GateStateRow[]) => write(KEYS.gates, g),

  loadAlerts: (): AlertEvent[] => read(KEYS.alerts, []),
  saveAlerts: (a: AlertEvent[]) => write(KEYS.alerts, a.slice(-200)),

  loadRecs: (): Recommendation[] => read(KEYS.recs, []),
  saveRecs: (r: Recommendation[]) => write(KEYS.recs, r.slice(-100)),

  loadSettings: (): AppSettings =>
    read<AppSettings>(KEYS.settings, {
      admin: { name: 'Administrator', role: 'Event Safety Officer' },
      tickIntervalMs: 3000,
      movementRate: 12,
      autoRecommend: true,
    }),
  saveSettings: (s: AppSettings) => write(KEYS.settings, s),

  clearAll: () => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};

export const GATES = DEFAULT_GATES;
