import type { TrainingSessionRecord } from './volumeLedger.js';

export interface WorkoutCarryForward {
  sourceDate: string;
  tone: 'ready' | 'control' | 'caution';
  headline: string;
  action: string;
}

export function workoutCarryForward(
  records: TrainingSessionRecord[],
  workoutTitle: string,
  workoutDate: string,
): WorkoutCarryForward | undefined {
  const normalizedTitle = workoutTitle.trim().toLocaleLowerCase();
  const previous = records
    .filter((record) => record.date < workoutDate && record.title.trim().toLocaleLowerCase() === normalizedTitle)
    .sort((left, right) => right.date.localeCompare(left.date) || right.workoutId.localeCompare(left.workoutId))[0];
  if (!previous) return undefined;

  if (previous.discomfort === 'stopped') {
    return {
      sourceDate: previous.date,
      tone: 'caution',
      headline: 'Return conservatively',
      action: 'Start lighter than last time and stop if discomfort returns or changes your movement.',
    };
  }

  if (previous.movementQuality === 'breakdown') {
    return {
      sourceDate: previous.date,
      tone: 'caution',
      headline: 'Rebuild the movement',
      action: 'Reduce the load and own a slow, full comfortable range before adding work.',
    };
  }

  if (previous.discomfort === 'mild') {
    return {
      sourceDate: previous.date,
      tone: 'caution',
      headline: 'Check comfort first',
      action: 'Use the warm-up to confirm a comfortable range before matching the previous workload.',
    };
  }

  if (previous.movementQuality === 'mixed') {
    return {
      sourceDate: previous.date,
      tone: 'control',
      headline: 'Make every rep repeatable',
      action: 'Hold the workload, slow the lowering phase, and stop the set when control changes.',
    };
  }

  if (previous.movementQuality === 'controlled') {
    return {
      sourceDate: previous.date,
      tone: 'ready',
      headline: 'Repeat the quality standard',
      action: previous.perceivedExertion !== undefined && previous.perceivedExertion <= 8
        ? 'Match the same range and tempo, then use the smallest useful rep or load increase.'
        : 'Match the same range and tempo before adding reps or load.',
    };
  }

  return {
    sourceDate: previous.date,
    tone: 'control',
    headline: 'Set today’s baseline',
    action: 'Use a full comfortable range and record movement quality when the session ends.',
  };
}
