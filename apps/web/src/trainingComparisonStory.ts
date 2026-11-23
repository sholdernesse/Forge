import type { TrainingSessionComparison } from './trainingComparison.js';

export interface TrainingComparisonStory {
  tone: 'positive' | 'steady' | 'caution' | 'neutral';
  headline: string;
  insight: string;
  nextStep: string;
}

export function trainingComparisonStory(comparison: TrainingSessionComparison): TrainingComparisonStory {
  const quality = comparison.movementQuality;
  if (!quality) {
    return {
      tone: 'neutral',
      headline: 'Build the next comparison',
      insight: 'Movement quality was not rated in both workouts, so Forge will not infer whether control changed.',
      nextStep: 'Rate range and control after the next session to unlock a quality-based recommendation.',
    };
  }

  if (quality.current === 'breakdown') {
    return {
      tone: 'caution',
      headline: 'Rebuild repeatable form',
      insight: 'Form broke down in this session, so added sets or time do not count as progress yet.',
      nextStep: 'Repeat or reduce the load and use a slow tempo through a comfortable range before progressing.',
    };
  }

  if (quality.delta < 0) {
    return {
      tone: 'caution',
      headline: 'Protect control next time',
      insight: 'Movement quality slipped compared with the previous matching workout.',
      nextStep: 'Hold the load, slow the lowering phase, and stop the set when full comfortable range is no longer repeatable.',
    };
  }

  if (quality.delta > 0) {
    return {
      tone: 'positive',
      headline: 'Control moved forward',
      insight: comparison.completedSets.delta > 0
        ? 'Movement quality improved while you also completed more work.'
        : 'Movement quality improved without relying on extra completed sets.',
      nextStep: quality.current === 'controlled'
        ? 'Repeat this standard once more before making the smallest useful load or rep increase.'
        : 'Keep the workload steady and turn the mixed reps into consistently controlled reps.',
    };
  }

  if (quality.current === 'controlled') {
    return {
      tone: 'steady',
      headline: 'Quality stayed repeatable',
      insight: comparison.completedSets.delta > 0
        ? 'You kept controlled movement while completing more work.'
        : 'You matched the previous controlled-movement standard.',
      nextStep: 'Keep the same range and tempo; use effort and recovery to decide whether the next increase should be load or reps.',
    };
  }

  return {
    tone: 'steady',
    headline: 'Control held, but is not consistent yet',
    insight: 'Movement quality remained mixed across both matching workouts.',
    nextStep: 'Keep the workload steady and aim to make every working rep controlled before progressing.',
  };
}
