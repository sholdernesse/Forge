import { describe, expect, it } from 'vitest';
import { applyExerciseSubstitution, exerciseIdsWithSubstitutions, exerciseSubstitutions } from './exerciseSubstitutions.js';
import { createTodayWorkout } from './workoutSession.js';

describe('exercise substitutions', () => {
  it('covers every exercise in the launch workout roster', () => {
    expect(exerciseIdsWithSubstitutions()).toEqual(expect.arrayContaining([
      'zone-2-treadmill',
      'mobility-flow',
      'barbell-bench',
      'chest-supported-row',
      'dumbbell-overhead-press',
      'lateral-raise',
      'band-face-pull',
      'box-squat',
      'hip-thrust',
      'split-squat',
      'standing-calf-raise',
      'dead-bugs',
    ]));
  });

  it('returns bounded alternatives with an explicit preserved intent', () => {
    for (const exerciseId of exerciseIdsWithSubstitutions()) {
      const alternatives = exerciseSubstitutions(exerciseId);
      expect(alternatives.length).toBeGreaterThanOrEqual(2);
      for (const alternative of alternatives) {
        expect(['duration', 'reps']).toContain(alternative.mode);
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

  it('supports a second swap and a return to the original plan', () => {
    const original = createTodayWorkout('2026-08-12').exercises[2]!;
    const firstSwap = applyExerciseSubstitution(original, exerciseSubstitutions(original.id)[0]!);
    const secondOption = exerciseSubstitutions(firstSwap.id).find((item) => item.id === 'bird-dog')!;
    const secondSwap = applyExerciseSubstitution(firstSwap, secondOption);

    expect(secondSwap.substitutedFromId).toBe('dead-bugs');
    const originalOption = exerciseSubstitutions(secondSwap.id).find((item) => item.id === 'dead-bugs')!;
    const restored = applyExerciseSubstitution(secondSwap, originalOption);
    expect(restored).toMatchObject({ id: 'dead-bugs', name: 'Dead bugs' });
    expect(restored.substitutedFromId).toBeUndefined();
    expect(restored.substitutedFromName).toBeUndefined();
  });
});
