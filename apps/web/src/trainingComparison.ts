import type { TrainingSessionRecord } from './volumeLedger.js';

export interface TrainingSessionComparison {
  previousWorkoutId: string;
  previousDate: string;
  duration: { current: number; previous: number; delta: number };
  completedSets: { current: number; previous: number; delta: number };
  effort?: { current: number; previous: number; delta: number };
  movementQuality?: { current: NonNullable<TrainingSessionRecord['movementQuality']>; previous: NonNullable<TrainingSessionRecord['movementQuality']>; delta: number };
  exercises: Array<{ exerciseId: string; name: string; currentSets: number; previousSets: number; delta: number }>;
}

export interface TrainingSessionNeighbors {
  previousWorkoutId?: string;
  nextWorkoutId?: string;
}

const qualityRank = { breakdown: 0, mixed: 1, controlled: 2 } as const;

function totalSets(record: TrainingSessionRecord) {
  return Object.values(record.muscleSets).reduce((total, sets) => total + (sets ?? 0), 0);
}

export function compareTrainingSession(records: TrainingSessionRecord[], workoutId: string): TrainingSessionComparison | undefined {
  const current = records.find((record) => record.workoutId === workoutId);
  if (!current) return undefined;
  const neighbors = trainingSessionNeighbors(records, workoutId);
  const previous = records.find((record) => record.workoutId === neighbors.previousWorkoutId);
  if (!previous) return undefined;
  const currentSets = totalSets(current);
  const previousSets = totalSets(previous);
  const exerciseIds = new Set([
    ...(current.exerciseSummaries?.map((exercise) => exercise.exerciseId) ?? []),
    ...(previous.exerciseSummaries?.map((exercise) => exercise.exerciseId) ?? []),
  ]);
  const exercises = [...exerciseIds].map((exerciseId) => {
    const currentExercise = current.exerciseSummaries?.find((exercise) => exercise.exerciseId === exerciseId);
    const previousExercise = previous.exerciseSummaries?.find((exercise) => exercise.exerciseId === exerciseId);
    const currentCompleted = currentExercise?.completedSets ?? 0;
    const previousCompleted = previousExercise?.completedSets ?? 0;
    return {
      exerciseId,
      name: currentExercise?.name ?? previousExercise?.name ?? exerciseId,
      currentSets: currentCompleted,
      previousSets: previousCompleted,
      delta: currentCompleted - previousCompleted,
    };
  }).sort((left, right) => left.name.localeCompare(right.name));
  return {
    previousWorkoutId: previous.workoutId,
    previousDate: previous.date,
    duration: { current: current.durationMinutes, previous: previous.durationMinutes, delta: current.durationMinutes - previous.durationMinutes },
    completedSets: { current: currentSets, previous: previousSets, delta: currentSets - previousSets },
    exercises,
    ...(current.perceivedExertion !== undefined && previous.perceivedExertion !== undefined ? {
      effort: { current: current.perceivedExertion, previous: previous.perceivedExertion, delta: current.perceivedExertion - previous.perceivedExertion },
    } : {}),
    ...(current.movementQuality && previous.movementQuality ? {
      movementQuality: { current: current.movementQuality, previous: previous.movementQuality, delta: qualityRank[current.movementQuality] - qualityRank[previous.movementQuality] },
    } : {}),
  };
}

export function trainingSessionNeighbors(records: TrainingSessionRecord[], workoutId: string): TrainingSessionNeighbors {
  const current = records.find((record) => record.workoutId === workoutId);
  if (!current) return {};
  const normalizedTitle = current.title.trim().toLocaleLowerCase();
  const matches = records
    .filter((record) => record.title.trim().toLocaleLowerCase() === normalizedTitle)
    .sort((left, right) => left.date.localeCompare(right.date) || left.workoutId.localeCompare(right.workoutId));
  const index = matches.findIndex((record) => record.workoutId === workoutId);
  if (index < 0) return {};
  return {
    ...(matches[index - 1] ? { previousWorkoutId: matches[index - 1]!.workoutId } : {}),
    ...(matches[index + 1] ? { nextWorkoutId: matches[index + 1]!.workoutId } : {}),
  };
}
