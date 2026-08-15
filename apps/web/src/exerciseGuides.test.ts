import { describe, expect, it } from 'vitest';
import { exerciseGuide, exerciseGuideIds } from './exerciseGuides.js';

describe('exercise guides', () => {
  it('provides launch visuals for the primary barbell and core movements', () => {
    expect(exerciseGuideIds()).toEqual(expect.arrayContaining(['barbell-bench', 'box-squat', 'dead-bugs']));
    expect(exerciseGuide('barbell-bench')?.imageSrc).toMatch(/\.webp$/);
  });

  it('keeps every guide actionable and safety bounded', () => {
    for (const id of exerciseGuideIds()) {
      const guide = exerciseGuide(id)!;
      expect(guide.setup.length).toBeGreaterThanOrEqual(3);
      expect(guide.movement.length).toBeGreaterThanOrEqual(3);
      expect(guide.mistakes.length).toBeGreaterThanOrEqual(3);
      expect(guide.safetyNote).toMatch(/stop|pain|safet/i);
    }
  });
});
