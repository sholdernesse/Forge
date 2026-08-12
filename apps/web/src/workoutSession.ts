export type ExerciseMode = 'duration' | 'reps';
export type WorkoutStatus = 'not-started' | 'in-progress' | 'completed';

export interface WorkoutSetLog {
  id: string;
  reps?: number;
  loadKg?: number;
  durationMinutes?: number;
  completedAt?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  detail: string;
  mode: ExerciseMode;
  restSeconds: number;
  sets: WorkoutSetLog[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  title: string;
  status: WorkoutStatus;
  startedAt?: string;
  completedAt?: string;
  exercises: WorkoutExercise[];
}

export function createTodayWorkout(date: string): WorkoutSession {
  return {
    id: `${date}-recovery-session`,
    date,
    title: 'Cardio + mobility reset',
    status: 'not-started',
    exercises: [
      {
        id: 'zone-2-treadmill',
        name: 'Zone 2 treadmill',
        detail: 'Conversational pace',
        mode: 'duration',
        restSeconds: 60,
        sets: [{ id: 'zone-2-1', durationMinutes: 30 }],
      },
      {
        id: 'mobility-flow',
        name: 'Hip + thoracic mobility',
        detail: 'Controlled range',
        mode: 'duration',
        restSeconds: 30,
        sets: [{ id: 'mobility-1', durationMinutes: 5 }, { id: 'mobility-2', durationMinutes: 5 }],
      },
      {
        id: 'dead-bugs',
        name: 'Dead bugs',
        detail: 'Each side · slow exhale',
        mode: 'reps',
        restSeconds: 60,
        sets: Array.from({ length: 3 }, (_, index) => ({ id: `dead-bugs-${index + 1}`, reps: 10, loadKg: 0 })),
      },
    ],
  };
}

export function completedSetCount(session: WorkoutSession): number {
  return session.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completedAt).length;
}

export function totalSetCount(session: WorkoutSession): number {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
}

export function workoutMinutes(session: WorkoutSession): number {
  return session.exercises.reduce((total, exercise) => total + exercise.sets.reduce(
    (exerciseTotal, set) => exerciseTotal + (set.completedAt ? (set.durationMinutes ?? 2) : 0),
    0,
  ), 0);
}

export function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<WorkoutSession>;
  return typeof session.id === 'string'
    && typeof session.date === 'string'
    && typeof session.title === 'string'
    && ['not-started', 'in-progress', 'completed'].includes(session.status ?? '')
    && Array.isArray(session.exercises)
    && session.exercises.every((exercise) => exercise
      && typeof exercise.id === 'string'
      && typeof exercise.name === 'string'
      && Array.isArray(exercise.sets));
}
