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
      'lateral-raise',
    ]));
    for (const id of exerciseGuideIds()) {
      expect(exerciseGuide(id)?.imageSrc).toMatch(/\.(webp|svg)$/);
      expect(exerciseGuide(id)?.imageAlt.length).toBeGreaterThan(30);
      expect(exerciseGuide(id)?.muscleImageSrc).toMatch(/-muscles(?:-v\d+)?\.webp$/);
      expect(exerciseGuide(id)?.muscleImageAlt.length).toBeGreaterThan(30);
    }
  });

  it('uses the same AI-character image format for every covered exercise', () => {
    const guides = exerciseGuides();
    expect(guides.every((guide) => guide.imageSrc.endsWith('.webp'))).toBe(true);
    expect(guides.every((guide) => guide.muscleImageSrc.endsWith('.webp'))).toBe(true);
    expect(new Set(guides.map((guide) => guide.imageSrc)).size).toBe(guides.length);
    expect(new Set(guides.map((guide) => guide.muscleImageSrc)).size).toBe(guides.length);
  });

  it('keeps explicit muscle intent on the overhead press character guide', () => {
    const guide = exerciseGuide('dumbbell-overhead-press')!;
    expect(guide.imageSrc).toBe('/exercises/dumbbell-overhead-press-guide-v2.webp');
    expect(guide.primaryMuscles).toEqual(['Deltoids']);
    expect(guide.secondaryMuscles).toEqual(expect.arrayContaining(['Triceps', 'upper chest']));
  });

  it('teaches the hip hinge without turning it into a squat or forced range', () => {
    const guide = exerciseGuide('barbell-rdl')!;
    expect(guide.imageSrc).toBe('/exercises/barbell-rdl-guide-v2.webp');
    expect(guide.muscleImageSrc).toBe('/exercises/barbell-rdl-muscles-v2.webp');
    expect(guide.muscleImageAlt).toMatch(/anatomical|green|hamstring/i);
    expect(guide.primaryMuscles).toEqual(['Hamstrings', 'glutes']);
    expect(guide.secondaryMuscles).toEqual(expect.arrayContaining(['Spinal erectors', 'lats', 'forearms', 'core']));
    expect([...guide.movement, ...guide.mistakes, ...guide.selfChecks].join(' ')).toMatch(/hips backward|deep squat|mid-shin|controlled depth/i);
    expect(guide.selfChecks.join(' ')).toContain('not a required depth');
  });

  it('teaches a controlled lateral raise without prescribing forced height', () => {
    const guide = exerciseGuide('lateral-raise')!;
    expect(guide.imageSrc).toBe('/exercises/dumbbell-lateral-raise-guide.webp');
    expect(guide.primaryMuscles).toEqual(['Middle deltoids']);
    expect([...guide.movement, ...guide.mistakes].join(' ')).toMatch(/shoulder height|comfortable|swing|shrug/i);
    expect(guide.tempo).toMatch(/3 seconds/i);
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
