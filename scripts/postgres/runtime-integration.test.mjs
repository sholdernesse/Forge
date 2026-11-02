import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { PostgresWindowRateLimiter } from '../../apps/api/dist/postgresRateLimiter.js';
import { PostgresDashboardRepository } from '../../apps/api/dist/postgresRepository.js';
import { PostgresConsentRepository } from '../../apps/api/dist/postgresConsentRepository.js';
import { PostgresBetaRepository } from '../../apps/api/dist/postgresBetaRepository.js';
const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
const { Pool } = require('pg');

test('durable rolling photo quota is atomic across replicas and repositories share one owned pool', { skip: !process.env.DATABASE_URL }, async () => {
  const url = new URL(process.env.DATABASE_URL);
  assert.equal(process.env.FORGE_DATABASE_TESTS, 'isolated');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  assert.equal(url.pathname, '/forge_test');
  const schema = 'runtime_test_' + randomUUID().replaceAll('-', '');
  const admin = new Pool({ connectionString: url.href, ssl: false, max: 1 });
  const config = { connectionString: url.href, ssl: false, max: 2, options: '-c search_path=' + schema };
  const replicaA = new Pool(config);
  const replicaB = new Pool(config);
  try {
    await admin.query(`CREATE SCHEMA "${schema}"`);
    for (let repeat = 0; repeat < 2; repeat++) for (const migration of [
      '001_dashboard_snapshots.sql', '002_consent_events.sql', '003_beta_invitations.sql', '004_meal_photo_limits.sql',
    ]) await replicaA.query(await readFile(new URL('../../apps/api/migrations/' + migration, import.meta.url), 'utf8'));
    const a = new PostgresWindowRateLimiter(replicaA, 3, 60_000);
    const b = new PostgresWindowRateLimiter(replicaB, 3, 60_000);
    const results = await Promise.all(Array.from({ length: 12 }, (_, index) => (index % 2 ? a : b).allow('alice')));
    assert.equal(results.filter(Boolean).length, 3);
    assert.equal(await new PostgresWindowRateLimiter(replicaB, 3, 60_000).allow('alice'), false, 'restarting an instance cannot reset quota');
    assert.equal(await b.allow('bob'), true, 'another subject has an independent quota');
    await replicaA.query("UPDATE meal_photo_limits SET attempts = ARRAY[statement_timestamp() - interval '61 seconds'] WHERE user_id = $1", ['alice']);
    assert.equal(await a.allow('alice'), true, 'expired attempts leave the rolling window');
    const dashboards = new PostgresDashboardRepository(replicaA);
    const consents = new PostgresConsentRepository(replicaA);
    const beta = new PostgresBetaRepository(replicaA);
    await dashboards.put('test', { test: true });
    assert.deepEqual((await dashboards.get('test')).state, { test: true });
    await Promise.all([dashboards.close(), consents.close(), beta.close()]);
    assert.equal((await replicaA.query('SELECT 1 AS alive')).rows[0].alive, 1, 'borrowers must not close the shared pool');
    assert.equal((await beta.invitation('missing')), null);
  } finally {
    await Promise.all([replicaA.end(), replicaB.end()]);
    try { await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); } finally { await admin.end(); }
  }
});
