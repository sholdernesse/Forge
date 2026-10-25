import { describe, expect, it } from 'vitest';
import { betaCountries, betaRequired, type BetaInvitation, type BetaRepository } from './betaAccess.js';
import { createApiHandler } from './handler.js';
import { MemoryDashboardRepository } from './memoryRepository.js';

function setup() {
  const invitations = new Map<string, BetaInvitation>([['alice', { country: 'AU', adultConfirmedAt: null, revoked: false }]]);
  const repository: BetaRepository = {
    invitation: async id => invitations.get(id) ?? null,
    confirmAdult: async (id, country) => {
      const invite = invitations.get(id);
      if (!invite || invite.revoked || invite.country !== country) return false;
      invite.adultConfirmedAt ??= new Date().toISOString(); return true;
    },
  };
  const countries = new Set(['AU', 'US']);
  const handle = createApiHandler({ auth: { verify: async token => token ? { id: token } : null }, dashboards: new MemoryDashboardRepository(), beta: { required: true, countries, repository } });
  const request = (path = '/v1/beta', method = 'GET', user = 'alice', body?: unknown) => handle(new Request(`http://api.test${path}`, {
    method, headers: user ? { authorization: user } : {}, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
  return { invitations, countries, request };
}

describe('international adult beta admission', () => {
  it('requires invitations in production and starts with no enabled countries', () => {
    expect(betaRequired({ NODE_ENV: 'production', FORGE_BETA_REQUIRED: 'false' })).toBe(true);
    expect(betaRequired({ NODE_ENV: 'development' })).toBe(false);
    expect(betaRequired({ FORGE_BETA_REQUIRED: 'true' })).toBe(true);
    expect([...betaCountries(undefined)]).toEqual([]);
    expect([...betaCountries(' us, au,US ')]).toEqual(['US', 'AU']);
    expect(() => betaCountries('ALL')).toThrow();
  });
  it('denies anonymous access and never exposes another account invitation', async () => {
    const { request } = setup();
    expect((await request('/v1/beta', 'GET', '')).status).toBe(401);
    expect(await (await request('/v1/beta', 'GET', 'bob')).json()).toMatchObject({ invited: false, country: null, admitted: false });
    expect((await request('/v1/dashboard', 'GET', 'bob')).status).toBe(403);
  });
  it('requires affirmative adulthood and the invitation country before personal access', async () => {
    const { request } = setup();
    expect((await request('/v1/dashboard')).status).toBe(403);
    for (const body of [{ country: 'AU' }, { country: 'AU', adultConfirmed: false }, { country: 'AU', adultConfirmed: 'true' }]) {
      expect((await request('/v1/beta', 'POST', 'alice', body)).status).toBe(400);
    }
    expect((await request('/v1/beta', 'POST', 'alice', { country: 'US', adultConfirmed: true })).status).toBe(403);
    expect(await (await request('/v1/beta', 'POST', 'alice', { country: 'AU', adultConfirmed: true })).json()).toMatchObject({ admitted: true });
    expect((await request('/v1/dashboard')).status).toBe(404);
  });
  it('cannot self-invite or confirm on behalf of another account', async () => {
    const { request } = setup();
    expect((await request('/v1/beta', 'POST', 'bob', { userId: 'alice', country: 'AU', adultConfirmed: true })).status).toBe(403);
    expect(await (await request()).json()).toMatchObject({ adultConfirmed: false });
  });
  it('enforces revocation and country pauses immediately on every personal route', async () => {
    const { request, invitations, countries } = setup();
    await request('/v1/beta', 'POST', 'alice', { country: 'AU', adultConfirmed: true });
    countries.delete('AU');
    expect((await request('/v1/dashboard')).status).toBe(403);
    expect((await request('/v1/foods/search?q=oats')).status).toBe(403);
    expect((await request('/v1/foods/photo-analysis', 'POST', 'alice', {})).status).toBe(403);
    expect((await request('/v1/beta', 'POST', 'alice', { country: 'AU', adultConfirmed: true })).status).toBe(400);
    countries.add('AU'); invitations.get('alice')!.revoked = true;
    expect((await request('/v1/dashboard')).status).toBe(403);
    expect((await request('/v1/dashboard', 'DELETE')).status).toBe(204);
    // Consent history is reachable; 503 means the test did not configure a repository, rather than beta denying it.
    expect((await request('/v1/consent/history')).status).toBe(503);
  });
  it('rejects oversized enrollment submissions and unsupported methods', async () => {
    const { request } = setup();
    expect((await request('/v1/beta', 'POST', 'alice', { padding: 'a'.repeat(1025) })).status).toBe(413);
    expect((await request('/v1/beta', 'PUT')).status).toBe(405);
  });
  it('never substitutes beta admission for current legal consent', async () => {
    const handle = createApiHandler({
      auth: { verify: async () => ({ id: 'alice' }) }, dashboards: new MemoryDashboardRepository(),
      beta: { required: true, countries: new Set(['AU']), repository: {
        invitation: async () => ({ country: 'AU', adultConfirmedAt: '2026-10-25T12:00:00Z', revoked: false }), confirmAdult: async () => true,
      } },
      consent: { required: true, policy: { approved: true, documents: [{ id: 'terms', title: 'Test', version: '1', text: 'Test only' }] }, repository: {
        latest: async () => null, append: async () => undefined, history: async () => ({ events: [], nextCursor: null }),
      } },
    });
    const request = (path: string, method = 'GET') => handle(new Request(`http://api.test${path}`, { method }));
    expect(await (await request('/v1/beta')).json()).toMatchObject({ admitted: true });
    expect(await (await request('/v1/dashboard')).json()).toMatchObject({ error: 'consent_required' });
    expect((await request('/v1/consent')).status).toBe(200);
    expect((await request('/v1/consent', 'DELETE')).status).toBe(200);
  });

});
