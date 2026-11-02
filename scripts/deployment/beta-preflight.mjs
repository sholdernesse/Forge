import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const deploymentInputs = [
  'AZURE_CLIENT_ID', 'AZURE_TENANT_ID', 'AZURE_SUBSCRIPTION_ID', 'AZURE_RESOURCE_GROUP',
  'FORGE_POSTGRES_ADMIN_PASSWORD', 'FORGE_AUDIT_HMAC_KEY', 'OPENAI_API_KEY',
  'USDA_FOODDATA_API_KEY', 'OPENAI_VISION_MODEL', 'VITE_ENTRA_CLIENT_ID',
  'VITE_ENTRA_AUTHORITY', 'VITE_ENTRA_API_SCOPE', 'OIDC_ISSUER', 'OIDC_AUDIENCE',
  'OIDC_JWKS_URL', 'VITE_FORGE_SUPPORT_EMAIL',
];

/** Read the canonical literal policy without evaluating application code. */
export function policyFromSource(source) {
  const marker = 'export const consentPolicy: ConsentPolicy = ';
  const declaration = /^export const consentPolicy: ConsentPolicy = /m.exec(source);
  if (!declaration) throw new Error('Policy declaration unavailable');
  const start = declaration.index;
  const end = source.indexOf('\n};', start);
  if (end < 0) throw new Error('Policy declaration incomplete');
  const policy = JSON.parse(source.slice(start + marker.length, end + 2));
  const ids = ['terms', 'fitness-risk', 'health-data'];
  if (!Array.isArray(policy.documents) || policy.documents.length !== ids.length ||
      ids.some(id => policy.documents.filter(document => document?.id === id &&
        typeof document.version === 'string' && document.version.trim() &&
        typeof document.text === 'string' && document.text.trim()).length !== 1)) {
    throw new Error('Required agreement documents unavailable');
  }
  return policy;
}

function secureUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
  } catch { return false; }
}

/** All output is fixed labels and actions. Never include supplied configuration values. */
export function betaPreflight(environment, policySource) {
  const checks = [];
  const add = (name, pass, action) => checks.push({ name, result: pass ? 'PASS' : 'BLOCKED', action: pass ? 'Configured.' : action });
  const value = name => typeof environment[name] === 'string' ? environment[name].trim() : '';
  for (const name of deploymentInputs) add(name, Boolean(value(name)), 'Configure ' + name + ' in the selected GitHub deployment environment.');
  add('audit_key_strength', value('FORGE_AUDIT_HMAC_KEY').length >= 32, 'Use an independent FORGE_AUDIT_HMAC_KEY of at least 32 characters.');
  for (const name of ['VITE_ENTRA_AUTHORITY', 'OIDC_ISSUER', 'OIDC_JWKS_URL']) {
    add(name + '_https', secureUrl(value(name)), 'Use an HTTPS ' + name + ' URL without embedded credentials or fragments.');
  }
  add('support_contact_format', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('VITE_FORGE_SUPPORT_EMAIL')),
    'Configure a valid support email and separately verify that the mailbox is monitored.');
  const countries = (environment.FORGE_BETA_COUNTRIES === undefined ? 'US' : value('FORGE_BETA_COUNTRIES')).split(',').map(country => country.trim().toUpperCase());
  add('us_adult_beta_country', countries.length > 0 && countries.every(country => country === 'US'),
    'The initial invited adult beta requires FORGE_BETA_COUNTRIES=US. A paused or non-US cohort is not an open-beta candidate.');
  const requiredScope = value('OIDC_REQUIRED_SCOPE') || 'access_as_user';
  const requestedScope = value('VITE_ENTRA_API_SCOPE');
  add('identity_scope_alignment', !/\s/.test(requiredScope) && Boolean(requestedScope) &&
    !/\s/.test(requestedScope) && requestedScope.split('/').at(-1) === requiredScope,
    'Align the delegated VITE_ENTRA_API_SCOPE suffix with OIDC_REQUIRED_SCOPE (default access_as_user).');
  try {
    const policy = policyFromSource(policySource);
    add('versioned_policy_approval', policy.approved === true,
      'Finalize the reviewed versioned agreements and record approval in the canonical policy commit before deploying an external beta candidate.');
  } catch {
    add('versioned_policy_approval', false, 'Restore a readable canonical policy with Terms, fitness release, and health-data documents. No approval is inferred.');
  }
  return {
    configurationStatus: checks.every(check => check.result === 'PASS') ? 'PASS' : 'BLOCKED',
    checks,
    stillRequires: ['Azure identity permissions', 'provider and mailbox verification', 'deployed candidate smoke',
      'physical device and account-isolation acceptance', 'recovery and release evidence'],
  };
}

export function preflightText(report) {
  return ['Forge deployment preflight (read-only)', ...report.checks.map(check =>
    '[' + check.result + '] ' + check.name + ' — ' + check.action),
  'Configuration: ' + report.configurationStatus,
  'This checks prerequisites only; it does not establish deployment or beta release readiness.'].join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--json')) {
    console.error('Usage: beta:preflight [--json]. Set configuration through the environment; do not pass secrets as arguments.');
    process.exitCode = 2;
  } else {
    const policySource = await readFile(new URL('../../apps/api/src/consent.ts', import.meta.url), 'utf8').catch(() => '');
    const report = betaPreflight(process.env, policySource);
    console.log(args.includes('--json') ? JSON.stringify(report, null, 2) : preflightText(report));
    process.exitCode = report.configurationStatus === 'PASS' ? 0 : 2;
  }
}
