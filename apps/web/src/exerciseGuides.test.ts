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
      'band-face-pull',
      'push-up',
      'standing-calf-raise',
      'split-squat',
      'reverse-lunge',
      'prone-y-raise',
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

  it('pairs the face pull with an anchored movement and rear anatomy view', () => {
    const guide = exerciseGuide('band-face-pull')!;
    expect(guide.imageSrc).toBe('/exercises/band-face-pull-guide.webp');
    expect(guide.muscleImageSrc).toBe('/exercises/band-face-pull-muscles.webp');
    expect(guide.primaryMuscles).toEqual(expect.arrayContaining(['Rear deltoids', 'rhomboids', 'middle trapezius']));
    expect([...guide.setup, ...guide.movement, ...guide.mistakes].join(' ')).toMatch(/anchor|external|shrug|lean/i);
  });

  it('teaches a push-up as one controlled head-to-heel unit', () => {
    const guide = exerciseGuide('push-up')!;
    expect(guide.imageSrc).toBe('/exercises/push-up-guide.webp');
    expect(guide.muscleImageSrc).toBe('/exercises/push-up-muscles.webp');
    expect(guide.primaryMuscles).toEqual(['Chest', 'triceps']);
    expect([...guide.setup, ...guide.movement, ...guide.mistakes, ...guide.selfChecks].join(' ')).toMatch(/head.*heel|30–45|sag|elevated/i);
  });

  it('teaches a supported calf raise without bounce or ankle roll', () => {
    const guide = exerciseGuide('standing-calf-raise')!;
    expect(guide.imageSrc).toBe('/exercises/standing-calf-raise-guide.webp');
    expect(guide.muscleImageSrc).toBe('/exercises/standing-calf-raise-muscles.webp');
    expect(guide.primaryMuscles).toEqual(['Gastrocnemius', 'soleus']);
    expect([...guide.setup, ...guide.movement, ...guide.mistakes, guide.safetyNote].join(' ')).toMatch(/stable block|rack|bounce|roll|without added load/i);
  });

  it('teaches a stationary split squat with stable stance and lead-leg control', () => {
    const guide = exerciseGuide('split-squat')!;
    expect(guide.imageSrc).toBe('/exercises/dumbbell-split-squat-guide.webp');
    expect(guide.muscleImageSrc).toBe('/exercises/dumbbell-split-squat-muscles.webp');
    expect(guide.primaryMuscles).toEqual(['Quadriceps', 'glutes']);
    expect([...guide.setup, ...guide.movement, ...guide.mistakes, ...guide.selfChecks].join(' ')).toMatch(/parallel tracks|lead knee|whole lead foot|walking lunge/i);
  });

  it('distinguishes a step-back reverse lunge from the stationary split squat', () => {
    const guide = exerciseGuide('reverse-lunge')!;
    expect(guide.imageSrc).toBe('/exercises/reverse-lunge-guide.webp');
    expect(guide.muscleImageSrc).toBe('/exercises/reverse-lunge-muscles.webp');
    expect(guide.primaryMuscles).toEqual(['Quadriceps', 'glutes']);
    expect([...guide.setup, ...guide.movement, ...guide.mistakes, ...guide.selfChecks].join(' ')).toMatch(/step.*back|stationary lead|whole lead foot|forward lunge/i);
  });

  it('teaches the prone Y raise without turning it into a row or shrug', () => {
    const guide = exerciseGuide('prone-y-raise')!;
    expect(guide.imageSrc).toBe('/exercises/prone-y-raise-guide.webp');
    expect(guide.muscleImageSrc).toBe('/exercises/prone-y-raise-muscles.webp');
    expect(guide.primaryMuscles).toEqual(['Lower trapezius', 'rear deltoids']);
    expect([...guide.setup, ...guide.movement, ...guide.mistakes, ...guide.selfChecks].join(' ')).toMatch(/thumbs|chest.*pad|shrug|T raise|even Y/i);
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
