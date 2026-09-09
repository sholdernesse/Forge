import { describe, expect, it } from 'vitest';
import { trainingComparisonStory } from './trainingComparisonStory.js';
import type { TrainingSessionComparison } from './trainingComparison.js';

function comparison(overrides: Partial<TrainingSessionComparison> = {}): TrainingSessionComparison {
  return {
    previousWorkoutId: 'previous',
    previousDate: '2026-08-01',
    duration: { current: 45, previous: 40, delta: 5 },
    completedSets: { current: 8, previous: 7, delta: 1 },
    exercises: [],
    ...overrides,
  };
}

describe('training comparison story', () => {
  it('does not infer movement quality when both sessions are not rated', () => {
    expect(trainingComparisonStory(comparison())).toMatchObject({
      tone: 'neutral',
      headline: 'Build the next comparison',
    });
  });

  it('prioritizes rebuilding form after breakdown', () => {
    expect(trainingComparisonStory(comparison({
      movementQuality: { current: 'breakdown', previous: 'controlled', delta: -2 },
    }))).toMatchObject({
      tone: 'caution',
      headline: 'Rebuild repeatable form',
    });
  });

  it('holds load when quality declines to mixed', () => {
    expect(trainingComparisonStory(comparison({
      movementQuality: { current: 'mixed', previous: 'controlled', delta: -1 },
    })).nextStep).toContain('Hold the load');
  });

  it('recognizes improved quality with and without more completed work', () => {
    expect(trainingComparisonStory(comparison({
      movementQuality: { current: 'controlled', previous: 'mixed', delta: 1 },
    }))).toMatchObject({
      tone: 'positive',
      headline: 'Control moved forward',
      insight: 'Movement quality improved while you also completed more work.',
    });
    expect(trainingComparisonStory(comparison({
      completedSets: { current: 7, previous: 7, delta: 0 },
      movementQuality: { current: 'controlled', previous: 'mixed', delta: 1 },
    })).insight).toContain('without relying on extra');
  });

  it('distinguishes repeatable control from repeatedly mixed quality', () => {
    expect(trainingComparisonStory(comparison({
      movementQuality: { current: 'controlled', previous: 'controlled', delta: 0 },
    })).headline).toBe('Quality stayed repeatable');
    expect(trainingComparisonStory(comparison({
      movementQuality: { current: 'mixed', previous: 'mixed', delta: 0 },
    })).headline).toBe('Control held, but is not consistent yet');
  });
});
