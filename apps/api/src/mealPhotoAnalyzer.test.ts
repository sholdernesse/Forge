import { describe, expect, it, vi } from 'vitest';
import type { FoodProvider } from './foodProvider.js';
import { MealPhotoAnalysisError, OpenAiMealPhotoAnalyzer, parseDetectedMeal } from './mealPhotoAnalyzer.js';

const detected = {
  items: [{ name: 'grilled chicken breast', portionDescription: 'one sliced breast', estimatedGrams: 150, confidence: 0.86, caloriesKcal: 250, proteinG: 45, carbsG: 0, fatG: 6 }],
  assumptions: ['No added oil is visible.'],
  warnings: ['Confirm cooking fat.'],
};

describe('meal photo analysis', () => {
  it('rejects unsafe or unbounded structured output', () => {
    expect(() => parseDetectedMeal(detected)).not.toThrow();
    expect(() => parseDetectedMeal({ ...detected, items: [{ ...detected.items[0], estimatedGrams: 50_000 }] })).toThrow(/Invalid meal item/);
    expect(() => parseDetectedMeal({ ...detected, items: [] })).toThrow(/one to eight/);
  });

  it('sends a non-stored image request and enriches the estimate with USDA nutrition', async () => {
    const request = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => new Response(JSON.stringify({ output: [{ content: [{ type: 'output_text', text: JSON.stringify(detected) }] }] }), { status: 200 }));
    const foodProvider: FoodProvider = {
      search: async () => [{ id: 'usda-chicken', source: 'usda', verification: 'government', name: 'Chicken breast, grilled', serving: '100 g reference', nutritionBasis: 'per-100g', servingGrams: 100, caloriesKcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }],
      barcode: async () => undefined,
    };
    const analyzer = new OpenAiMealPhotoAnalyzer({ apiKey: 'server-secret', model: 'vision-test', foodProvider, request });
    await expect(analyzer.analyze('data:image/jpeg;base64,YWJj')).resolves.toMatchObject({
      items: [{ nutritionSource: 'usda', caloriesKcal: 248, proteinG: 46.5, referenceFoodId: 'usda-chicken' }],
    });
    const body = JSON.parse(String(request.mock.calls[0]![1]?.body));
    expect(body).toMatchObject({ model: 'vision-test', store: false });
    expect(body.input[1].content[1]).toMatchObject({ type: 'input_image', image_url: 'data:image/jpeg;base64,YWJj' });
    expect(request.mock.calls[0]![1]?.headers).toMatchObject({ authorization: 'Bearer server-secret' });
  });

  it('falls back to clearly labeled AI estimates when food lookup is unavailable', async () => {
    const request = vi.fn(async () => Response.json({ output_text: JSON.stringify(detected) }));
    const foodProvider: FoodProvider = { search: async () => { throw new Error('offline'); }, barcode: async () => undefined };
    const analyzer = new OpenAiMealPhotoAnalyzer({ apiKey: 'secret', model: 'vision-test', foodProvider, request });
    await expect(analyzer.analyze('data:image/jpeg;base64,YWJj')).resolves.toMatchObject({ items: [{ nutritionSource: 'ai-estimate', caloriesKcal: 250 }] });
  });

  it.each([
    [401, 'provider_authentication_failed'],
    [403, 'provider_access_denied'],
    [404, 'provider_model_unavailable'],
    [429, 'provider_quota_or_rate_limit'],
    [500, 'provider_unavailable'],
  ] as const)('classifies provider HTTP %s without exposing its response body', async (status, reason) => {
    const request = vi.fn(async () => new Response('provider secret detail', { status }));
    const analyzer = new OpenAiMealPhotoAnalyzer({ apiKey: 'secret', model: 'vision-test', request });
    await expect(analyzer.analyze('data:image/jpeg;base64,YWJj')).rejects.toEqual(new MealPhotoAnalysisError(reason, status));
  });

  it('classifies malformed successful responses', async () => {
    const request = vi.fn(async () => Response.json({ output: [] }));
    const analyzer = new OpenAiMealPhotoAnalyzer({ apiKey: 'secret', model: 'vision-test', request });
    await expect(analyzer.analyze('data:image/jpeg;base64,YWJj')).rejects.toEqual(new MealPhotoAnalysisError('provider_invalid_response'));
  });
});
