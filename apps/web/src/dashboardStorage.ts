import { normalizeSnapshots, type DailySnapshot } from '@forge/digital-twin';
import { isWorkoutSession, type WorkoutSession } from './workoutSession.js';
import type { ExercisePerformance } from './progression.js';
import { isTrainingSessionRecord, type TrainingSessionRecord } from './volumeLedger.js';
import type { ScheduleOverrides } from './schedulePolicy.js';
import type { FoodEntry, SavedMeal } from './foodLog.js';
import type { CoachAnswerBasis, CoachSuggestedAction } from '@forge/coach';

export type CheckIn = Required<
  Pick<DailySnapshot, 'sleepScore' | 'sleepHours' | 'soreness' | 'stress' | 'weightKg'>
>;

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  recommendationIds: string[];
  answerBasis?: CoachAnswerBasis;
  suggestedAction?: CoachSuggestedAction;
  createdAt: string;
}

export interface DashboardState {
  history: DailySnapshot[];
  checkIn: CheckIn;
  savedAt?: string;
  workoutSession?: WorkoutSession;
  exerciseHistory?: ExercisePerformance[];
  sessionHistory?: TrainingSessionRecord[];
  scheduleOverrides?: ScheduleOverrides;
  foodEntries?: FoodEntry[];
  favoriteFoodIds?: string[];
  savedMeals?: SavedMeal[];
  coachMessages?: CoachMessage[];
}

interface StoredDashboardState extends DashboardState {
  version: 10;
  updatedAt: string;
}

export interface DashboardSaveEventDetail {
  state: DashboardState;
  updatedAt: string;
}

export interface DashboardStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DASHBOARD_STORAGE_KEY = 'forge.dashboard.v1';
export const DASHBOARD_SAVED_EVENT = 'forge:dashboard-saved';

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

function isCoachMessage(value: unknown): value is CoachMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CoachMessage>;
  return typeof candidate.id === 'string' && candidate.id.length > 0 && candidate.id.length <= 100
    && (candidate.role === 'user' || candidate.role === 'assistant')
    && typeof candidate.content === 'string' && candidate.content.length > 0 && candidate.content.length <= 2_000
    && (candidate.answerBasis === undefined || ['recommendations', 'safety-boundary', 'insufficient-data', 'readiness'].includes(candidate.answerBasis))
    && Array.isArray(candidate.recommendationIds) && candidate.recommendationIds.every((id) => typeof id === 'string' && id.length <= 200)
    && (candidate.suggestedAction === undefined || isCoachAction(candidate.suggestedAction))
    && typeof candidate.createdAt === 'string' && !Number.isNaN(Date.parse(candidate.createdAt));
}

function isCoachAction(value: unknown): value is CoachSuggestedAction {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CoachSuggestedAction>;
  return (candidate.type === 'open-workout' || candidate.type === 'open-nutrition' || candidate.type === 'open-check-in')
    && typeof candidate.label === 'string' && candidate.label.length > 0 && candidate.label.length <= 100;
}

export function parseDashboardState(value: unknown): DashboardState | null {
  if (!value || typeof value !== 'object') return null;
  const stored = value as Partial<DashboardState>;
  if (!Array.isArray(stored.history) || !isCheckIn(stored.checkIn)) return null;
  return {
    history: normalizeSnapshots(stored.history),
    checkIn: stored.checkIn,
    ...(typeof stored.savedAt === 'string' ? { savedAt: stored.savedAt } : {}),
    ...(isWorkoutSession(stored.workoutSession) ? { workoutSession: stored.workoutSession } : {}),
    ...(Array.isArray(stored.exerciseHistory) ? { exerciseHistory: stored.exerciseHistory } : {}),
    ...(Array.isArray(stored.sessionHistory) ? { sessionHistory: stored.sessionHistory.filter(isTrainingSessionRecord).slice(-90) } : {}),
    ...(stored.scheduleOverrides && typeof stored.scheduleOverrides === 'object' ? { scheduleOverrides: stored.scheduleOverrides } : {}),
    ...(Array.isArray(stored.foodEntries) ? { foodEntries: stored.foodEntries } : {}),
    ...(Array.isArray(stored.favoriteFoodIds) ? { favoriteFoodIds: stored.favoriteFoodIds } : {}),
    ...(Array.isArray(stored.savedMeals) ? { savedMeals: stored.savedMeals } : {}),
    ...(Array.isArray(stored.coachMessages) ? { coachMessages: stored.coachMessages.filter(isCoachMessage).slice(-40) } : {}),
  };
}

export function loadDashboardState(storage: DashboardStorage, fallback: DashboardState): DashboardState {
  try {
    const raw = storage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as Partial<Omit<StoredDashboardState, 'version'>> & { version?: number };
    if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(stored.version ?? 0) || !Array.isArray(stored.history) || !isCheckIn(stored.checkIn)) {
      return fallback;
    }
    return parseDashboardState(stored) ?? fallback;
  } catch {
    return fallback;
  }
}

export function saveDashboardState(storage: DashboardStorage, state: DashboardState): void {
  const updatedAt = new Date().toISOString();
  cacheDashboardState(storage, state, updatedAt);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<DashboardSaveEventDetail>(DASHBOARD_SAVED_EVENT, { detail: { state, updatedAt } }));
  }
}

export function cacheDashboardState(storage: DashboardStorage, state: DashboardState, updatedAt: string): void {
  const stored: StoredDashboardState = { version: 10, updatedAt, ...state };
  storage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(stored));
}

export function dashboardStateUpdatedAt(storage: DashboardStorage): string | undefined {
  try {
    const raw = storage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return undefined;
    const stored = JSON.parse(raw) as { updatedAt?: unknown };
    return typeof stored.updatedAt === 'string' ? stored.updatedAt : undefined;
  } catch {
    return undefined;
  }
}

export function clearDashboardState(storage: DashboardStorage): void {
  storage.removeItem(DASHBOARD_STORAGE_KEY);
}
