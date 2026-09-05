import { describe, expect, it } from 'vitest';
import type { ExercisePerformance } from './progression.js';
import { strengthProgressInsight } from './strengthInsight.js';
import type { TrainingSessionRecord } from './volumeLedger.js';

const sessions: TrainingSessionRecord[] = Array.from({ length: 12 }, (_, index) => ({ workoutId: `w${index}`, date: `2026-08-${String(index + 1).padStart(2, '0')}`, title: 'Strength', durationMinutes: 45, muscleSets: { chest: 4 } }));
const movement = (maxes: number[], quality: ExercisePerformance['movementQuality'] = 'controlled'): ExercisePerformance[] => maxes.map((estimatedOneRepMax, index) => ({ exerciseId: 'bench', exerciseName: 'Bench press', date: `2026-08-${String(index * 8 + 1).padStart(2, '0')}`, reps: 8, loadKg: 60, estimatedOneRepMax, movementQuality: quality }));

describe('strength progress insight', () => {
  it('requires a baseline before describing progress', () => {
    expect(strengthProgressInsight([], [], 3, '2026-08-30').status).toBe('baseline');
  });

  it('does not call inconsistent exposure a plateau', () => {
    const insight = strengthProgressInsight(movement([75, 75, 75, 75]), sessions.slice(0, 2), 3, '2026-08-30');
    expect(insight.status).toBe('consistency');
  });

  it('recognizes measured progress with controlled movement', () => {
    const insight = strengthProgressInsight(movement([75, 77, 79, 81]), sessions, 3, '2026-08-30');
    expect(insight.status).toBe('progressing');
    expect(insight.evidence).toContain('+8%');
  });

  it('requires enough quality ratings before plateau language', () => {
    const unrated = movement([75, 75, 75, 75]).map((entry, index) => {
      if (index === 0) return entry;
      const { movementQuality: _movementQuality, ...withoutRating } = entry;
      return withoutRating;
    });
    expect(strengthProgressInsight(unrated, sessions, 3, '2026-08-30').status).toBe('quality');
  });

  it('identifies a potential plateau only after repeated controlled exposure across three weeks', () => {
    const insight = strengthProgressInsight(movement([75, 75, 76, 76]), sessions, 3, '2026-08-30');
    expect(insight.status).toBe('plateau');
    expect(insight.headline).toContain('Potential plateau');
    expect(insight.nextStep).toContain('one training variable');
  });
});
