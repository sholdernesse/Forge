import { normalizeSnapshots, type DailySnapshot } from '@forge/digital-twin';
import { isWorkoutSession, type WorkoutSession } from './workoutSession.js';
import type { ExercisePerformance } from './progression.js';
import type { TrainingSessionRecord } from './volumeLedger.js';

export type CheckIn = Required<
  Pick<DailySnapshot, 'sleepScore' | 'sleepHours' | 'soreness' | 'stress' | 'weightKg'>
>;

export interface DashboardState {
  history: DailySnapshot[];
  checkIn: CheckIn;
  savedAt?: string;
  workoutSession?: WorkoutSession;
  exerciseHistory?: ExercisePerformance[];
  sessionHistory?: TrainingSessionRecord[];
}

interface StoredDashboardState extends DashboardState {
  version: 4;
}

export interface DashboardStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DASHBOARD_STORAGE_KEY = 'forge.dashboard.v1';

function inRange(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum;
}

function isCheckIn(value: unknown): value is CheckIn {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CheckIn>;
  return inRange(candidate.weightKg, 30, 300)
    && inRange(candidate.sleepScore, 0, 100)
    && inRange(candidate.sleepHours, 0, 24)
    && inRange(candidate.soreness, 0, 10)
    && inRange(candidate.stress, 0, 10);
}

export function loadDashboardState(storage: DashboardStorage, fallback: DashboardState): DashboardState {
  try {
    const raw = storage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as Partial<Omit<StoredDashboardState, 'version'>> & { version?: number };
    if (![1, 2, 3, 4].includes(stored.version ?? 0) || !Array.isArray(stored.history) || !isCheckIn(stored.checkIn)) {
      return fallback;
    }
    return {
      history: normalizeSnapshots(stored.history),
      checkIn: stored.checkIn,
      ...(typeof stored.savedAt === 'string' ? { savedAt: stored.savedAt } : {}),
      ...(isWorkoutSession(stored.workoutSession) ? { workoutSession: stored.workoutSession } : {}),
      ...(Array.isArray(stored.exerciseHistory) ? { exerciseHistory: stored.exerciseHistory } : {}),
      ...(Array.isArray(stored.sessionHistory) ? { sessionHistory: stored.sessionHistory } : {}),
    };
  } catch {
    return fallback;
  }
}

export function saveDashboardState(storage: DashboardStorage, state: DashboardState): void {
  const stored: StoredDashboardState = { version: 4, ...state };
  storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(stored));
}

export function clearDashboardState(storage: DashboardStorage): void {
  storage.removeItem(DASHBOARD_STORAGE_KEY);
}
