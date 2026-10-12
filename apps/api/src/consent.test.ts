import { describe, expect, it, vi } from 'vitest';
import { createApiHandler } from './handler.js';
import { MemoryDashboardRepository } from './memoryRepository.js';
import { MemoryConsentRepository, policyDigest, consentRequired, type ConsentPolicy } from './consent.js';

const policy: ConsentPolicy = { approved: true, documents: [{ id: 'terms', version: '1', title: 'Terms', text: 'Approved test terms' }, { id: 'risk', version: '1', title: 'Risk', text: 'Approved test risks' }] };
function setup(current = policy) {
  const repository = new MemoryConsentRepository();
  const handle = createApiHandler({ auth: { verify: async token => token ? { id: token } : null }, dashboards: new MemoryDashboardRepository(),
    consent: { required: true, repository, policy: current } });
  const request = (path: string, method = 'GET', body?: unknown, user = 'alice') => handle(new Request(`https://forge.test${path}`, {
    method, headers: { authorization: user }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }));
  const accept = (user = 'alice', digest = policyDigest(current)) => request('/v1/consent', 'POST', { digest, accepted: ['terms', 'risk'], locale: 'en-US' }, user);
  return { repository, request, accept };
}
describe('account-bound consent gate', () => {
  it('always requires consent in production and rejects attempts to disable it', () => {
    expect(consentRequired({ NODE_ENV: 'production' })).toBe(true);
    expect(() => consentRequired({ NODE_ENV: 'production', FORGE_CONSENT_REQUIRED: 'false' })).toThrow('cannot be disabled');
    expect(consentRequired({ NODE_ENV: 'development' })).toBe(false);
  });
  it('blocks dashboard reads, writes, food lookup and photo processing before consent', async () => {
    const { request } = setup();
    for (const [path, method] of [['/v1/dashboard', 'GET'], ['/v1/dashboard', 'PUT'], ['/v1/foods/search?q=eggs', 'GET'], ['/v1/foods/photo-analysis', 'POST']]) {
      expect((await request(path!, method!)).status).toBe(403);
    }
    expect((await request('/health')).status).toBe(200);
    expect((await request('/v1/dashboard', 'DELETE')).status).toBe(204);
  });
  it('records server time and exact documents; a second client for that account is accepted, another account is blocked', async () => {
    const { repository, request, accept } = setup();
    expect((await accept()).status).toBe(200);
    expect(await repository.latest('alice')).toMatchObject({ accepted: true, documents: policy.documents, method: 'checkbox-and-button', locale: 'en-US' });
    expect(Date.parse((await repository.latest('alice'))!.recordedAt)).not.toBeNaN();
    expect((await request('/v1/dashboard')).status).toBe(404);
    expect((await request('/v1/dashboard', 'GET', undefined, 'bob')).status).toBe(403);
    expect((await (await request('/v1/consent')).json()).accepted).toBe(true);
  });
  it('rejects stale, incomplete, malformed, unauthenticated and unapproved acceptance', async () => {
    const { request, accept } = setup();
    expect((await accept('alice', 'old-version')).status).toBe(409);
    expect((await request('/v1/consent', 'POST', { digest: policyDigest(policy), accepted: ['terms'], locale: 'en' })).status).toBe(400);
    expect((await request('/v1/consent', 'POST', null)).status).toBe(409);
    expect((await request('/v1/consent', 'POST', {}, '')).status).toBe(401);
    expect((await setup({ ...policy, approved: false }).accept()).status).toBe(503);
  });
  it('invalidates acceptance on document edits and withdrawal', async () => {
    const { repository, request, accept } = setup();
    await accept();
    const changed = { ...policy, documents: policy.documents.map(d => ({ ...d, text: d.text + ' updated' })) };
    const next = createApiHandler({ auth: { verify: async () => ({ id: 'alice' }) }, dashboards: new MemoryDashboardRepository(), consent: { required: true, repository, policy: changed } });
    expect((await next(new Request('https://forge.test/v1/dashboard'))).status).toBe(403);
    expect((await request('/v1/consent', 'DELETE')).status).toBe(200);
    expect((await request('/v1/dashboard')).status).toBe(403);
    expect((await request('/v1/dashboard', 'DELETE')).status).toBe(204);
  });
  it('does not confirm acceptance when persistence fails', async () => {
    const { repository, accept } = setup();
    vi.spyOn(repository, 'append').mockRejectedValue(new Error('database unavailable'));
    await expect(accept()).rejects.toThrow('database unavailable');
    expect(await repository.latest('alice')).toBeNull();
  });
});
