import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AlertEvent,
  AlertSeverity,
  AppSettings,
  GateConfig,
  GateStateRow,
  GateState,
  Recommendation,
  ZoneConfig,
} from '@/types';
import { DEFAULT_GATES, DEFAULT_ZONES } from '@/types';
import { storage } from '@/lib/storage';
import { simulateTick, suddenInflux as doInflux, movePeople as doMove } from '@/lib/simulation';
import { generateRecommendations } from '@/lib/recommend';
import { densityLevel, occupancy, DENSITY_META } from '@/lib/density';

interface AppState {
  zones: ZoneConfig[];
  gates: GateConfig[];
  counts: Record<string, number>;
  gateStates: GateStateRow[];
  alerts: AlertEvent[];
  recommendations: Recommendation[];
  settings: AppSettings;
  running: boolean;
  history: { t: number; values: Record<string, number> }[];
  workflowStage: number;
  lastTickAt: number | null;
  // actions
  start: () => void;
  pause: () => void;
  reset: () => void;
  setZoneCount: (zoneId: string, count: number) => void;
  setZoneCapacity: (zoneId: string, capacity: number) => void;
  setZoneThreshold: (zoneId: string, k: 'yellow' | 'orange' | 'red', v: number) => void;
  influx: (zoneId: string, amount: number) => void;
  movePeople: (fromId: string, toId: string, amount: number) => void;
  setGateState: (gateId: string, state: GateState) => void;
  acknowledgeAlert: (alertId: string) => void;
  resolveAlert: (alertId: string) => void;
  clearAlerts: () => void;
  approveRecommendation: (recId: string) => void;
  rejectRecommendation: (recId: string) => void;
  applyRecommendation: (recId: string) => void;
  dismissRecommendation: (recId: string) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  resetConfig: () => void;
}

const Ctx = createContext<AppState | null>(null);

const MAX_HISTORY = 60;

function uid(p: string) {
  return `${p}-${Math.random().toString(36).slice(2, 9)}`;
}

function severityFor(level: ReturnType<typeof densityLevel>): AlertSeverity {
  if (level === 'red') return 'critical';
  if (level === 'orange') return 'warning';
  return 'info';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [zones, setZones] = useState<ZoneConfig[]>(() => storage.loadZones());
  const [gates] = useState<GateConfig[]>(() => DEFAULT_GATES);
  const [counts, setCounts] = useState<Record<string, number>>(() => storage.loadZoneState());
  const [gateStates, setGateStates] = useState<GateStateRow[]>(() => storage.loadGateState());
  const [alerts, setAlerts] = useState<AlertEvent[]>(() => storage.loadAlerts());
  const [recommendations, setRecommendations] = useState<Recommendation[]>(() => storage.loadRecs());
  const [settings, setSettings] = useState<AppSettings>(() => storage.loadSettings());
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<{ t: number; values: Record<string, number> }[]>(() => {
    const initial: { t: number; values: Record<string, number> }[] = [];
    const base = storage.loadZoneState();
    const now = Date.now();
    for (let i = 8; i >= 1; i--) {
      const values: Record<string, number> = {};
      for (const z of storage.loadZones()) {
        const c = base[z.id] ?? 0;
        values[z.id] = Math.max(0, Math.round(c * (0.85 + Math.random() * 0.2) - i * 4));
      }
      initial.push({ t: now - i * 60000, values });
    }
    initial.push({ t: now, values: { ...base } });
    return initial;
  });
  const [workflowStage, setWorkflowStage] = useState(0);
  const [lastTickAt, setLastTickAt] = useState<number | null>(null);

  // persistence
  useEffect(() => storage.saveZones(zones), [zones]);
  useEffect(() => storage.saveZoneState(counts), [counts]);
  useEffect(() => storage.saveGateState(gateStates), [gateStates]);
  useEffect(() => storage.saveAlerts(alerts), [alerts]);
  useEffect(() => storage.saveRecs(recommendations), [recommendations]);
  useEffect(() => storage.saveSettings(settings), [settings]);

  // simulation tick
  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setCounts(prev => {
        const next = simulateTick(zones, prev, gates, gateStates, settings.movementRate, settings.tickIntervalMs);
        return next;
      });
      setLastTickAt(Date.now());
      setWorkflowStage(s => (s + 1) % 9);
    }, settings.tickIntervalMs);
    tickRef.current = id;
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [running, zones, gates, gateStates, settings.movementRate, settings.tickIntervalMs]);

  // record history whenever counts change (debounced by tick)
  const lastHistRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastHistRef.current < 1500) return;
    lastHistRef.current = now;
    setHistory(h => [...h.slice(-(MAX_HISTORY - 1)), { t: now, values: { ...counts } }]);
  }, [counts]);

  // alert generation + auto recommendations
  const prevLevels = useRef<Record<string, ReturnType<typeof densityLevel>>>({});
  useEffect(() => {
    const newAlerts: AlertEvent[] = [];
    for (const z of zones) {
      const level = densityLevel(counts[z.id] ?? 0, z);
      const prev = prevLevels.current[z.id] ?? 'green';
      if ((level === 'red' || level === 'orange') && level !== prev) {
        const sev = severityFor(level);
        const pct = Math.round(occupancy(counts[z.id] ?? 0, z.capacity));
        // find a target zone with capacity
        const target = [...zones]
          .map(zz => ({ zz, pct: occupancy(counts[zz.id] ?? 0, zz.capacity), avail: zz.capacity - (counts[zz.id] ?? 0) }))
          .filter(x => x.zz.id !== z.id && x.pct < 60 && x.avail > 50)
          .sort((a, b) => a.pct - b.pct)[0];
        newAlerts.push({
          id: uid('alert'),
          zoneId: z.id,
          severity: sev,
          message: `${sev === 'critical' ? 'CRITICAL' : 'WARNING'}: Zone ${z.id} – ${z.name} is at ${pct}% occupancy (${DENSITY_META[level].label}).`,
          recommendation: target
            ? `Consider redirecting incoming visitors toward Zone ${target.zz.id} – ${target.zz.name} (≈${target.avail} spots available).`
            : 'No zone has significant spare capacity. Consider opening additional exits or restricting inbound flow.',
          createdAt: Date.now(),
          status: 'active',
        });
      }
      prevLevels.current[z.id] = level;
    }
    if (newAlerts.length) {
      setAlerts(a => [...newAlerts, ...a].slice(0, 200));
    }
  }, [counts, zones]);

  // auto recommendations
  useEffect(() => {
    if (!settings.autoRecommend) return;
    const newRecs = generateRecommendations(zones, counts, recommendations);
    if (newRecs.length) {
      setRecommendations(r => [...newRecs, ...r].slice(0, 100));
    }
  }, [counts, zones, settings.autoRecommend]);

  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(() => {
    setRunning(false);
    const fresh: Record<string, number> = {};
    for (const z of zones) fresh[z.id] = Math.round(z.capacity * 0.2);
    setCounts(fresh);
    setHistory([{ t: Date.now(), values: { ...fresh } }]);
    setAlerts([]);
    setRecommendations([]);
    setWorkflowStage(0);
    prevLevels.current = {};
  }, [zones]);

  const setZoneCount = useCallback((zoneId: string, count: number) => {
    setCounts(c => ({ ...c, [zoneId]: Math.max(0, Math.round(count)) }));
  }, []);

  const setZoneCapacity = useCallback((zoneId: string, capacity: number) => {
    setZones(zs => zs.map(z => (z.id === zoneId ? { ...z, capacity: Math.max(10, Math.round(capacity)) } : z)));
  }, []);

  const setZoneThreshold = useCallback(
    (zoneId: string, k: 'yellow' | 'orange' | 'red', v: number) => {
      setZones(zs => zs.map(z => (z.id === zoneId ? { ...z, thresholds: { ...z.thresholds, [k]: Math.max(1, Math.min(99, Math.round(v))) } } : z)));
    },
    []
  );

  const influx = useCallback((zoneId: string, amount: number) => {
    setCounts(c => doInflux(c, zoneId, amount));
  }, []);

  const movePeople = useCallback((fromId: string, toId: string, amount: number) => {
    setCounts(c => doMove(c, fromId, toId, amount));
  }, []);

  const setGateState = useCallback((gateId: string, state: GateState) => {
    setGateStates(gs => gs.map(g => (g.id === gateId ? { ...g, state, updatedAt: Date.now() } : g)));
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(a => a.map(al => (al.id === alertId ? { ...al, status: 'acknowledged' } : al)));
  }, []);
  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(a => a.map(al => (al.id === alertId ? { ...al, status: 'resolved' } : al)));
  }, []);
  const clearAlerts = useCallback(() => setAlerts([]), []);

  const approveRecommendation = useCallback((recId: string) => {
    setRecommendations(r => r.map(rec => (rec.id === recId ? { ...rec, status: 'approved' } : rec)));
  }, []);
  const rejectRecommendation = useCallback((recId: string) => {
    setRecommendations(r => r.map(rec => (rec.id === recId ? { ...rec, status: 'rejected' } : rec)));
  }, []);
  const applyRecommendation = useCallback(
    (recId: string) => {
      setRecommendations(r => r.map(rec => (rec.id === recId ? { ...rec, status: 'applied' } : rec)));
      const rec = recommendations.find(r => r.id === recId);
      if (rec) {
        // move ~15% of source crowd toward target (simulated redistribution)
        setCounts(c => {
          const src = c[rec.fromZoneId] ?? 0;
          const amount = Math.round(src * 0.15);
          return doMove(c, rec.fromZoneId, rec.toZoneId, amount);
        });
      }
    },
    [recommendations]
  );
  const dismissRecommendation = useCallback((recId: string) => {
    setRecommendations(r => r.filter(rec => rec.id !== recId));
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...s }));
  }, []);

  const resetConfig = useCallback(() => {
    storage.clearAll();
    setZones(DEFAULT_ZONES);
    setCounts({ A: 320, B: 180, C: 980, D: 90, E: 410, F: 120 });
    setGateStates(DEFAULT_GATES.map(g => ({ id: g.id, state: 'open', flow: 60, updatedAt: Date.now() })));
    setAlerts([]);
    setRecommendations([]);
    setSettings({
      admin: { name: 'Administrator', role: 'Event Safety Officer' },
      tickIntervalMs: 3000,
      movementRate: 12,
      autoRecommend: true,
    });
    setHistory([{ t: Date.now(), values: { A: 320, B: 180, C: 980, D: 90, E: 410, F: 120 } }]);
  }, []);

  const value = useMemo<AppState>(() => ({
    zones, gates, counts, gateStates, alerts, recommendations, settings,
    running, history, workflowStage, lastTickAt,
    start, pause, reset, setZoneCount, setZoneCapacity, setZoneThreshold,
    influx, movePeople, setGateState, acknowledgeAlert, resolveAlert, clearAlerts,
    approveRecommendation, rejectRecommendation, applyRecommendation, dismissRecommendation,
    updateSettings, resetConfig,
  }), [
    zones, gates, counts, gateStates, alerts, recommendations, settings, running, history, workflowStage, lastTickAt,
    start, pause, reset, setZoneCount, setZoneCapacity, setZoneThreshold, influx, movePeople, setGateState,
    acknowledgeAlert, resolveAlert, clearAlerts, approveRecommendation, rejectRecommendation, applyRecommendation,
    dismissRecommendation, updateSettings, resetConfig,
  ]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
