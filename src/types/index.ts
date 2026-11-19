export type DensityLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface ZoneConfig {
  id: string;
  name: string;
  shortName: string;
  capacity: number;
  /** occupancy % thresholds for each density level (ascending) */
  thresholds: { yellow: number; orange: number; red: number };
  /** map coordinates (percent of container) */
  x: number;
  y: number;
}

export interface ZoneState {
  id: string;
  count: number;
  updatedAt: number;
}

export type GateState = 'open' | 'closed' | 'restricted';

export interface GateConfig {
  id: string;
  name: string;
  shortName: string;
  zoneId: string;
  isEmergency: boolean;
}

export interface GateStateRow {
  id: string;
  state: GateState;
  flow: number; // simulated people/min throughput
  updatedAt: number;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface AlertEvent {
  id: string;
  zoneId: string;
  severity: AlertSeverity;
  message: string;
  recommendation: string;
  createdAt: number;
  status: AlertStatus;
}

export interface Recommendation {
  id: string;
  fromZoneId: string;
  toZoneId: string;
  reason: string;
  expectedResult: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
}

export interface HistoryPoint {
  t: number;
  values: Record<string, number>;
}

export interface AdminProfile {
  name: string;
  role: string;
}

export interface AppSettings {
  admin: AdminProfile;
  tickIntervalMs: number;
  movementRate: number; // baseline people/min moved between zones when simulating
  autoRecommend: boolean;
}

export type WorkflowStage =
  | 'detection'
  | 'classification'
  | 'analysis'
  | 'prediction'
  | 'alert'
  | 'recommendation'
  | 'admin'
  | 'verification'
  | 'repeat';

export const DEFAULT_ZONES: ZoneConfig[] = [
  { id: 'A', name: 'Main Entrance', shortName: 'Entrance', capacity: 800, thresholds: { yellow: 50, orange: 75, red: 90 }, x: 18, y: 30 },
  { id: 'B', name: 'Food Court', shortName: 'Food Court', capacity: 500, thresholds: { yellow: 55, orange: 75, red: 90 }, x: 45, y: 22 },
  { id: 'C', name: 'Main Stage', shortName: 'Stage', capacity: 1200, thresholds: { yellow: 55, orange: 78, red: 90 }, x: 62, y: 52 },
  { id: 'D', name: 'Emergency Exit', shortName: 'Exit', capacity: 400, thresholds: { yellow: 50, orange: 75, red: 88 }, x: 84, y: 70 },
  { id: 'E', name: 'Parking Area', shortName: 'Parking', capacity: 1000, thresholds: { yellow: 50, orange: 75, red: 90 }, x: 20, y: 78 },
  { id: 'F', name: 'Waiting Area', shortName: 'Waiting', capacity: 600, thresholds: { yellow: 55, orange: 75, red: 90 }, x: 45, y: 82 },
];

export const DEFAULT_GATES: GateConfig[] = [
  { id: 'GA', name: 'Gate A – Main Entrance', shortName: 'Gate A', zoneId: 'A', isEmergency: false },
  { id: 'GB', name: 'Gate B – Secondary Entrance', shortName: 'Gate B', zoneId: 'F', isEmergency: false },
  { id: 'GC', name: 'Gate C – Exit Gate', shortName: 'Gate C', zoneId: 'D', isEmergency: false },
  { id: 'GD', name: 'Gate D – Emergency Exit', shortName: 'Emergency', zoneId: 'D', isEmergency: true },
];
