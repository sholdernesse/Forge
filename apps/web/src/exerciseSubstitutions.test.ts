import { describe, expect, it } from 'vitest';
import { applyExerciseSubstitution, exerciseIdsWithSubstitutions, exerciseSubstitutions } from './exerciseSubstitutions.js';
import { createTodayWorkout } from './workoutSession.js';

describe('exercise substitutions', () => {
  it('covers every exercise that launched with visual guidance', () => {
    expect(exerciseIdsWithSubstitutions()).toEqual(expect.arrayContaining([
      'barbell-bench',
      'box-squat',
      'dead-bugs',
    ]));
  });

  it('returns bounded alternatives with an explicit preserved intent', () => {
    for (const exerciseId of exerciseIdsWithSubstitutions()) {
      const alternatives = exerciseSubstitutions(exerciseId);
      expect(alternatives.length).toBeGreaterThanOrEqual(2);
      for (const alternative of alternatives) {
        expect(alternative.mode).toBe('reps');
        expect(alternative.reasons.length).toBeGreaterThan(0);
        expect(alternative.preserves.length).toBeGreaterThan(20);
      }
    }
  });

  it('does not expose mutable registry state or invent unknown substitutions', () => {
    const first = exerciseSubstitutions('barbell-bench');
    first[0]!.reasons.push('preference');
    expect(exerciseSubstitutions('barbell-bench')[0]!.reasons).not.toEqual(first[0]!.reasons);
    expect(exerciseSubstitutions('unknown-exercise')).toEqual([]);
  });

  it('preserves the set target and records origin while resetting incompatible load', () => {
    const exercise = createTodayWorkout('2026-08-12').exercises[2]!;
    exercise.sets[0]!.loadKg = 12;
    const alternative = exerciseSubstitutions('dead-bugs')[0]!;
    const result = applyExerciseSubstitution(exercise, alternative);

    expect(result).toMatchObject({
      id: 'heel-slides',
      substitutedFromId: 'dead-bugs',
      substitutedFromName: 'Dead bugs',
    });
    expect(result.sets).toHaveLength(exercise.sets.length);
    expect(result.sets[0]).toMatchObject({ id: 'heel-slides-1', reps: 10, loadKg: 0 });
  });

  it('refuses to discard completed work', () => {
    const exercise = createTodayWorkout('2026-08-12').exercises[2]!;
    exercise.sets[0]!.completedAt = '2026-08-12T12:00:00.000Z';
    expect(() => applyExerciseSubstitution(exercise, exerciseSubstitutions('dead-bugs')[0]!))
      .toThrow(/completed work/i);
  });
});
