import { describe, expect, it } from 'vitest';
import { exerciseGuide, exerciseGuideIds, exerciseGuides } from './exerciseGuides.js';

describe('exercise guides', () => {
  it('provides visual coverage for launch and planned strength movements', () => {
    expect(exerciseGuideIds()).toEqual(expect.arrayContaining([
      'barbell-bench',
      'box-squat',
      'dead-bugs',
      'dumbbell-overhead-press',
      'chest-supported-row',
      'hip-thrust',
      'barbell-rdl',
    ]));
    for (const id of exerciseGuideIds()) {
      expect(exerciseGuide(id)?.imageSrc).toMatch(/\.(webp|svg)$/);
      expect(exerciseGuide(id)?.imageAlt.length).toBeGreaterThan(30);
    }
  });

  it('uses the same AI-character image format for every covered exercise', () => {
    const guides = exerciseGuides();
    expect(guides.every((guide) => guide.imageSrc.endsWith('.webp'))).toBe(true);
    expect(new Set(guides.map((guide) => guide.imageSrc)).size).toBe(guides.length);
  });

  it('keeps explicit muscle intent on the overhead press character guide', () => {
    const guide = exerciseGuide('dumbbell-overhead-press')!;
    expect(guide.imageSrc).toBe('/exercises/dumbbell-overhead-press-guide-v2.webp');
    expect(guide.primaryMuscles).toEqual(['Deltoids']);
    expect(guide.secondaryMuscles).toEqual(expect.arrayContaining(['Triceps', 'upper chest']));
  });

  it('teaches the hip hinge without turning it into a squat or forced range', () => {
    const guide = exerciseGuide('barbell-rdl')!;
    expect(guide.imageSrc).toBe('/exercises/barbell-rdl-guide.webp');
    expect(guide.primaryMuscles).toEqual(['Hamstrings', 'glutes']);
    expect([...guide.movement, ...guide.mistakes, ...guide.selfChecks].join(' ')).toMatch(/hips backward|deep squat|controlled depth/i);
  });

  it('returns a non-mutating catalog for library exploration', () => {
    const catalog = exerciseGuides();
    catalog[0]!.primaryMuscles.push('mutated');
    catalog[0]!.setup[0] = 'mutated';
    expect(exerciseGuide(catalog[0]!.exerciseId)?.primaryMuscles).not.toContain('mutated');
    expect(exerciseGuide(catalog[0]!.exerciseId)?.setup[0]).not.toBe('mutated');
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
