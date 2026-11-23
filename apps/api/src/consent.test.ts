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

describe('agreement history access and pagination', () => {
  it('retains exact earlier versions after withdrawal or a policy change, without granting access', async () => {
    const { repository, request, accept } = setup();
    await accept();
    await request('/v1/consent', 'DELETE');
    const history = await (await request('/v1/consent/history')).json();
    expect(history.events.map((e: { accepted: boolean }) => e.accepted)).toEqual([false, true]);
    expect(history.events[1].documents).toEqual(policy.documents);
    expect((await request('/v1/dashboard')).status).toBe(403);
    const changed = createApiHandler({ auth: { verify: async () => ({ id: 'alice' }) }, dashboards: new MemoryDashboardRepository(),
      consent: { required: true, repository, policy: { approved: false, documents: [] } } });
    const response = await changed(new Request('https://forge.test/v1/consent/history'));
    expect(response.status).toBe(200);
    expect((await response.json()).events[1].documents).toEqual(policy.documents);
  });
  it('uses a bounded cursor so new events cannot shift later pages or expose another account', async () => {
    const { request, accept } = setup();
    for (let i = 0; i < 25; i++) await accept();
    await accept('bob');
    const first = await (await request('/v1/consent/history')).json();
    expect(first.events).toHaveLength(20);
    expect(first.nextCursor).toBe(first.events.at(-1).eventId);
    await accept();
    const second = await (await request(`/v1/consent/history?before=${first.nextCursor}`)).json();
    expect(second.events).toHaveLength(5);
    expect(second.nextCursor).toBeNull();
    expect(new Set([...first.events, ...second.events].map(e => e.eventId)).size).toBe(25);
    const bob = await (await request('/v1/consent/history', 'GET', undefined, 'bob')).json();
    expect(bob.events).toHaveLength(1);
    const bobViaAliceCursor = await (await request(`/v1/consent/history?before=${first.nextCursor}`, 'GET', undefined, 'bob')).json();
    expect(bobViaAliceCursor.events).toEqual([]);
  });
  it('rejects invalid cursors and unauthenticated history requests', async () => {
    const { request } = setup();
    for (const cursor of ['0', '-1', 'abc', '1.2', '9223372036854775808', '1%20OR%201=1', '']) {
      expect((await request(`/v1/consent/history?before=${cursor}`)).status).toBe(400);
    }
    expect((await request('/v1/consent/history', 'GET', undefined, '')).status).toBe(401);
    expect((await request('/v1/consent/history', 'POST')).status).toBe(405);
    const response = await request('/v1/consent/history');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect((await response.json()).events).toEqual([]);
  });
  it('returns copies so modifying a downloaded receipt cannot change server acceptance', async () => {
    const { request, repository, accept } = setup();
    await accept();
    const page = await repository.history('alice');
    page.events[0]!.documents[0]!.text = 'changed by caller';
    expect((await repository.latest('alice'))!.documents).toEqual(policy.documents);
    expect((await request('/v1/dashboard')).status).toBe(404);
  });
});
