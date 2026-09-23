import { describe, expect, it } from 'vitest';
import { constrainedPhotoDimensions, entriesFromMealPhoto } from './MealPhotoLogger.js';

describe('meal photo logging', () => {
  it('bounds image dimensions without upscaling', () => {
    expect(constrainedPhotoDimensions(4032, 3024)).toEqual({ width: 1280, height: 960 });
    expect(constrainedPhotoDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('creates entries only from explicitly selected reviewed items', () => {
    const entries = entriesFromMealPhoto([
      { selected: true, name: 'Chicken', portionDescription: 'one breast', estimatedGrams: 151.4, confidence: .9, caloriesKcal: 248.4, proteinG: 46.54, carbsG: 0, fatG: 5.45, nutritionSource: 'usda', referenceFoodId: 'usda-1' },
      { selected: false, name: 'Oil', portionDescription: 'unknown', estimatedGrams: 10, confidence: .3, caloriesKcal: 90, proteinG: 0, carbsG: 0, fatG: 10, nutritionSource: 'ai-estimate' },
    ], '2026-09-21', 'dinner', 42);
    expect(entries).toEqual([{ id: '2026-09-21-dinner-photo-42-0', date: '2026-09-21', meal: 'dinner', name: 'Chicken', serving: '151 g estimated from photo', caloriesKcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.5, sourceFoodId: 'usda-1' }]);
  });
});
