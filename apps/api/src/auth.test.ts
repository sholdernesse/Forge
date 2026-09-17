import { describe, expect, it } from 'vitest';
import { authVerifierFromEnvironment, hasRequiredScope } from './auth.js';

describe('API authorization scopes', () => {
  it('accepts the required delegated scope among multiple scopes', () => {
    expect(hasRequiredScope('openid profile access_as_user offline_access', 'access_as_user')).toBe(true);
  });

  it('rejects missing, partial, and malformed scope claims', () => {
    expect(hasRequiredScope('dashboard.read', 'access_as_user')).toBe(false);
    expect(hasRequiredScope('access_as_user_extra', 'access_as_user')).toBe(false);
    expect(hasRequiredScope(undefined, 'access_as_user')).toBe(false);
  });

  it('uses a development-only local token when no environment file exists', async () => {
    const verifier = authVerifierFromEnvironment({ NODE_ENV: 'development' });
    await expect(verifier.verify('Bearer forge-local-development')).resolves.toEqual({ id: 'forge-development-user' });
  });
});
