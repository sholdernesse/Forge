import { isWorkingSet, type WorkoutDiscomfort, type WorkoutSession } from './workoutSession.js';
import type { ScheduleOverrides } from './schedulePolicy.js';

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core' | 'cardio';

export interface TrainingSessionRecord {
  workoutId: string;
  date: string;
  title: string;
  muscleSets: Partial<Record<MuscleGroup, number>>;
  durationMinutes: number;
  perceivedExertion?: number;
  discomfort?: WorkoutDiscomfort;
  feedbackNote?: string;
  exerciseSummaries?: ExerciseSessionSummary[];
}

export interface ExerciseSessionSummary {
  exerciseId: string;
  name: string;
  completedSets: number;
  totalSets: number;
}

export interface VolumeTarget {
  muscle: MuscleGroup;
  completed: number;
  target: number;
}

const exerciseMuscles: Record<string, MuscleGroup[]> = {
  'barbell-bench': ['chest', 'triceps'], 'chest-supported-row': ['back', 'biceps'],
  'dumbbell-overhead-press': ['shoulders', 'triceps'], 'lateral-raise': ['shoulders'], 'band-face-pull': ['back', 'shoulders'],
  'box-squat': ['quads', 'glutes'], 'hip-thrust': ['glutes', 'hamstrings'], 'split-squat': ['quads', 'glutes'],
  'standing-calf-raise': ['calves'], 'dead-bugs': ['core'], 'zone-2-treadmill': ['cardio'], 'mobility-flow': ['core'],
};

export const demoSessionHistory: TrainingSessionRecord[] = [
  { workoutId: 'demo-0802', date: '2026-08-02', title: 'Chest + back', durationMinutes: 58, muscleSets: { chest: 7, back: 7, biceps: 5 }, perceivedExertion: 8, exerciseSummaries: [{ exerciseId: 'barbell-bench', name: 'Barbell bench press', completedSets: 3, totalSets: 4 }, { exerciseId: 'chest-supported-row', name: 'Chest-supported row', completedSets: 4, totalSets: 4 }, { exerciseId: 'band-face-pull', name: 'Band face pull', completedSets: 3, totalSets: 3 }] },
  { workoutId: 'demo-0807', date: '2026-08-07', title: 'Shoulders + arms', durationMinutes: 48, muscleSets: { shoulders: 10, biceps: 6, triceps: 6 } },
  { workoutId: 'demo-0809', date: '2026-08-09', title: 'Chest + back', durationMinutes: 64, muscleSets: { chest: 8, back: 8, biceps: 6 }, perceivedExertion: 8, exerciseSummaries: [{ exerciseId: 'barbell-bench', name: 'Barbell bench press', completedSets: 4, totalSets: 4 }, { exerciseId: 'chest-supported-row', name: 'Chest-supported row', completedSets: 4, totalSets: 4 }, { exerciseId: 'band-face-pull', name: 'Band face pull', completedSets: 3, totalSets: 3 }] },
  { workoutId: 'demo-0810', date: '2026-08-10', title: 'Lower body', durationMinutes: 55, muscleSets: { quads: 7, glutes: 7, hamstrings: 4, calves: 3 } },
];

export function summarizeWorkout(session: WorkoutSession, durationMinutes: number): TrainingSessionRecord {
  const muscleSets: Partial<Record<MuscleGroup, number>> = {};
  for (const exercise of session.exercises) {
    const completedSets = exercise.sets.filter((set) => isWorkingSet(set) && set.completedAt).length;
    if (!completedSets) continue;
    for (const muscle of exerciseMuscles[exercise.id] ?? []) muscleSets[muscle] = (muscleSets[muscle] ?? 0) + completedSets;
  }
  return {
    workoutId: session.id,
    date: session.date,
    title: session.title,
    muscleSets,
    durationMinutes,
    ...(session.feedback ? {
      perceivedExertion: session.feedback.perceivedExertion,
      discomfort: session.feedback.discomfort,
      ...(session.feedback.note ? { feedbackNote: session.feedback.note } : {}),
    } : {}),
    exerciseSummaries: session.exercises.map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      completedSets: exercise.sets.filter((set) => isWorkingSet(set) && set.completedAt).length,
      totalSets: exercise.sets.filter(isWorkingSet).length,
    })),
  };
}

const muscleGroups: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'cardio'];

export function isTrainingSessionRecord(value: unknown): value is TrainingSessionRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<TrainingSessionRecord>;
  if (typeof record.workoutId !== 'string' || !record.workoutId || record.workoutId.length > 200
    || typeof record.date !== 'string' || Number.isNaN(Date.parse(`${record.date}T00:00:00Z`))
    || typeof record.title !== 'string' || !record.title || record.title.length > 200
    || typeof record.durationMinutes !== 'number' || !Number.isFinite(record.durationMinutes) || record.durationMinutes < 0 || record.durationMinutes > 600
    || !record.muscleSets || typeof record.muscleSets !== 'object') return false;
  if (!Object.entries(record.muscleSets).every(([muscle, sets]) => muscleGroups.includes(muscle as MuscleGroup) && typeof sets === 'number' && Number.isInteger(sets) && sets >= 0 && sets <= 100)) return false;
  if (record.perceivedExertion !== undefined && (!Number.isInteger(record.perceivedExertion) || record.perceivedExertion < 1 || record.perceivedExertion > 10)) return false;
  if (record.discomfort !== undefined && !['none', 'mild', 'stopped'].includes(record.discomfort)) return false;
  if (record.feedbackNote !== undefined && (typeof record.feedbackNote !== 'string' || record.feedbackNote.length > 240)) return false;
  return record.exerciseSummaries === undefined || (Array.isArray(record.exerciseSummaries) && record.exerciseSummaries.length <= 30 && record.exerciseSummaries.every((summary) => summary
    && typeof summary.exerciseId === 'string' && summary.exerciseId.length > 0 && summary.exerciseId.length <= 200
    && typeof summary.name === 'string' && summary.name.length > 0 && summary.name.length <= 200
    && Number.isInteger(summary.completedSets) && summary.completedSets >= 0
    && Number.isInteger(summary.totalSets) && summary.totalSets >= summary.completedSets && summary.totalSets <= 30));
}

export function weeklyVolume(records: TrainingSessionRecord[], asOfDate: string): VolumeTarget[] {
  const end = Date.parse(`${asOfDate}T00:00:00Z`);
  const start = end - 6 * 86_400_000;
  const totals = new Map<MuscleGroup, number>();
  for (const record of records) {
    const date = Date.parse(`${record.date}T00:00:00Z`);
    if (date < start || date > end) continue;
    for (const [muscle, sets] of Object.entries(record.muscleSets) as Array<[MuscleGroup, number]>) totals.set(muscle, (totals.get(muscle) ?? 0) + sets);
  }
  const targets: Partial<Record<MuscleGroup, number>> = { chest: 10, back: 10, shoulders: 12, biceps: 8, triceps: 8, quads: 10, hamstrings: 8, glutes: 10, calves: 6, core: 6, cardio: 3 };
  return (Object.entries(targets) as Array<[MuscleGroup, number]>).map(([muscle, target]) => ({ muscle, completed: totals.get(muscle) ?? 0, target }));
}

export function trainingWeek(records: TrainingSessionRecord[], asOfDate: string, currentTitle: string, overrides: ScheduleOverrides = {}) {
  const anchor = new Date(`${asOfDate}T12:00:00Z`);
  const monday = new Date(anchor);
  monday.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday); date.setUTCDate(monday.getUTCDate() + index);
    const iso = date.toISOString().slice(0, 10);
    const record = records.find((item) => item.date === iso);
    const intent = overrides[iso] ?? 'adaptive';
    const status = record ? 'completed' as const : iso === asOfDate ? 'today' as const : iso < asOfDate || intent === 'rest' ? 'rest' as const : 'planned' as const;
    return { date: iso, day: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }), title: record?.title ?? (iso === asOfDate ? currentTitle : intent === 'train' ? 'Training' : intent === 'rest' ? 'Rest' : 'Adaptive'), status, intent };
  });
}
