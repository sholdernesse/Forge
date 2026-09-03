import { describe, expect, it, vi } from 'vitest';
import { FoodDataClient, foodDataConfig } from './foodDataClient.js';

describe('food data client', () => {
  it('authenticates search and rejects malformed provider records', async () => {
    const request = vi.fn(async () => Response.json({ foods: [
      { id: 'usda-1', source: 'usda', verification: 'government', name: 'Oats', serving: '100 g', nutritionBasis: 'per-100g', servingGrams: 100, caloriesKcal: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9 },
      { id: 'bad', name: 'Incomplete' },
    ] }));
    const client = new FoodDataClient({ baseUrl: 'https://api.forge.test', accessToken: async () => 'token' }, request as typeof fetch);
    await expect(client.search('oats')).resolves.toEqual([expect.objectContaining({ id: 'usda-1', category: 'other' })]);
    expect(request).toHaveBeenCalledWith('https://api.forge.test/v1/foods/search?q=oats', { headers: { authorization: 'Bearer token' } });
  });

  it('treats a missing barcode as an ordinary empty result', async () => {
    const client = new FoodDataClient({ baseUrl: 'https://api.forge.test', accessToken: async () => 'token' }, async () => new Response(null, { status: 404 }));
    await expect(client.barcode('0123456789012')).resolves.toBeUndefined();
  });

  it('uses the existing authenticated API origin only when configured', () => {
    expect(foodDataConfig({ VITE_FORGE_SYNC_URL: 'https://api.forge.test/' }, async () => 'token')?.baseUrl).toBe('https://api.forge.test');
    expect(foodDataConfig({})).toBeNull();
  });
});
