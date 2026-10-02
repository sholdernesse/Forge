import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeDeploymentUrl, smokeCandidate, validateReleaseConfig } from './candidate-smoke-lib.mjs';

const commit = 'a'.repeat(40);
const security = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(self), microphone=(), geolocation=()',
  'x-frame-options': 'DENY',
};

function response(body, { status = 200, type = 'text/html', headers = {} } = {}) {
  return new Response(body, { status, headers: { 'content-type': type, ...security, ...headers } });
}

function healthyFetch(url) {
  const path = new URL(url).pathname;
  if (path === '/health') return Promise.resolve(response(JSON.stringify({ status: 'ok', capabilities: { mealPhotoAnalysis: true } }), { type: 'application/json' }));
  if (path === '/release-config.json') return Promise.resolve(response(JSON.stringify({ releaseSha: commit, supportEmail: 'support@forge.test' }), { type: 'application/json', headers: { 'cache-control': 'no-store' } }));
  if (path === '/v1/dashboard') return Promise.resolve(response('{}', { status: 401, type: 'application/json' }));
  if (path.startsWith('/assets/')) return Promise.resolve(response('asset', { type: 'text/javascript', headers: { 'cache-control': 'public, max-age=31536000, immutable' } }));
  return Promise.resolve(response('<div id="root"></div><script src="/assets/app-123.js"></script>', { headers: { 'cache-control': 'no-store' } }));
}

test('normalizes an HTTPS deployment URL', () => {
  assert.equal(normalizeDeploymentUrl('https://forge.test/'), 'https://forge.test');
  assert.throws(() => normalizeDeploymentUrl('http://forge.test'), /HTTPS/);
  assert.throws(() => normalizeDeploymentUrl('https://user:secret@forge.test'), /credentials/);
});

test('validates release identity and support contact', () => {
  assert.doesNotThrow(() => validateReleaseConfig({ releaseSha: commit, supportEmail: 'support@forge.test' }, commit));
  assert.throws(() => validateReleaseConfig({ releaseSha: 'b'.repeat(40), supportEmail: 'support@forge.test' }, commit), /does not match/);
  assert.throws(() => validateReleaseConfig({ releaseSha: commit, supportEmail: 'missing' }, commit), /support email/);
});

test('passes a healthy deployed candidate', async () => {
  const result = await smokeCandidate({ deploymentUrl: 'https://forge.test', expectedCommit: commit, fetchImpl: healthyFetch });
  assert.equal(result.releaseSha, commit);
  assert.deepEqual(result.checks, [
    'API health and meal-photo capability',
    'release identity and support contact',
    'public pages and SPA fallback',
    'versioned asset caching',
    'anonymous dashboard denial',
  ]);
});

test('blocks a candidate missing route-level security headers', async () => {
  const fetchImpl = async (url) => {
    const result = await healthyFetch(url);
    if (new URL(url).pathname !== '/privacy') return result;
    return response('<div id="root"></div>', { headers: { 'cache-control': 'no-store', 'x-frame-options': '' } });
  };
  await assert.rejects(() => smokeCandidate({ deploymentUrl: 'https://forge.test', expectedCommit: commit, fetchImpl }), /x-frame-options/);
});
