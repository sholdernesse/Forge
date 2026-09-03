import { describe, expect, it, vi } from 'vitest';
import { HybridFoodProvider } from './foodProvider.js';

describe('hybrid food provider', () => {
  it('normalizes USDA search results without exposing the provider key', async () => {
    let requestedUrl = '';
    const request = vi.fn(async (input: string | URL | Request) => { requestedUrl = String(input); return Response.json({ foods: [{ fdcId: 123, description: 'Greek yogurt', brandName: 'Example', servingSize: 170, servingSizeUnit: 'g', foodNutrients: [{ nutrientName: 'Energy', value: 100 }, { nutrientName: 'Protein', value: 17 }, { nutrientName: 'Carbohydrate, by difference', value: 6 }, { nutrientName: 'Total lipid (fat)', value: 0 }] }] }); });
    const provider = new HybridFoodProvider('server-secret', request as typeof fetch);
    await expect(provider.search('yogurt')).resolves.toEqual([expect.objectContaining({ id: 'usda-123', name: 'Greek yogurt', proteinG: 17, verification: 'government' })]);
    expect(requestedUrl).toContain('server-secret');
  });

  it('normalizes an Open Food Facts barcode and labels community data', async () => {
    const request = vi.fn(async () => Response.json({ status: 1, product: { product_name: 'Cereal', brands: 'Example', serving_size: '40 g', nutriments: { 'energy-kcal_serving': 150, proteins_serving: 5, carbohydrates_serving: 28, fat_serving: 2, fiber_serving: 4, sodium_serving: 0.2 } } }));
    const provider = new HybridFoodProvider(undefined, request as typeof fetch);
    await expect(provider.barcode('0123456789012')).resolves.toEqual(expect.objectContaining({ id: 'off-0123456789012', sodiumMg: 200, verification: 'community' }));
  });

  it('returns no remote search results when USDA is not configured', async () => {
    const request = vi.fn();
    await expect(new HybridFoodProvider(undefined, request).search('oats')).resolves.toEqual([]);
    expect(request).not.toHaveBeenCalled();
  });
});
