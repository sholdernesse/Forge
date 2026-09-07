import { describe, expect, it, vi } from 'vitest';
import { FoodDataClient, FoodDataError, foodDataConfig } from './foodDataClient.js';

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

  it('preserves provider status for an actionable interface message', async () => {
    const client = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, async () => new Response(null, { status: 503 }));
    await expect(client.barcode('884912359155')).rejects.toEqual(new FoodDataError(503));
  });

  it('reports the same-origin development health route without exposing credentials', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));
    const config = foodDataConfig({ DEV: true, VITE_FORGE_SYNC_URL: 'http://localhost:8787' }, async () => 'secret');
    const client = new FoodDataClient(config!, request as typeof fetch);
    await expect(client.connectionDiagnostic()).resolves.toBe('Route /api; health 200.');
    expect(request).toHaveBeenCalledWith('/api/health');
  });

  it('keeps connection diagnostics disabled outside development', async () => {
    const request = vi.fn();
    const client = new FoodDataClient({ baseUrl: 'https://api.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);
    await expect(client.connectionDiagnostic()).resolves.toBeUndefined();
    expect(request).not.toHaveBeenCalled();
  });

  it('uses the configured API origin and the local proxy only in development', () => {
    expect(foodDataConfig({ VITE_FORGE_SYNC_URL: 'https://api.forge.test/' }, async () => 'token')?.baseUrl).toBe('https://api.forge.test');
    expect(foodDataConfig({ DEV: true }, async () => 'token')?.baseUrl).toBe('/api');
    expect(foodDataConfig({ DEV: true, VITE_FORGE_SYNC_URL: 'http://localhost:8787' }, async () => 'token')?.baseUrl).toBe('/api');
    expect(foodDataConfig({})).toBeNull();
  });
});
