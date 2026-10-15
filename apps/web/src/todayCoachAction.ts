import type { CoachActionType } from '@forge/coach';
import type { Recommendation } from '@forge/digital-twin';
import type { WorkoutStatus } from './workoutSession.js';

export interface TodayCoachAction {
  action: CoachActionType;
  label: string;
}

export function todayCoachAction(
  recommendation: Recommendation | undefined,
  workoutStatus: WorkoutStatus,
): TodayCoachAction {
  if (recommendation?.category === 'nutrition') {
    return { action: 'open-nutrition', label: 'Log today’s nutrition' };
  }
  if (recommendation?.category === 'recovery') {
    return { action: 'open-check-in', label: 'Update recovery signals' };
  }
  return {
    action: 'open-workout',
    label: workoutStatus === 'in-progress'
      ? 'Resume today’s workout'
      : workoutStatus === 'completed'
        ? 'Review today’s workout'
        : 'Start today’s workout',
  };
}
