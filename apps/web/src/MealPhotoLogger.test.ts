import { describe, expect, it } from 'vitest';
import { combinedMacroBreakdown, constrainedPhotoDimensions, entriesFromMealPhoto, mealPhotoConfidence, mealPhotoErrorMessage, updateMealPhotoItem } from './MealPhotoLogger.js';
import { FoodDataError } from './foodDataClient.js';

describe('meal photo logging', () => {
  it('combines selected-food macros into calorie-based percentages', () => {
    expect(combinedMacroBreakdown(40, 50, 20)).toEqual({ protein: 30, carbs: 37, fat: 33 });
    expect(combinedMacroBreakdown(0, 0, 0)).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });

  it('turns visual confidence into clear review guidance', () => {
    expect(mealPhotoConfidence(.91)).toEqual({ label: 'High visual confidence', tone: 'high' });
    expect(mealPhotoConfidence(.67)).toEqual({ label: 'Medium visual confidence', tone: 'medium' });
    expect(mealPhotoConfidence(.4)).toEqual({ label: 'Low visual confidence', tone: 'low' });
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

  it('drops USDA attribution when a user corrects the food or nutrition', () => {
    const original = { selected: true, name: 'Chicken', portionDescription: 'one breast', estimatedGrams: 150, confidence: .9, caloriesKcal: 248, proteinG: 46, carbsG: 0, fatG: 5, nutritionSource: 'usda' as const, referenceFoodId: 'usda-1', referenceFoodName: 'Chicken breast' };
    const corrected = updateMealPhotoItem(original, 'caloriesKcal', '270');
    expect(corrected).toMatchObject({ caloriesKcal: 270, nutritionSource: 'ai-estimate', edited: true });
    expect(corrected.referenceFoodId).toBeUndefined();
    expect(entriesFromMealPhoto([corrected], '2026-09-21', 'dinner', 42)[0]?.sourceFoodId).toBeUndefined();
    expect(updateMealPhotoItem(original, 'selected', false)).toMatchObject({ nutritionSource: 'usda', referenceFoodId: 'usda-1' });
  });
  const portion = { selected: true, name: 'Chicken', portionDescription: 'one breast', estimatedGrams: 150, confidence: .9, caloriesKcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.5, nutritionSource: 'usda' as const, referenceFoodId: 'usda-1', referenceFoodName: 'Chicken breast' };

  it('scales a reviewed serving and saves matching meal totals while retaining its reference', () => {
    const corrected = updateMealPhotoItem(portion, 'estimatedGrams', '225');
    expect(corrected).toMatchObject({ estimatedGrams: 225, caloriesKcal: 372, proteinG: 69.8, carbsG: 0, fatG: 8.3, nutritionSource: 'usda', referenceFoodId: 'usda-1', portionEdited: true });
    expect(entriesFromMealPhoto([corrected], '2026-10-25', 'lunch', 42)[0]).toMatchObject({ serving: '225 g reviewed portion', caloriesKcal: 372, proteinG: 69.8 });
    expect(portion.estimatedGrams).toBe(150);
  });

  it('avoids cumulative rounding drift when a portion is adjusted repeatedly', () => {
    let corrected: ReturnType<typeof updateMealPhotoItem> = portion;
    for (const grams of ['151', '137', '213', '150']) corrected = updateMealPhotoItem(corrected, 'estimatedGrams', grams);
    expect(corrected).toMatchObject({ estimatedGrams: 150, caloriesKcal: 248, proteinG: 46.5, fatG: 5.5 });
  });

  it('uses manual macro corrections as the basis of later portion changes', () => {
    const larger = updateMealPhotoItem(portion, 'estimatedGrams', '300');
    const edited = updateMealPhotoItem(larger, 'proteinG', '80');
    const smaller = updateMealPhotoItem(edited, 'estimatedGrams', '150');
    expect(smaller).toMatchObject({ caloriesKcal: 248, proteinG: 40, nutritionSource: 'ai-estimate', edited: true });
    expect(smaller.referenceFoodId).toBeUndefined();
  });

  it('does not corrupt nutrition from blank, nonfinite, or out-of-range serving edits', () => {
    for (const value of ['', ' ', 'NaN', 'Infinity', '-1', '0', '2001']) {
      expect(updateMealPhotoItem(portion, 'estimatedGrams', value)).toBe(portion);
    }
    expect(updateMealPhotoItem(portion, 'proteinG', 'NaN')).toBe(portion);
  });

});
