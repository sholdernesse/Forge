import { describe, expect, it, vi } from 'vitest';
import { DevelopmentTokenVerifier } from './auth.js';
import { createApiHandler } from './handler.js';
import { MemoryDashboardRepository } from './memoryRepository.js';
import type { FoodProvider } from './foodProvider.js';
import type { DashboardAuditEvent } from './audit.js';
import { createAuditRecorder } from './audit.js';
import type { MealPhotoAnalyzer } from './mealPhotoAnalyzer.js';

const validState = {
  history: [],
  checkIn: { weightKg: 75, sleepScore: 80, sleepHours: 7, soreness: 3, stress: 2 },
};
const validMealPhoto = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(125)]).toString('base64')}`;

function setup(foodProvider?: FoodProvider, auditLines?: string[], mealPhotoAnalyzer?: MealPhotoAnalyzer) {
  const dashboards = new MemoryDashboardRepository();
  const handle = createApiHandler({
    auth: new DevelopmentTokenVerifier('test-token', 'user-a'),
    dashboards,
    allowedOrigin: 'http://localhost:4173',
    ...(foodProvider ? { foodProvider } : {}),
    ...(mealPhotoAnalyzer ? { mealPhotoAnalyzer } : {}),
    ...(auditLines ? { audit: createAuditRecorder('a'.repeat(32), (line) => auditLines.push(line)) } : {}),
  });
  return { dashboards, handle };
}

describe('dashboard API', () => {
  it('requires authentication and isolates state by verified subject', async () => {
    const { handle } = setup();
    const unauthorized = await handle(new Request('http://api.test/v1/dashboard'));
    expect(unauthorized.status).toBe(401);

    const missing = await handle(new Request('http://api.test/v1/dashboard', { headers: { authorization: 'Bearer test-token' } }));
    expect(missing.status).toBe(404);
  });

  it('creates, reads, and conditionally updates a dashboard', async () => {
    const { handle } = setup();
    const headers = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    const created = await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers, body: JSON.stringify({ state: validState }) }));
    expect(created.status).toBe(200);
    const first = await created.json() as { revision: string };

    const loaded = await handle(new Request('http://api.test/v1/dashboard', { headers: { authorization: 'Bearer test-token' } }));
    await expect(loaded.json()).resolves.toMatchObject({ state: validState, revision: first.revision });

    const updated = await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers: { ...headers, 'if-match': first.revision }, body: JSON.stringify({ state: { ...validState, savedAt: 'now' } }) }));
    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.not.toMatchObject({ revision: first.revision });
  });

  it('rejects stale writes, malformed state, and untrusted origins', async () => {
    const { handle } = setup();
    const headers = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers, body: JSON.stringify({ state: validState }) }));

    const stale = await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers: { ...headers, 'if-match': 'stale' }, body: JSON.stringify({ state: validState }) }));
    expect(stale.status).toBe(412);
    await expect(stale.json()).resolves.toMatchObject({
      error: 'revision_conflict',
      current: { revision: expect.any(String), updatedAt: expect.any(String) },
    });
    const invalid = await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers, body: JSON.stringify({ state: { history: [] } }) }));
    expect(invalid.status).toBe(400);
    const preflight = await handle(new Request('http://api.test/v1/dashboard', { method: 'OPTIONS', headers: { origin: 'https://evil.test' } }));
    expect(preflight.status).toBe(403);
  });

  it('returns CORS headers only for the configured web origin', async () => {
    const { handle } = setup();
    const response = await handle(new Request('http://api.test/health', { headers: { origin: 'http://localhost:4173' } }));
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:4173');
    await expect(response.json()).resolves.toMatchObject({ status: 'ok', capabilities: { mealPhotoAnalysis: false } });
  });

  it('provides authenticated normalized food search and barcode routes', async () => {
    const food = { id: 'usda-1', source: 'usda' as const, verification: 'government' as const, name: 'Oats', serving: '100 g', nutritionBasis: 'per-100g' as const, caloriesKcal: 389, proteinG: 16.9, carbsG: 66.3, fatG: 6.9 };
    const provider: FoodProvider = { search: async () => [food], barcode: async () => ({ ...food, id: 'off-1', source: 'open-food-facts', verification: 'community', barcode: '0123456789012' }) };
    const { handle } = setup(provider);
    const headers = { authorization: 'Bearer test-token' };

    const search = await handle(new Request('http://api.test/v1/foods/search?q=oats', { headers }));
    expect(search.status).toBe(200);
    await expect(search.json()).resolves.toMatchObject({ foods: [{ name: 'Oats' }], provider: 'usda' });

    const barcode = await handle(new Request('http://api.test/v1/foods/barcode/0123456789012', { headers }));
    expect(barcode.status).toBe(200);
    await expect(barcode.json()).resolves.toMatchObject({ food: { verification: 'community' } });
  });

  it('bounds food queries and fails closed when a provider is unavailable', async () => {
    const provider: FoodProvider = { search: async () => { throw new Error('offline'); }, barcode: async () => undefined };
    const { handle } = setup(provider);
    const headers = { authorization: 'Bearer test-token' };
    expect((await handle(new Request('http://api.test/v1/foods/search?q=x', { headers }))).status).toBe(400);
    expect((await handle(new Request('http://api.test/v1/foods/search?q=oats', { headers }))).status).toBe(503);
    expect((await handle(new Request('http://api.test/v1/foods/barcode/12345678', { headers }))).status).toBe(404);
  });

  it('analyzes an authenticated meal photo without persisting the image', async () => {
    const analyze = vi.fn(async () => ({ items: [{ name: 'Chicken', portionDescription: 'one breast', estimatedGrams: 150, confidence: 0.9, caloriesKcal: 248, proteinG: 46.5, carbsG: 0, fatG: 5.4, nutritionSource: 'usda' as const }], assumptions: [], warnings: ['Confirm cooking oil.'] }));
    const { handle } = setup(undefined, undefined, { analyze });
    const response = await handle(new Request('http://api.test/v1/foods/photo-analysis', { method: 'POST', headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' }, body: JSON.stringify({ imageDataUrl: validMealPhoto }) }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ analysis: { items: [{ name: 'Chicken', nutritionSource: 'usda' }] } });
    expect(analyze).toHaveBeenCalledWith(validMealPhoto);
  });

  it('rejects invalid, oversized, unavailable, and unauthenticated photo analysis', async () => {
    const analyze = vi.fn(async () => ({ items: [], assumptions: [], warnings: [] }));
    const { handle } = setup(undefined, undefined, { analyze });
    const route = 'http://api.test/v1/foods/photo-analysis';
    expect((await handle(new Request(route, { method: 'POST' }))).status).toBe(401);
    expect((await handle(new Request(route, { method: 'POST', headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' }, body: JSON.stringify({ imageDataUrl: 'not-an-image' }) }))).status).toBe(400);
    expect((await handle(new Request(route, { method: 'POST', headers: { authorization: 'Bearer test-token', 'content-type': 'application/json', 'content-length': '1000001' }, body: '{}' }))).status).toBe(413);
    const unavailable = setup().handle;
    expect((await unavailable(new Request(route, { method: 'POST', headers: { authorization: 'Bearer test-token' }, body: '{}' }))).status).toBe(503);
    expect(analyze).not.toHaveBeenCalled();
  });

  it('rate-limits billable meal-photo calls by authenticated subject', async () => {
    const analyze = vi.fn(async () => ({ items: [{ name: 'Food', portionDescription: 'one serving', estimatedGrams: 100, confidence: .5, caloriesKcal: 100, proteinG: 5, carbsG: 10, fatG: 4, nutritionSource: 'ai-estimate' as const }], assumptions: [], warnings: [] }));
    const dashboards = new MemoryDashboardRepository();
    const handle = createApiHandler({ auth: new DevelopmentTokenVerifier('test-token', 'user-a'), dashboards, mealPhotoAnalyzer: { analyze }, mealPhotoRateLimiter: { allow: () => false } });
    const response = await handle(new Request('http://api.test/v1/foods/photo-analysis', { method: 'POST', headers: { authorization: 'Bearer test-token', 'content-type': 'application/json' }, body: JSON.stringify({ imageDataUrl: validMealPhoto }) }));
    expect(response.status).toBe(429);
    expect(analyze).not.toHaveBeenCalled();
  });

  it('audits accepted, conflicting, and rejected dashboard writes without state or subject data', async () => {
    const auditLines: string[] = [];
    const { handle } = setup(undefined, auditLines);
    const headers = { authorization: 'Bearer test-token', 'content-type': 'application/json', 'x-request-id': 'request-1' };
    const created = await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers, body: JSON.stringify({ state: validState }) }));
    const first = await created.json() as { revision: string };
    await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers: { ...headers, 'if-match': 'stale' }, body: JSON.stringify({ state: validState }) }));
    await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers, body: '{' }));
    const events = auditLines.map((line) => JSON.parse(line) as DashboardAuditEvent);
    expect(events.map(({ outcome, reason }) => ({ outcome, reason }))).toEqual([
      { outcome: 'accepted', reason: 'saved' },
      { outcome: 'conflict', reason: 'revision_conflict' },
      { outcome: 'rejected', reason: 'invalid_json' },
    ]);
    expect(first.revision).toBeTruthy();
    expect(auditLines.join(' ')).not.toContain('user-a');
    expect(auditLines.join(' ')).not.toContain('sleepScore');
  });

  it('deletes only the authenticated dashboard and records the outcome', async () => {
    const auditLines: string[] = [];
    const { dashboards, handle } = setup(undefined, auditLines);
    const headers = { authorization: 'Bearer test-token', 'content-type': 'application/json', 'x-request-id': 'request-delete' };
    await handle(new Request('http://api.test/v1/dashboard', { method: 'PUT', headers, body: JSON.stringify({ state: validState }) }));
    await dashboards.put('user-b', { ...validState, owner: 'user-b' });
    const deleted = await handle(new Request('http://api.test/v1/dashboard', { method: 'DELETE', headers }));
    expect(deleted.status).toBe(204);
    await expect(dashboards.get('user-a')).resolves.toBeNull();
    await expect(dashboards.get('user-b')).resolves.toMatchObject({ state: { owner: 'user-b' } });
    expect(JSON.parse(auditLines.at(-1)!)).toMatchObject({ event: 'audit.dashboard.delete', outcome: 'deleted' });

    const repeated = await handle(new Request('http://api.test/v1/dashboard', { method: 'DELETE', headers }));
    expect(repeated.status).toBe(204);
    expect(JSON.parse(auditLines.at(-1)!)).toMatchObject({ event: 'audit.dashboard.delete', outcome: 'absent' });
  });
});
