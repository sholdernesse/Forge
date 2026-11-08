import { describe, expect, it, vi } from 'vitest';
import { HybridFoodProvider } from './foodProvider.js';
import { OpenAiMealPhotoAnalyzer } from './mealPhotoAnalyzer.js';
const detected = { items: [{ name: 'rice', portionDescription: 'bowl', estimatedGrams: 100, confidence: 0.7, caloriesKcal: 130, proteinG: 3, carbsG: 28, fatG: 0 }], assumptions: [], warnings: [] };
describe('food provider budgets and reuse', () => {
  it('bounds stalled search and barcode body reads and aborts the underlying request', async () => {
    const signals: AbortSignal[] = [];
    const request = vi.fn(async (_url, init) => {
      signals.push(init.signal);
      return { ok: true, json: () => new Promise(() => undefined) } as unknown as Response;
    });
    const provider = new HybridFoodProvider('test', request, { timeoutMs: 15 });
    await expect(provider.search('rice')).rejects.toMatchObject({ name: 'TimeoutError' });
    await expect(provider.barcode('123456789012')).rejects.toMatchObject({ name: 'TimeoutError' });
    expect(signals.every(signal => signal.aborted)).toBe(true);
  });
  it('deduplicates identical searches, returns isolated copies, expires and bounds its cache', async () => {
    let now = 0;
    const request = vi.fn(async () => Response.json({ foods: [{ fdcId: 1, description: 'Rice', foodNutrients: [] }] }));
    const provider = new HybridFoodProvider('test', request, { now: () => now });
    const [first, second] = await Promise.all([provider.search(' Rice '), provider.search('rice')]);
    expect(request).toHaveBeenCalledTimes(1);
    first[0]!.name = 'changed';
    expect(second[0]!.name).toBe('Rice');
    expect((await provider.search('rice'))[0]!.name).toBe('Rice');
    now = 300_001;
    await provider.search('rice');
    expect(request).toHaveBeenCalledTimes(2);
    for (let i = 0; i < 128; i++) await provider.search('food-' + i);
    await provider.search('rice');
    expect(request).toHaveBeenCalledTimes(131);
  });
  it('does not cache provider failures', async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(Response.json({ foods: [] }));
    const provider = new HybridFoodProvider('test', request);
    await expect(provider.search('rice')).rejects.toThrow();
    await expect(provider.search('rice')).resolves.toEqual([]);
    expect(request).toHaveBeenCalledTimes(2);
  });
  it('keeps photo results available when reference enrichment never returns', async () => {
    vi.useFakeTimers();
    try {
      const analyzer = new OpenAiMealPhotoAnalyzer({ apiKey: 'test', model: 'test',
        request: async () => Response.json({ output_text: JSON.stringify(detected) }),
        foodProvider: { search: () => new Promise(() => undefined), barcode: async () => undefined } });
      const result = analyzer.analyze('data:image/jpeg;base64,test');
      await vi.advanceTimersByTimeAsync(5_001);
      await expect(result).resolves.toMatchObject({ items: [{ nutritionSource: 'ai-estimate', caloriesKcal: 130 }] });
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it('bounds the entire vision response, including stalled JSON, without retries', async () => {
    let signal: AbortSignal | undefined;
    const request = vi.fn(async (_url, init) => {
      signal = init.signal;
      return { ok: true, json: () => new Promise(() => undefined) } as unknown as Response;
    });
    const analyzer = new OpenAiMealPhotoAnalyzer({ apiKey: 'test', model: 'test', request, timeoutMs: 15 });
    await expect(analyzer.analyze('data:image/jpeg;base64,test')).rejects.toMatchObject({ reason: 'provider_timeout' });
    expect(signal?.aborted).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
