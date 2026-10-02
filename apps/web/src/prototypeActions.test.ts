import { describe, expect, it } from 'vitest';
import { createTodayWorkout } from './workoutSession.js';
import { freshWorkoutPlan } from './prototypeActions.js';

describe('prototype actions', () => {
  it('creates a clean revision without mutating the generated plan', () => {
    const plan = createTodayWorkout('2026-08-12');
    plan.status = 'completed';
    plan.startedAt = '2026-08-12T10:00:00Z';
    plan.completedAt = '2026-08-12T11:00:00Z';
    plan.exercises[0]!.sets[0]!.completedAt = '2026-08-12T10:30:00Z';
    const fresh = freshWorkoutPlan(plan, 42);
    expect(fresh).toMatchObject({ status: 'not-started', id: '2026-08-12-recovery-session-revision-42' });
    expect(fresh.startedAt).toBeUndefined();
    expect(fresh.completedAt).toBeUndefined();
    expect(fresh.exercises[0]!.sets[0]!.completedAt).toBeUndefined();
    expect(plan.status).toBe('completed');
  });
});
