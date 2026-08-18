export type ExerciseMode = 'duration' | 'reps';
export type WorkoutStatus = 'not-started' | 'in-progress' | 'completed';
export type WorkoutDiscomfort = 'none' | 'mild' | 'stopped';
export type MovementQuality = 'controlled' | 'mixed' | 'breakdown';

export interface WorkoutFeedback {
  perceivedExertion: number;
  discomfort: WorkoutDiscomfort;
  movementQuality?: MovementQuality;
  note?: string;
}

export type WorkoutSetKind = 'warmup' | 'working';

export interface WorkoutSetLog {
  id: string;
  kind?: WorkoutSetKind;
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
  substitutedFromId?: string;
  substitutedFromName?: string;
}

export interface WorkoutNextStep {
  exerciseIndex: number;
  setIndex: number;
  exerciseId: string;
  exerciseName: string;
  setLabel: string;
  targetLabel: string;
  kind: WorkoutSetKind;
}

export interface WorkoutSession {
  id: string;
  date: string;
  title: string;
  status: WorkoutStatus;
  startedAt?: string;
  completedAt?: string;
  exercises: WorkoutExercise[];
  planType?: 'recovery' | 'upper-strength' | 'lower-strength';
  planReason?: string;
  intensity?: 'low' | 'moderate' | 'high';
  feedback?: WorkoutFeedback;
  restEndsAt?: string;
}

export function isWorkoutFeedback(value: unknown): value is WorkoutFeedback {
  if (!value || typeof value !== 'object') return false;
  const feedback = value as Partial<WorkoutFeedback>;
  return typeof feedback.perceivedExertion === 'number'
    && Number.isInteger(feedback.perceivedExertion)
    && feedback.perceivedExertion >= 1
    && feedback.perceivedExertion <= 10
    && ['none', 'mild', 'stopped'].includes(feedback.discomfort ?? '')
    && (feedback.movementQuality === undefined || ['controlled', 'mixed', 'breakdown'].includes(feedback.movementQuality))
    && (feedback.note === undefined || (typeof feedback.note === 'string' && feedback.note.length <= 240));
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

export function beginWorkoutRest(session: WorkoutSession, seconds: number, now = Date.now()): WorkoutSession {
  if (!Number.isFinite(seconds) || seconds <= 0) return clearWorkoutRest(session);
  return { ...session, restEndsAt: new Date(now + Math.ceil(seconds) * 1000).toISOString() };
}

export function clearWorkoutRest(session: WorkoutSession): WorkoutSession {
  const { restEndsAt: _restEndsAt, ...withoutRest } = session;
  return withoutRest;
}

export function adjustWorkoutRest(session: WorkoutSession, deltaSeconds: number, now = Date.now()): WorkoutSession {
  const nextSeconds = workoutRestSecondsRemaining(session, now) + Math.trunc(deltaSeconds);
  return nextSeconds > 0 ? beginWorkoutRest(session, nextSeconds, now) : clearWorkoutRest(session);
}

export function nextIncompleteExerciseIndex(session: WorkoutSession, currentIndex: number): number | undefined {
  if (!session.exercises.length) return undefined;
  const indexes = session.exercises.map((_, index) => index);
  const ordered = [...indexes.filter((index) => index > currentIndex), ...indexes.filter((index) => index <= currentIndex)];
  return ordered.find((index) => session.exercises[index]!.sets.some((set) => !set.completedAt));
}

export function workoutRestSecondsRemaining(session: WorkoutSession, now = Date.now()): number {
  if (!session.restEndsAt) return 0;
  const deadline = Date.parse(session.restEndsAt);
  if (!Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function isWorkingSet(set: WorkoutSetLog): boolean {
  return set.kind !== 'warmup';
}

export function addWarmupSet(exercise: WorkoutExercise, maximumSets = 12): WorkoutExercise {
  if (exercise.mode !== 'reps' || exercise.sets.length >= maximumSets) return exercise;
  const firstWorking = exercise.sets.find(isWorkingSet);
  const usedIds = new Set(exercise.sets.map((set) => set.id));
  let suffix = exercise.sets.filter((set) => set.kind === 'warmup').length + 1;
  while (usedIds.has(`${exercise.id}-warmup-${suffix}`)) suffix += 1;
  const warmup: WorkoutSetLog = {
    id: `${exercise.id}-warmup-${suffix}`,
    kind: 'warmup',
    reps: Math.min(10, firstWorking?.reps ?? 8),
    loadKg: 0,
  };
  const firstWorkingIndex = exercise.sets.findIndex(isWorkingSet);
  const insertAt = firstWorkingIndex < 0 ? exercise.sets.length : firstWorkingIndex;
  return { ...exercise, sets: [...exercise.sets.slice(0, insertAt), warmup, ...exercise.sets.slice(insertAt)] };
}

export function removeLastWarmupSet(exercise: WorkoutExercise): WorkoutExercise {
  let index = -1;
  for (let setIndex = exercise.sets.length - 1; setIndex >= 0; setIndex -= 1) {
    const set = exercise.sets[setIndex]!;
    if (set.kind === 'warmup' && !set.completedAt) { index = setIndex; break; }
  }
  if (index < 0) return exercise;
  return { ...exercise, sets: exercise.sets.filter((_, setIndex) => setIndex !== index) };
}

export function applyWorkoutSetPatch(set: WorkoutSetLog, patch: Partial<WorkoutSetLog>): WorkoutSetLog {
  const next = { ...set, ...patch };
  if (patch.reps !== undefined) next.reps = Number.isFinite(patch.reps) ? Math.max(1, Math.round(patch.reps)) : (set.reps ?? 1);
  if (patch.durationMinutes !== undefined) next.durationMinutes = Number.isFinite(patch.durationMinutes) ? Math.max(1, Math.round(patch.durationMinutes)) : (set.durationMinutes ?? 1);
  if (patch.loadKg !== undefined) next.loadKg = Number.isFinite(patch.loadKg) ? Math.max(0, patch.loadKg) : (set.loadKg ?? 0);
  return next;
}

export function addWorkoutSet(exercise: WorkoutExercise, maximumSets = 12): WorkoutExercise {
  if (exercise.sets.length >= maximumSets) return exercise;
  const template: WorkoutSetLog = exercise.sets.at(-1) ?? (exercise.mode === 'duration'
    ? { id: 'template', durationMinutes: 1 }
    : { id: 'template', reps: 1, loadKg: 0 });
  const { completedAt: _completedAt, id: _id, ...prescription } = template;
  const usedIds = new Set(exercise.sets.map((set) => set.id));
  let suffix = exercise.sets.length + 1;
  while (usedIds.has(`${exercise.id}-extra-${suffix}`)) suffix += 1;
  return { ...exercise, sets: [...exercise.sets, { ...prescription, id: `${exercise.id}-extra-${suffix}` }] };
}

export function removeLastWorkoutSet(exercise: WorkoutExercise): WorkoutExercise {
  if (exercise.sets.length <= 1 || exercise.sets.at(-1)?.completedAt) return exercise;
  return { ...exercise, sets: exercise.sets.slice(0, -1) };
}

export function nextWorkoutStep(session: WorkoutSession, preferredExerciseIndex = 0): WorkoutNextStep | undefined {
  const indexes = session.exercises.map((_, index) => index);
  const preferred = indexes.includes(preferredExerciseIndex) ? [preferredExerciseIndex] : [];
  const ordered = [...preferred, ...indexes.filter((index) => index !== preferredExerciseIndex)];
  for (const exerciseIndex of ordered) {
    const exercise = session.exercises[exerciseIndex]!;
    const setIndex = exercise.sets.findIndex((set) => !set.completedAt);
    if (setIndex < 0) continue;
    const set = exercise.sets[setIndex]!;
    const kind: WorkoutSetKind = set.kind ?? 'working';
    const sameKindOrdinal = exercise.sets.slice(0, setIndex + 1).filter((item) => (item.kind ?? 'working') === kind).length;
    const setLabel = kind === 'warmup' ? `Warm-up ${sameKindOrdinal}` : `Set ${sameKindOrdinal}`;
    const targetLabel = exercise.mode === 'duration'
      ? `${set.durationMinutes ?? 1} min`
      : (set.loadKg ?? 0) > 0
        ? `${set.reps ?? 1} reps × ${set.loadKg} kg`
        : `${set.reps ?? 1} reps · unloaded`;
    return { exerciseIndex, setIndex, exerciseId: exercise.id, exerciseName: exercise.name, setLabel, targetLabel, kind };
  }
  return undefined;
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

export function workoutElapsedMinutes(session: WorkoutSession, now = Date.now()): number {
  const startedAt = session.startedAt ? Date.parse(session.startedAt) : Number.NaN;
  const endedAt = session.completedAt ? Date.parse(session.completedAt) : now;
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt < startedAt) {
    return Math.max(1, Math.min(600, workoutMinutes(session)));
  }
  return Math.max(1, Math.min(600, Math.round((endedAt - startedAt) / 60_000)));
}

export function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<WorkoutSession>;
  return typeof session.id === 'string'
    && typeof session.date === 'string'
    && typeof session.title === 'string'
    && ['not-started', 'in-progress', 'completed'].includes(session.status ?? '')
    && (session.feedback === undefined || isWorkoutFeedback(session.feedback))
    && (session.startedAt === undefined || (typeof session.startedAt === 'string' && Number.isFinite(Date.parse(session.startedAt))))
    && (session.completedAt === undefined || (typeof session.completedAt === 'string' && Number.isFinite(Date.parse(session.completedAt))))
    && !(session.startedAt && session.completedAt && Date.parse(session.completedAt) < Date.parse(session.startedAt))
    && (session.restEndsAt === undefined || (typeof session.restEndsAt === 'string' && Number.isFinite(Date.parse(session.restEndsAt))))
    && Array.isArray(session.exercises)
    && session.exercises.every((exercise) => exercise
      && typeof exercise.id === 'string'
      && typeof exercise.name === 'string'
      && typeof exercise.detail === 'string'
      && ['duration', 'reps'].includes(exercise.mode)
      && typeof exercise.restSeconds === 'number'
      && Number.isFinite(exercise.restSeconds)
      && exercise.restSeconds >= 0
      && (exercise.substitutedFromId === undefined || typeof exercise.substitutedFromId === 'string')
      && (exercise.substitutedFromName === undefined || typeof exercise.substitutedFromName === 'string')
      && Array.isArray(exercise.sets)
      && exercise.sets.length > 0
      && exercise.sets.every((set) => set
        && typeof set.id === 'string'
        && (set.kind === undefined || ['warmup', 'working'].includes(set.kind))
        && (set.completedAt === undefined || (typeof set.completedAt === 'string' && Number.isFinite(Date.parse(set.completedAt))))
        && (exercise.mode === 'duration'
          ? typeof set.durationMinutes === 'number' && Number.isFinite(set.durationMinutes) && set.durationMinutes >= 1
          : typeof set.reps === 'number' && Number.isInteger(set.reps) && set.reps >= 1
            && typeof set.loadKg === 'number' && Number.isFinite(set.loadKg) && set.loadKg >= 0)));
}
