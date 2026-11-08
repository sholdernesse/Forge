import { describe, expect, it, vi } from 'vitest';
import { FoodDataClient, FoodDataError, foodDataConfig } from './foodDataClient.js';

describe('food data client', () => {
  it('authenticates search and rejects malformed provider records', async () => {
    const request = vi.fn(async () => Response.json({ foods: [
      { id: 'usda-1', source: 'usda', verification: 'government', name: 'Oats', serving: '100 g', nutritionBasis: 'per-100g', servingGrams: 100, caloriesKcal: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9, fiberG: 10.6, ironMg: 4.7, potassiumMg: 429 },
      { id: 'bad', name: 'Incomplete' },
      { id: 'usda-2', source: 'usda', verification: 'government', name: 'Invalid nutrient', serving: '100 g', nutritionBasis: 'per-100g', caloriesKcal: 100, proteinG: 1, carbsG: 2, fatG: 3, calciumMg: -10 },
    ] }));
    const client = new FoodDataClient({ baseUrl: 'https://api.forge.test', accessToken: async () => 'token' }, request as typeof fetch);
    await expect(client.search('oats')).resolves.toEqual([
      expect.objectContaining({ id: 'usda-1', category: 'other', fiberG: 10.6, ironMg: 4.7, potassiumMg: 429 }),
      expect.not.objectContaining({ calciumMg: expect.anything() }),
    ]);
    expect(request).toHaveBeenCalledWith('https://api.forge.test/v1/foods/search?q=oats', { headers: { authorization: 'Bearer token' }, signal: expect.any(AbortSignal) });
  });

  it('treats a missing barcode as an ordinary empty result', async () => {
    const client = new FoodDataClient({ baseUrl: 'https://api.forge.test', accessToken: async () => 'token' }, async () => new Response(null, { status: 404 }));
    await expect(client.barcode('0123456789012')).resolves.toBeUndefined();
  });

  it('preserves provider status for an actionable interface message', async () => {
    const client = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, async () => new Response(null, { status: 503 }));
    await expect(client.barcode('884912359155')).rejects.toEqual(new FoodDataError(503));
  });

  it('posts an authenticated meal photo and validates the structured result', async () => {
    const request = vi.fn(async () => Response.json({ analysis: { items: [{ name: 'Chicken', portionDescription: 'one breast', estimatedGrams: 150, confidence: .9, caloriesKcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.4, nutritionSource: 'usda', referenceFoodId: 'usda-1' }], assumptions: [], warnings: ['Confirm oil.'] } }));
    const client = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, request as typeof fetch);
    await expect(client.analyzeMealPhoto('data:image/jpeg;base64,YWJj')).resolves.toMatchObject({ items: [{ name: 'Chicken', nutritionSource: 'usda' }] });
    expect(request).toHaveBeenCalledWith('/api/v1/foods/photo-analysis', { method: 'POST', headers: { authorization: 'Bearer token', 'content-type': 'application/json' }, body: JSON.stringify({ imageDataUrl: 'data:image/jpeg;base64,YWJj' }), signal: expect.any(AbortSignal) });
  });

  it('preserves a safe meal-photo provider failure reason', async () => {
    const client = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, async () => Response.json({ error: 'meal_photo_analysis_failed', reason: 'provider_quota_or_rate_limit' }, { status: 503 }));
    await expect(client.analyzeMealPhoto('data:image/jpeg;base64,YWJj')).rejects.toEqual(new FoodDataError(503, 'provider_quota_or_rate_limit'));
  });

  it('checks meal-photo capability before opening the camera workflow', async () => {
    const available = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, async () => Response.json({ capabilities: { mealPhotoAnalysis: true } }));
    const unavailable = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, async () => Response.json({ capabilities: { mealPhotoAnalysis: false } }));
    const unreachable = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, async () => { throw new TypeError('fetch failed'); });
    await expect(available.mealPhotoAvailable()).resolves.toBe(true);
    await expect(unavailable.mealPhotoAvailable()).resolves.toBe(false);
    await expect(unreachable.mealPhotoAvailable()).resolves.toBe(false);
  });

  it('reports the same-origin development health route without exposing credentials', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));
    const config = foodDataConfig({ DEV: true, VITE_FORGE_SYNC_URL: 'http://localhost:8787' }, async () => 'secret');
    const client = new FoodDataClient(config!, request as typeof fetch);
    await expect(client.connectionDiagnostic()).resolves.toBe('Route /api; health 200.');
    expect(request).toHaveBeenCalledWith('/api/health', { signal: expect.any(AbortSignal) });
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
  function waitingRequest(_url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return new Promise((_resolve, reject) => {
      const signal = init!.signal!;
      if (signal.aborted) reject(signal.reason);
      else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
  }

  it('cancels an obsolete food search and clears its timer', async () => {
    vi.useFakeTimers();
    try {
      const caller = new AbortController();
      const client = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, waitingRequest);
      const result = client.search('oats', caller.signal);
      const assertion = expect(result).rejects.toMatchObject({ name: 'AbortError' });
      await Promise.resolve();
      caller.abort();
      await assertion;
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('bounds slow food lookups and health checks without retrying', async () => {
    vi.useFakeTimers();
    try {
      const request = vi.fn(waitingRequest);
      const client = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, request);
      const lookup = expect(client.barcode('0123456789012')).rejects.toEqual(new FoodDataError(408, 'request_timeout'));
      await vi.advanceTimersByTimeAsync(15_000);
      await lookup;
      const capability = client.mealPhotoAvailable();
      await vi.advanceTimersByTimeAsync(10_000);
      await expect(capability).resolves.toBe(false);
      expect(request).toHaveBeenCalledTimes(2);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('keeps photo analysis within its longer window and allows caller cancellation', async () => {
    vi.useFakeTimers();
    try {
      const caller = new AbortController();
      const request = vi.fn(waitingRequest);
      const client = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, request);
      const result = expect(client.analyzeMealPhoto('data:image/jpeg;base64,YWJj', caller.signal)).rejects.toMatchObject({ name: 'AbortError' });
      await vi.advanceTimersByTimeAsync(90_000);
      caller.abort();
      await result;
      expect(request).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it('does not send a canceled request after delayed token acquisition', async () => {
    let resolveToken!: (value: string) => void;
    const request = vi.fn();
    const caller = new AbortController();
    const client = new FoodDataClient({ baseUrl: '/api', accessToken: () => new Promise(resolve => { resolveToken = resolve; }) }, request);
    const result = expect(client.search('oats', caller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    caller.abort();
    resolveToken('token');
    await result;
    expect(request).not.toHaveBeenCalled();
  });

  it('keeps the timeout active while reading a stalled response body', async () => {
    vi.useFakeTimers();
    try {
      const request: typeof fetch = async (_url, init) => ({
        ok: true,
        json: () => new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason), { once: true })),
      } as Response);
      const client = new FoodDataClient({ baseUrl: '/api', accessToken: async () => 'token' }, request);
      const result = expect(client.search('oats')).rejects.toEqual(new FoodDataError(408, 'request_timeout'));
      await vi.advanceTimersByTimeAsync(15_000);
      await result;
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

});
