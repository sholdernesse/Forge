const securityHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
};

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function endpoint(baseUrl, path) {
  return new URL(path, `${baseUrl}/`).toString();
}

function validateSecurityHeaders(response, label) {
  for (const [name, expected] of Object.entries(securityHeaders)) {
    requireCondition(response.headers.get(name) === expected, `${label} is missing ${name}: ${expected}`);
  }
  const permissions = response.headers.get('permissions-policy') ?? '';
  for (const directive of ['camera=(self)', 'microphone=()', 'geolocation=()']) {
    requireCondition(permissions.includes(directive), `${label} permissions-policy is missing ${directive}`);
  }
}

async function request(fetchImpl, baseUrl, path) {
  return fetchImpl(endpoint(baseUrl, path), {
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
    headers: { 'user-agent': 'forge-release-smoke/1.0' },
  });
}

export function normalizeDeploymentUrl(value) {
  requireCondition(typeof value === 'string' && value.trim(), 'DEPLOYMENT_URL is required');
  const url = new URL(value.trim());
  requireCondition(url.protocol === 'https:', 'DEPLOYMENT_URL must use HTTPS');
  requireCondition(!url.username && !url.password, 'DEPLOYMENT_URL must not contain credentials');
  requireCondition(!url.search && !url.hash, 'DEPLOYMENT_URL must not contain a query or fragment');
  return url.toString().replace(/\/$/, '');
}

export function validateReleaseConfig(config, expectedCommit) {
  requireCondition(config && typeof config === 'object', 'release-config.json must contain an object');
  requireCondition(
    typeof config.supportEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.supportEmail),
    'release config must contain a valid monitored support email',
  );
  requireCondition(
    typeof config.releaseSha === 'string' && /^[0-9a-f]{40}$/i.test(config.releaseSha),
    'release config must contain a full Git commit SHA',
  );
  if (expectedCommit) {
    requireCondition(/^[0-9a-f]{40}$/i.test(expectedCommit), 'EXPECTED_COMMIT must be a full Git commit SHA');
    requireCondition(config.releaseSha.toLowerCase() === expectedCommit.toLowerCase(), 'deployed release SHA does not match EXPECTED_COMMIT');
  }
}

export async function smokeCandidate({ deploymentUrl, expectedCommit = '', fetchImpl = fetch }) {
  const baseUrl = normalizeDeploymentUrl(deploymentUrl);
  const checks = [];

  const health = await request(fetchImpl, baseUrl, '/health');
  requireCondition(health.status === 200, `/health returned ${health.status}`);
  const healthPayload = await health.json();
  requireCondition(healthPayload.status === 'ok', '/health did not report status ok');
  requireCondition(healthPayload.capabilities?.mealPhotoAnalysis === true, '/health reports meal-photo analysis is not configured');
  validateSecurityHeaders(health, '/health');
  checks.push('API health and meal-photo capability');

  const configResponse = await request(fetchImpl, baseUrl, '/release-config.json');
  requireCondition(configResponse.status === 200, `/release-config.json returned ${configResponse.status}`);
  requireCondition((configResponse.headers.get('content-type') ?? '').includes('application/json'), 'release config is not JSON');
  const config = await configResponse.json();
  validateReleaseConfig(config, expectedCommit);
  validateSecurityHeaders(configResponse, '/release-config.json');
  requireCondition((configResponse.headers.get('cache-control') ?? '').includes('no-store'), 'release config must not be cached');
  checks.push('release identity and support contact');

  let shell = '';
  for (const path of ['/', '/privacy', '/terms', '/support', '/__forge_release_smoke__']) {
    const response = await request(fetchImpl, baseUrl, path);
    requireCondition(response.status === 200, `${path} returned ${response.status}`);
    requireCondition((response.headers.get('content-type') ?? '').includes('text/html'), `${path} is not HTML`);
    validateSecurityHeaders(response, path);
    requireCondition((response.headers.get('cache-control') ?? '').includes('no-store'), `${path} shell must not be cached`);
    const body = await response.text();
    requireCondition(body.includes('<div id="root"></div>'), `${path} did not return the Forge SPA shell`);
    if (path === '/') shell = body;
  }
  checks.push('public pages and SPA fallback');

  const assetPath = shell.match(/(?:src|href)="(\/assets\/[^"?]+)"/)?.[1];
  requireCondition(assetPath, 'Forge shell did not reference a versioned asset');
  const asset = await request(fetchImpl, baseUrl, assetPath);
  requireCondition(asset.status === 200, `${assetPath} returned ${asset.status}`);
  validateSecurityHeaders(asset, assetPath);
  requireCondition((asset.headers.get('cache-control') ?? '').includes('immutable'), `${assetPath} must use immutable caching`);
  checks.push('versioned asset caching');

  const anonymous = await request(fetchImpl, baseUrl, '/v1/dashboard');
  requireCondition(anonymous.status === 401, `anonymous /v1/dashboard returned ${anonymous.status}, expected 401`);
  checks.push('anonymous dashboard denial');

  return { baseUrl, checks, releaseSha: config.releaseSha, supportEmail: config.supportEmail };
}
