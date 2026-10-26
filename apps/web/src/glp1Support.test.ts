import { describe, expect, it } from 'vitest';
import { applyGlp1TrainingSupport, defaultGlp1Support, glp1TrainingGuidance, isGlp1SupportProfile, type Glp1SupportProfile } from './glp1Support.js';
import type { WorkoutSession } from './workoutSession.js';

function activeProfile(overrides: Partial<Glp1SupportProfile> = {}): Glp1SupportProfile {
  return { ...defaultGlp1Support(new Date('2026-09-28T12:00:00.000Z')), enabled: true, prescribedDose: '0.5 mg', ...overrides };
}

const workout: WorkoutSession = {
  id: 'workout-1', date: '2026-09-28', title: 'Strength', status: 'not-started', planType: 'upper-strength', intensity: 'high', planReason: 'Readiness is strong.',
  exercises: Array.from({ length: 5 }, (_, exerciseIndex) => ({
    id: `exercise-${exerciseIndex}`, name: `Exercise ${exerciseIndex}`, detail: 'Controlled', mode: 'reps' as const, restSeconds: 60,
    sets: Array.from({ length: 4 }, (_, setIndex) => ({ id: `set-${exerciseIndex}-${setIndex}`, reps: 10, loadKg: 20 })),
  })),
};

describe('GLP-1 support', () => {
  it('validates a bounded support profile', () => {
    expect(isGlp1SupportProfile(activeProfile())).toBe(true);
    expect(isGlp1SupportProfile({ ...activeProfile(), prescribedDose: 'x'.repeat(81) })).toBe(false);
  });

  it('reduces volume and intensity when moderate symptoms are recorded', () => {
    const profile = activeProfile({ severity: 'moderate', sideEffects: ['nausea', 'fatigue'] });
    const adapted = applyGlp1TrainingSupport(workout, profile);
    expect(glp1TrainingGuidance(profile).mode).toBe('conservative');
    expect(adapted.intensity).toBe('low');
    expect(adapted.exercises).toHaveLength(4);
    expect(adapted.exercises[0]?.sets).toHaveLength(3);
    expect(adapted.exercises[0]?.restSeconds).toBe(90);
  });

  it('flags severe or concerning symptoms for recovery and clinical review', () => {
    expect(glp1TrainingGuidance(activeProfile({ severity: 'severe', sideEffects: ['vomiting'] }))).toMatchObject({ mode: 'recovery', needsClinicalReview: true });
    expect(glp1TrainingGuidance(activeProfile({ severity: 'moderate', sideEffects: ['abdominal-pain'] }))).toMatchObject({ mode: 'recovery', needsClinicalReview: true });
  });

  it('keeps strength work central when support is active without limiting symptoms', () => {
    const adapted = applyGlp1TrainingSupport(workout, activeProfile({ severity: 'mild', sideEffects: ['reduced-appetite'] }));
    expect(adapted.exercises).toHaveLength(5);
    expect(adapted.planReason).toContain('resistance training remains prioritized');
  });
});
