import { describe, expect, it } from 'vitest';
import { buildDigitalTwin } from '@forge/digital-twin';
import { demoGoals, demoHistory, demoProfile } from './demoData.js';
import { demoTrainingPreferences, generateTrainingPlan } from './trainingPlanner.js';

function twinWith(sleepScore: number, sessions: number) {
  const history = demoHistory.map((day, index) => {
    const { trainingMinutes: _trainingMinutes, ...rest } = day;
    return index < sessions ? { ...rest, sleepScore, trainingMinutes: 45 } : { ...rest, sleepScore };
  });
  return buildDigitalTwin({ profile: demoProfile, goals: demoGoals, history, asOfDate: '2026-08-12', now: '2026-08-12T12:00:00.000Z' });
}

describe('adaptive training planner', () => {
  it('selects recovery work when readiness is suppressed', () => {
    expect(generateTrainingPlan(twinWith(35, 2), demoTrainingPreferences)).toMatchObject({ planType: 'recovery', intensity: 'low' });
  });

  it('selects an upper strength day and protects the elbow when ready', () => {
    const plan = generateTrainingPlan(twinWith(95, 2), demoTrainingPreferences);
    expect(plan.planType).toBe('upper-strength');
    expect(plan.exercises.find((exercise) => exercise.id === 'dumbbell-overhead-press')?.detail).toContain('Neutral grip');
  });

  it('selects back-conscious lower exercises on the alternating session', () => {
    const plan = generateTrainingPlan(twinWith(95, 3), demoTrainingPreferences);
    expect(plan.planType).toBe('lower-strength');
    expect(plan.exercises.map((exercise) => exercise.id)).toContain('hip-thrust');
    expect(plan.exercises.map((exercise) => exercise.id)).not.toContain('romanian-deadlift');
  });
});
