import { describe, expect, it } from 'vitest';
import { exerciseGuide, exerciseGuideIds } from './exerciseGuides.js';

describe('exercise guides', () => {
  it('provides visual coverage for launch and planned strength movements', () => {
    expect(exerciseGuideIds()).toEqual(expect.arrayContaining([
      'barbell-bench',
      'box-squat',
      'dead-bugs',
      'dumbbell-overhead-press',
      'chest-supported-row',
      'hip-thrust',
    ]));
    for (const id of exerciseGuideIds()) {
      expect(exerciseGuide(id)?.imageSrc).toMatch(/\.(webp|svg)$/);
      expect(exerciseGuide(id)?.imageAlt.length).toBeGreaterThan(30);
    }
  });

  it('launches motion with explicit muscle intent on the overhead press pilot', () => {
    const guide = exerciseGuide('dumbbell-overhead-press')!;
    expect(guide.motionId).toBe('dumbbell-overhead-press');
    expect(guide.primaryMuscles).toEqual(['Deltoids']);
    expect(guide.secondaryMuscles).toEqual(expect.arrayContaining(['Triceps', 'upper chest']));
  });

  it('keeps every guide actionable and safety bounded', () => {
    for (const id of exerciseGuideIds()) {
      const guide = exerciseGuide(id)!;
      expect(guide.setup.length).toBeGreaterThanOrEqual(3);
      expect(guide.movement.length).toBeGreaterThanOrEqual(3);
      expect(guide.mistakes.length).toBeGreaterThanOrEqual(3);
      expect(guide.selfChecks.length).toBeGreaterThanOrEqual(3);
      expect(guide.tempo.length).toBeGreaterThan(20);
      expect(guide.breathing).toMatch(/exhale|inhale|breath|brace/i);
      expect(guide.primaryMuscles.length).toBeGreaterThan(0);
      expect(guide.secondaryMuscles.length).toBeGreaterThan(0);
      expect(guide.safetyNote).toMatch(/stop|pain|safet/i);
    }
  });

  it('gives users observable checks rather than diagnostic claims', () => {
    for (const id of exerciseGuideIds()) {
      const guide = exerciseGuide(id)!;
      expect(guide.selfChecks.join(' ')).toMatch(/front|side|behind|pressure|touch|position|range|contact|lockout/i);
      expect([...guide.setup, ...guide.movement, ...guide.selfChecks].join(' ')).not.toMatch(/diagnos|injury-free|guarantee/i);
    }
  });
});
