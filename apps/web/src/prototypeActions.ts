import type { WorkoutSession } from './workoutSession.js';

export function freshWorkoutPlan(plan: WorkoutSession, revision = Date.now()): WorkoutSession {
  const { startedAt: _startedAt, completedAt: _completedAt, ...planWithoutProgress } = plan;

  return {
    ...planWithoutProgress,
    id: `${plan.id}-revision-${revision}`,
    status: 'not-started',
    exercises: plan.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map(({ completedAt: _completedAt, ...set }) => ({ ...set })),
    })),
  };
}
