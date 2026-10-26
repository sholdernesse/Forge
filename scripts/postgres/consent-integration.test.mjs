import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createRequire } from 'node:module';
import { manageInvitation, parseInvitationCommand } from '../beta/invitation-admin.mjs';
import { createApiHandler } from '../../apps/api/dist/handler.js';
import { PostgresConsentRepository } from '../../apps/api/dist/postgresConsentRepository.js';
import { PostgresBetaRepository } from '../../apps/api/dist/postgresBetaRepository.js';
import { MemoryDashboardRepository } from '../../apps/api/dist/memoryRepository.js';
import { policyDigest } from '../../apps/api/dist/consent.js';
const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { Pool, Client } = require('pg');

function isolatedDatabase(environment) {
  if (environment.FORGE_DATABASE_TESTS !== 'isolated' || !environment.DATABASE_URL) throw new Error('Explicit isolated database test configuration is required');
  const url = new URL(environment.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/forge_test') throw new Error('Consent integration tests require a loopback forge_test database');
  return environment.DATABASE_URL;
}

test('integration refuses unmarked or non-isolated databases', () => {
  assert.throws(() => isolatedDatabase({}), /isolated/);
  assert.throws(() => isolatedDatabase({ FORGE_DATABASE_TESTS: 'isolated', DATABASE_URL: 'postgresql://user:password@remote.example/forge_test' }), /loopback/);
  assert.throws(() => isolatedDatabase({ FORGE_DATABASE_TESTS: 'isolated', DATABASE_URL: 'postgresql://user:password@localhost/forge' }), /loopback/);
});

test('PostgreSQL migration, durable account consent and historical receipts', { skip: !process.env.DATABASE_URL }, async () => {
  const connectionString = isolatedDatabase(process.env);
  const schema = `consent_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString, ssl: false, max: 1 });
  let repository;
  let betaRepository;
  let migration;
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    const config = { connectionString, ssl: false, options: `-c search_path=${schema}`, max: 2 };
    migration = new Pool(config);
    for (let repeat = 0; repeat < 2; repeat++) {
      for (const file of ['001_dashboard_snapshots.sql', '002_consent_events.sql', '003_beta_invitations.sql']) {
        await migration.query(await readFile(new URL(`../../apps/api/migrations/${file}`, import.meta.url), 'utf8'));
      }
    }
    betaRepository = new PostgresBetaRepository(config);
    await migration.query('INSERT INTO beta_invitations (user_id, country) VALUES ($1, $2)', ['beta-tester', 'AU']);
    assert.equal((await betaRepository.invitation('beta-tester')).adultConfirmedAt, null);
    assert.equal(await betaRepository.confirmAdult('other-account', 'AU'), false);
    assert.equal(await betaRepository.confirmAdult('beta-tester', 'US'), false);
    assert.equal(await betaRepository.confirmAdult('beta-tester', 'AU'), true);
    const confirmed = (await betaRepository.invitation('beta-tester')).adultConfirmedAt;
    await betaRepository.close();
    betaRepository = new PostgresBetaRepository(config);
    assert.equal((await betaRepository.invitation('beta-tester')).adultConfirmedAt, confirmed);
    assert.equal(await betaRepository.confirmAdult('beta-tester', 'AU'), true);
    assert.equal((await betaRepository.invitation('beta-tester')).adultConfirmedAt, confirmed);
    await migration.query('UPDATE beta_invitations SET revoked = true WHERE user_id = $1', ['beta-tester']);
    assert.equal(await betaRepository.confirmAdult('beta-tester', 'AU'), false);
    const connectAdmin = async () => { const client = new Client(config); await client.connect(); return client; };
    const issue = parseInvitationCommand(['invite', '--subject', 'beta-tester', '--apply'], {});
    // Reinviting a prior-country/revoked account must clear its old age confirmation.
    const invited = await manageInvitation(issue, connectAdmin);
    assert.equal(invited.country, 'US');
    assert.equal(invited.adultConfirmed, false);
    assert.equal(await betaRepository.confirmAdult('beta-tester', 'US'), true);
    const firstConfirmation = (await betaRepository.invitation('beta-tester')).adultConfirmedAt;
    await manageInvitation(issue, connectAdmin);
    assert.equal((await betaRepository.invitation('beta-tester')).adultConfirmedAt, firstConfirmation);
    await manageInvitation({ ...issue, action: 'revoke' }, connectAdmin);
    assert.equal((await betaRepository.invitation('beta-tester')).revoked, true);
    await manageInvitation(issue, connectAdmin);
    assert.equal((await betaRepository.invitation('beta-tester')).adultConfirmedAt, null);
    repository = new PostgresConsentRepository(config);
    const policy = { approved: true, documents: [{ id: 'terms', version: 'test-1', title: 'Test terms', text: 'Exact isolated test text' }] };
    const handler = createApiHandler({ auth: { verify: async token => token ? { id: token } : null }, dashboards: new MemoryDashboardRepository(),
      consent: { required: true, repository, policy } });
    const request = (path, method = 'GET', user = 'alice', body) => handler(new Request(`http://test.local${path}`, {
      method, headers: { authorization: user }, ...(body ? { body: JSON.stringify(body) } : {}),
    }));
    const accept = () => request('/v1/consent', 'POST', 'alice', { digest: policyDigest(policy), accepted: ['terms'], locale: 'en-US' });
    assert.equal((await request('/v1/dashboard')).status, 403);
    assert.equal((await accept()).status, 200);
    await repository.close();
    repository = new PostgresConsentRepository(config);
    // The handler below simulates another server/device using the same durable database.
    const secondServer = createApiHandler({ auth: { verify: async () => ({ id: 'alice' }) }, dashboards: new MemoryDashboardRepository(),
      consent: { required: true, repository, policy } });
    assert.equal((await secondServer(new Request('http://test.local/v1/dashboard'))).status, 404);
    assert.deepEqual((await repository.latest('alice')).documents, policy.documents);
    assert.equal(await repository.latest('bob'), null);
    await repository.append('alice', { ...(await repository.latest('alice')), accepted: false, method: 'withdrawal', recordedAt: new Date().toISOString() });
    assert.equal((await secondServer(new Request('http://test.local/v1/dashboard'))).status, 403);
    const events = await repository.history('alice');
    assert.deepEqual(events.events.map(e => e.accepted), [false, true]);
    assert.deepEqual(events.events[1].documents, policy.documents);
    // More than a page, plus an insertion between pages, exercises real bigint cursor queries.
    const record = { digest: policyDigest(policy), accepted: true, method: 'checkbox-and-button', recordedAt: new Date().toISOString(), documents: policy.documents, locale: 'en-US' };
    for (let i = 0; i < 25; i++) await repository.append('alice', record);
    await repository.append('bob', record);
    const first = await repository.history('alice');
    assert.equal(first.events.length, 20);
    assert.ok(first.events.every((event, index) => index === 0 || BigInt(event.eventId) < BigInt(first.events[index - 1].eventId)), 'PostgreSQL must order numeric IDs, not their text aliases');
    await repository.append('alice', record);
    const second = await repository.history('alice', first.nextCursor);
    assert.equal(second.events.length, 7);
    assert.equal(second.nextCursor, null);
    assert.equal(new Set([...first.events, ...second.events].map(e => e.eventId)).size, 27);
    assert.equal((await repository.history('bob')).events.length, 1);
    assert.equal((await repository.history('bob', first.nextCursor)).events.length, 0);
  } finally {
    await repository?.close();
    await betaRepository?.close();
    await migration?.end();
    try { await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } finally { await admin.end(); }
  }
});
