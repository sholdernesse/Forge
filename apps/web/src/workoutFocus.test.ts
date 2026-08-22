import { describe, expect, it } from 'vitest';
import { workoutCarryForward } from './workoutFocus.js';
import type { TrainingSessionRecord } from './volumeLedger.js';

function record(overrides: Partial<TrainingSessionRecord> = {}): TrainingSessionRecord {
  return {
    workoutId: 'previous',
    date: '2026-08-10',
    title: 'Upper Strength',
    durationMinutes: 45,
    muscleSets: { chest: 4, back: 4 },
    ...overrides,
  };
}

describe('workout carry-forward focus', () => {
  it('uses the latest earlier matching workout regardless of title casing', () => {
    expect(workoutCarryForward([
      record({ workoutId: 'older', date: '2026-08-01', movementQuality: 'mixed' }),
      record({ workoutId: 'latest', date: '2026-08-10', title: ' upper strength ', movementQuality: 'controlled', perceivedExertion: 8 }),
    ], 'Upper Strength', '2026-08-12')).toMatchObject({
      sourceDate: '2026-08-10',
      tone: 'ready',
      headline: 'Repeat the quality standard',
    });
  });

  it('prioritizes a stopped-discomfort signal over movement quality', () => {
    expect(workoutCarryForward([
      record({ discomfort: 'stopped', movementQuality: 'controlled' }),
    ], 'Upper Strength', '2026-08-12')).toMatchObject({
      tone: 'caution',
      headline: 'Return conservatively',
    });
  });

  it('prioritizes breakdown and mild discomfort before workload', () => {
    expect(workoutCarryForward([
      record({ movementQuality: 'breakdown' }),
    ], 'Upper Strength', '2026-08-12')?.headline).toBe('Rebuild the movement');
    expect(workoutCarryForward([
      record({ discomfort: 'mild', movementQuality: 'controlled' }),
    ], 'Upper Strength', '2026-08-12')?.headline).toBe('Check comfort first');
  });

  it('holds workload after mixed movement quality', () => {
    expect(workoutCarryForward([
      record({ movementQuality: 'mixed' }),
    ], 'Upper Strength', '2026-08-12')?.action).toContain('Hold the workload');
  });

  it('uses unrated history to request a baseline instead of inferring quality', () => {
    expect(workoutCarryForward([
      record(),
    ], 'Upper Strength', '2026-08-12')).toMatchObject({
      tone: 'control',
      headline: 'Set today’s baseline',
    });
  });

  it('returns nothing when there is no earlier matching workout', () => {
    expect(workoutCarryForward([
      record({ title: 'Lower body' }),
      record({ date: '2026-08-12' }),
    ], 'Upper Strength', '2026-08-12')).toBeUndefined();
  });
});
