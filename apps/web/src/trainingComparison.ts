import type { TrainingSessionRecord } from './volumeLedger.js';

export interface TrainingSessionComparison {
  previousWorkoutId: string;
  previousDate: string;
  duration: { current: number; previous: number; delta: number };
  completedSets: { current: number; previous: number; delta: number };
  effort?: { current: number; previous: number; delta: number };
}

function totalSets(record: TrainingSessionRecord) {
  return Object.values(record.muscleSets).reduce((total, sets) => total + (sets ?? 0), 0);
}

export function compareTrainingSession(records: TrainingSessionRecord[], workoutId: string): TrainingSessionComparison | undefined {
  const current = records.find((record) => record.workoutId === workoutId);
  if (!current) return undefined;
  const normalizedTitle = current.title.trim().toLocaleLowerCase();
  const previous = records
    .filter((record) => record.workoutId !== current.workoutId && record.date < current.date && record.title.trim().toLocaleLowerCase() === normalizedTitle)
    .sort((left, right) => right.date.localeCompare(left.date) || left.workoutId.localeCompare(right.workoutId))[0];
  if (!previous) return undefined;
  const currentSets = totalSets(current);
  const previousSets = totalSets(previous);
  return {
    previousWorkoutId: previous.workoutId,
    previousDate: previous.date,
    duration: { current: current.durationMinutes, previous: previous.durationMinutes, delta: current.durationMinutes - previous.durationMinutes },
    completedSets: { current: currentSets, previous: previousSets, delta: currentSets - previousSets },
    ...(current.perceivedExertion !== undefined && previous.perceivedExertion !== undefined ? {
      effort: { current: current.perceivedExertion, previous: previous.perceivedExertion, delta: current.perceivedExertion - previous.perceivedExertion },
    } : {}),
  };
}
