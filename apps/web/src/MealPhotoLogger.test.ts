import { describe, expect, it } from 'vitest';
import { combinedMacroBreakdown, constrainedPhotoDimensions, entriesFromMealPhoto, mealPhotoConfidence, mealPhotoErrorMessage } from './MealPhotoLogger.js';
import { FoodDataError } from './foodDataClient.js';

describe('meal photo logging', () => {
  it('combines selected-food macros into calorie-based percentages', () => {
    expect(combinedMacroBreakdown(40, 50, 20)).toEqual({ protein: 30, carbs: 37, fat: 33 });
    expect(combinedMacroBreakdown(0, 0, 0)).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });

  it('turns visual confidence into clear review guidance', () => {
    expect(mealPhotoConfidence(.91)).toEqual({ label: 'High confidence', tone: 'high' });
    expect(mealPhotoConfidence(.67)).toEqual({ label: 'Medium confidence', tone: 'medium' });
    expect(mealPhotoConfidence(.4)).toEqual({ label: 'Needs review', tone: 'low' });
  });

  it('turns provider diagnostics into actionable setup guidance', () => {
    expect(mealPhotoErrorMessage(new FoodDataError(503, 'provider_authentication_failed'))).toContain('OPENAI_API_KEY');
    expect(mealPhotoErrorMessage(new FoodDataError(503, 'provider_quota_or_rate_limit'))).toContain('billing');
    expect(mealPhotoErrorMessage(new FoodDataError(503, 'provider_model_unavailable'))).toContain('gpt-6-luna');
  });

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
