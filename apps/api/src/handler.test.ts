import { describe, expect, it } from 'vitest';
import { DevelopmentTokenVerifier } from './auth.js';
import { createApiHandler } from './handler.js';
import { MemoryDashboardRepository } from './memoryRepository.js';

const validState = {
  history: [],
  checkIn: { weightKg: 75, sleepScore: 80, sleepHours: 7, soreness: 3, stress: 2 },
};

function setup() {
  const dashboards = new MemoryDashboardRepository();
  const handle = createApiHandler({
    auth: new DevelopmentTokenVerifier('test-token', 'user-a'),
    dashboards,
    allowedOrigin: 'http://localhost:4173',
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
  });
});
