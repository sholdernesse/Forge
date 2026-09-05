import { describe, expect, it } from 'vitest';
import type { OnboardingProfile } from './onboarding.js';
import { nextBlockProposal, startingBlockFor, startingBlockReview } from './startingBlock.js';
import type { TrainingSessionRecord } from './volumeLedger.js';

const profile: OnboardingProfile = {
  version: 1, completedAt: '2026-08-01T14:00:00.000Z', primaryGoal: 'build-muscle-strength', experience: 'some-experience',
  weeklyTrainingDays: 4, sessionMinutes: 45, location: 'home', equipment: ['bodyweight', 'dumbbells'], constraints: [],
  nutritionApproach: 'simple-guidance', age: 40, sex: 'unspecified', heightCm: 175, weightKg: 78,
};

describe('four-week starting block', () => {
  it('shows the current phase from the approved-plan date', () => {
    const block = startingBlockFor(profile, '2026-08-10');
    expect(block.currentWeek).toBe(2);
    expect(block.weeks.map((week) => week.status)).toEqual(['complete', 'current', 'upcoming', 'upcoming']);
  });

  it('caps the visible foundation block at week four', () => {
    const block = startingBlockFor(profile, '2026-10-01');
    expect(block.currentWeek).toBe(4);
    expect(block.reviewReady).toBe(true);
  });

  it('keeps progression behind repeatable movement quality', () => {
    const block = startingBlockFor(profile, '2026-08-15');
    expect(block.weeks[2]?.focus).toContain('form stays steady');
    expect(block.purpose).toContain('strength base before adding load');
  });

  it('uses compact calibration language for experienced users', () => {
    const block = startingBlockFor({ ...profile, experience: 'experienced' }, '2026-08-01');
    expect(block.weeks[0]?.title).toBe('Calibrate');
    expect(block.weeks[2]?.focus).toContain('reps or load');
  });

  it('waits for four full weeks before reviewing the block', () => {
    expect(startingBlockReview(profile, '2026-08-28', [])).toBeUndefined();
  });

  it('recommends progression only with adherence and controlled movement evidence', () => {
    const records: TrainingSessionRecord[] = Array.from({ length: 12 }, (_, index) => ({
      workoutId: `workout-${index}`,
      date: `2026-08-${String(index + 1).padStart(2, '0')}`,
      title: 'Strength',
      durationMinutes: 45,
      muscleSets: { chest: 4 },
      movementQuality: index < 10 ? 'controlled' : 'mixed',
      discomfort: 'none',
    }));
    const review = startingBlockReview(profile, '2026-08-30', records);
    expect(review?.tone).toBe('ready');
    expect(review?.adherencePct).toBe(75);
    expect(review?.nextStep).toContain('approve');
  });

  it('holds progression when discomfort or breakdown is present', () => {
    const records: TrainingSessionRecord[] = [{ workoutId: 'w1', date: '2026-08-10', title: 'Strength', durationMinutes: 40, muscleSets: { chest: 4 }, movementQuality: 'breakdown', discomfort: 'stopped' }];
    const review = startingBlockReview(profile, '2026-08-30', records);
    expect(review?.tone).toBe('repeat');
    expect(review?.nextStep).toContain('before adding load');
  });

  it('does not invent progression from missing feedback', () => {
    const records: TrainingSessionRecord[] = [{ workoutId: 'w1', date: '2026-08-10', title: 'Strength', durationMinutes: 40, muscleSets: { chest: 4 } }];
    expect(startingBlockReview(profile, '2026-08-30', records)?.tone).toBe('needs-evidence');
  });

  it('proposes progression without activating it when evidence is ready', () => {
    const proposal = nextBlockProposal(profile, {
      sessions: 12, plannedSessions: 16, adherencePct: 75, qualityCoveragePct: 100, controlledPct: 84,
      discomfortSessions: 0, tone: 'ready', headline: 'Ready', nextStep: 'Review and approve.',
    });
    expect(proposal).toMatchObject({ number: 2, approach: 'progress', actionLabel: 'Approve block 2' });
    expect(profile.trainingBlock).toBeUndefined();
  });

  it('recommends repeating rather than progressing when evidence is incomplete', () => {
    const proposal = nextBlockProposal(profile, {
      sessions: 4, plannedSessions: 16, adherencePct: 25, qualityCoveragePct: 25,
      discomfortSessions: 0, tone: 'needs-evidence', headline: 'More evidence', nextStep: 'Repeat.',
    });
    expect(proposal).toMatchObject({ number: 2, approach: 'repeat' });
  });

  it('anchors an approved later block to its own start date and number', () => {
    const laterProfile: OnboardingProfile = { ...profile, trainingBlock: { number: 2, startedAt: '2026-09-01T12:00:00.000Z', approach: 'progress' } };
    const block = startingBlockFor(laterProfile, '2026-09-10');
    expect(block.title).toBe('Training block 2');
    expect(block.currentWeek).toBe(2);
    expect(startingBlockReview(laterProfile, '2026-09-20', [])).toBeUndefined();
  });
});
