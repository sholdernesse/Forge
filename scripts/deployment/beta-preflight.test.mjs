import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { betaPreflight, deploymentInputs, policyFromSource, preflightText } from './beta-preflight.mjs';

function source(approved = true) {
  const literal = JSON.stringify({ approved,
    documents: ['terms', 'fitness-risk', 'health-data'].map(id => ({ id, version: 'reviewed-test-1', text: 'Synthetic test agreement' })),
  });
  return 'export const consentPolicy: ConsentPolicy = ' + literal.slice(0, -1) + '\n};';
}
function configured() {
  return { ...Object.fromEntries(deploymentInputs.map(name => [name, 'configured-test-value'])),
    FORGE_AUDIT_HMAC_KEY: 'independent-synthetic-key'.repeat(2),
    VITE_ENTRA_AUTHORITY: 'https://identity.example.test/tenant',
    OIDC_ISSUER: 'https://identity.example.test/tenant/v2.0',
    OIDC_JWKS_URL: 'https://identity.example.test/keys',
    VITE_ENTRA_API_SCOPE: 'api://forge-test/access_as_user',
    VITE_FORGE_SUPPORT_EMAIL: 'support@example.test' };
}
test('accepts configured prerequisites without claiming deployment or release readiness', () => {
  const report = betaPreflight(configured(), source());
  assert.equal(report.configurationStatus, 'PASS');
  assert.ok(report.stillRequires.includes('deployed candidate smoke'));
  assert.match(preflightText(report), /does not establish deployment/);
  assert.equal(policyFromSource(source()).approved, true);
});
test('blocks missing settings and a draft policy even with otherwise complete configuration', () => {
  assert.equal(betaPreflight(configured(), source(false)).checks.find(check => check.name === 'versioned_policy_approval').result, 'BLOCKED');
  const report = betaPreflight({}, source(false));
  for (const name of deploymentInputs) assert.equal(report.checks.find(check => check.name === name).result, 'BLOCKED');
  assert.equal(report.configurationStatus, 'BLOCKED');
});
test('rejects unsafe endpoints, malformed contacts, short audit keys, scope mismatch and non-US admission', () => {
  for (const changes of [
    { OIDC_JWKS_URL: 'http://identity.example.test/keys' },
    { VITE_ENTRA_AUTHORITY: 'https://user:secret@identity.example.test' },
    { VITE_FORGE_SUPPORT_EMAIL: 'not-an-email' }, { FORGE_AUDIT_HMAC_KEY: 'short' },
    { FORGE_BETA_COUNTRIES: 'US,AU' }, { FORGE_BETA_COUNTRIES: '' },
    { VITE_ENTRA_API_SCOPE: 'api://forge-test/another_scope' },
  ]) assert.equal(betaPreflight({ ...configured(), ...changes }, source()).configurationStatus, 'BLOCKED');
  assert.equal(betaPreflight({ ...configured(), OIDC_REQUIRED_SCOPE: 'custom_scope', VITE_ENTRA_API_SCOPE: 'api://forge-test/custom_scope' }, source()).configurationStatus, 'PASS');
});
test('never evaluates malformed policy or treats truthy strings as approval', () => {
  for (const invalid of ['', 'export const consentPolicy: ConsentPolicy = executeAnything();',
    '// ' + source(), source().replace('"terms"', '"missing-terms"')]) {
    assert.equal(betaPreflight(configured(), invalid).configurationStatus, 'BLOCKED');
  }
  assert.equal(betaPreflight(configured(), source().replace('"approved":true', '"approved":"true"')).configurationStatus, 'BLOCKED');
});
test('text and JSON reports contain no configuration values or raw parser errors', () => {
  const environment = { ...configured(), OPENAI_API_KEY: 'private-key-sentinel',
    OIDC_JWKS_URL: 'https://user:private-password@identity.example.test',
    VITE_FORGE_SUPPORT_EMAIL: 'private-bad-contact' };
  const report = betaPreflight(environment, 'private-policy-parser-sentinel');
  const output = preflightText(report) + JSON.stringify(report);
  for (const value of Object.values(environment)) assert.ok(!output.includes(value));
  assert.ok(!output.includes('private-policy-parser-sentinel'));
});
test('actual CLI reads the canonical repository policy and rejects secret-bearing arguments without echoing them', () => {
  const script = new URL('./beta-preflight.mjs', import.meta.url);
  const result = spawnSync(process.execPath, [script.pathname, '--json'], { env: { ...process.env, ...configured() }, encoding: 'utf8' });
  const expected = betaPreflight(configured(), readFileSync(new URL('../../apps/api/src/consent.ts', import.meta.url), 'utf8'));
  assert.equal(result.status, expected.configurationStatus === 'PASS' ? 0 : 2);
  assert.deepEqual(JSON.parse(result.stdout), expected);
  const invalid = spawnSync(process.execPath, [script.pathname, '--key=private-argument-sentinel'], { encoding: 'utf8' });
  assert.equal(invalid.status, 2);
  assert.ok(!(invalid.stderr + invalid.stdout).includes('private-argument-sentinel'));
});
test('Azure runs the prerequisite check before sign-in/provisioning and deploys the validated scope', () => {
  const workflow = readFileSync(new URL('../../.github/workflows/deploy-azure.yml', import.meta.url), 'utf8');
  const check = workflow.indexOf('run: node scripts/deployment/beta-preflight.mjs');
  assert.ok(check > 0 && check < workflow.indexOf('uses: azure/login@v2'));
  assert.ok(check < workflow.indexOf('az deployment group create'));
  const inputBlock = workflow.slice(workflow.indexOf('- name: Validate beta prerequisites'), check);
  for (const name of deploymentInputs) assert.ok(inputBlock.includes(name + ':'), name + ' must be mapped from the selected environment');
  assert.ok(workflow.includes('oidcRequiredScope="$OIDC_REQUIRED_SCOPE"'));
});
