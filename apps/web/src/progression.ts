import { isWorkingSet, type WorkoutSession } from './workoutSession.js';

export interface ExercisePerformance {
  exerciseId: string;
  exerciseName: string;
  date: string;
  reps: number;
  loadKg: number;
  estimatedOneRepMax: number;
  isPersonalRecord?: boolean;
}

export interface ProgressionTarget {
  reps: number;
  loadKg: number;
  reason: string;
}

export interface ExerciseProgressTimeline {
  exerciseId: string;
  exerciseName: string;
  entries: ExercisePerformance[];
  gainPct: number;
  bestEstimatedOneRepMax: number;
}

export const demoExerciseHistory: ExercisePerformance[] = [
  { exerciseId: 'barbell-bench', exerciseName: 'Barbell bench press', date: '2026-07-29', reps: 8, loadKg: 59, estimatedOneRepMax: 74.7 },
  { exerciseId: 'barbell-bench', exerciseName: 'Barbell bench press', date: '2026-08-02', reps: 9, loadKg: 59, estimatedOneRepMax: 76.7 },
  { exerciseId: 'barbell-bench', exerciseName: 'Barbell bench press', date: '2026-08-09', reps: 10, loadKg: 59, estimatedOneRepMax: 78.7 },
  { exerciseId: 'overhead-press', exerciseName: 'Overhead press', date: '2026-07-27', reps: 8, loadKg: 36, estimatedOneRepMax: 45.6 },
  { exerciseId: 'overhead-press', exerciseName: 'Overhead press', date: '2026-08-03', reps: 10, loadKg: 36, estimatedOneRepMax: 48 },
  { exerciseId: 'hammer-curl', exerciseName: 'Hammer curl', date: '2026-08-05', reps: 12, loadKg: 11.3, estimatedOneRepMax: 15.8 },
  { exerciseId: 'dead-bugs', exerciseName: 'Dead bugs', date: '2026-08-05', reps: 10, loadKg: 2.5, estimatedOneRepMax: 3.3 },
];

export function estimatedOneRepMax(loadKg: number, reps: number): number {
  if (loadKg <= 0 || reps <= 0) return 0;
  return Math.round(loadKg * (1 + reps / 30) * 10) / 10;
}

export function progressionTarget(history: ExercisePerformance[], exerciseId: string): ProgressionTarget | undefined {
  const latest = history.filter((entry) => entry.exerciseId === exerciseId).sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return undefined;
  if (latest.reps < 12) return { reps: latest.reps + 1, loadKg: latest.loadKg, reason: 'Add one clean rep before increasing load.' };
  return { reps: 8, loadKg: Math.round((latest.loadKg + 2.5) * 10) / 10, reason: 'Rep range is complete; use the smallest safe load increase.' };
}

export function recordPerformances(session: WorkoutSession, history: ExercisePerformance[]): ExercisePerformance[] {
  const recorded: ExercisePerformance[] = [];
  for (const exercise of session.exercises) {
    if (exercise.mode !== 'reps') continue;
    for (const set of exercise.sets) {
      if (!isWorkingSet(set) || !set.completedAt || !set.reps || !set.loadKg) continue;
      const oneRepMax = estimatedOneRepMax(set.loadKg, set.reps);
      const previousBest = Math.max(0, ...history.filter((entry) => entry.exerciseId === exercise.id).map((entry) => entry.estimatedOneRepMax));
      recorded.push({ exerciseId: exercise.id, exerciseName: exercise.name, date: session.date, reps: set.reps, loadKg: set.loadKg, estimatedOneRepMax: oneRepMax, ...(oneRepMax > previousBest ? { isPersonalRecord: true } : {}) });
    }
  }
  return recorded;
}

export function strongestMovements(history: ExercisePerformance[]) {
  const byExercise = new Map<string, ExercisePerformance[]>();
  for (const entry of history) byExercise.set(entry.exerciseId, [...(byExercise.get(entry.exerciseId) ?? []), entry]);
  return [...byExercise.values()].map((entries) => {
    const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0]!;
    const latest = sorted.at(-1)!;
    return { ...latest, gainPct: first.estimatedOneRepMax ? Math.round((latest.estimatedOneRepMax / first.estimatedOneRepMax - 1) * 100) : 0 };
  }).sort((a, b) => b.gainPct - a.gainPct);
}

export function exerciseProgressTimeline(history: ExercisePerformance[], exerciseId: string): ExerciseProgressTimeline | undefined {
  const entries = history
    .filter((entry) => entry.exerciseId === exerciseId)
    .sort((left, right) => left.date.localeCompare(right.date));
  if (!entries.length) return undefined;
  const first = entries[0]!;
  const latest = entries.at(-1)!;
  const gainPct = first.estimatedOneRepMax ? Math.round((latest.estimatedOneRepMax / first.estimatedOneRepMax - 1) * 100) : 0;
  return {
    exerciseId,
    exerciseName: latest.exerciseName,
    entries,
    gainPct,
    bestEstimatedOneRepMax: Math.max(...entries.map((entry) => entry.estimatedOneRepMax)),
  };
}
