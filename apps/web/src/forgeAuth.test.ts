import { describe, expect, it } from 'vitest';
import { forgeAuthConfig } from './forgeAuth.js';
import { localAccessToken } from './useForgeAuth.js';

describe('Forge authentication configuration', () => {
  it('requires the complete Entra configuration', () => {
    expect(forgeAuthConfig({ VITE_ENTRA_CLIENT_ID: 'client' }, 'http://localhost:4173')).toBeNull();
  });

  it('uses the current origin as the default redirect URI', () => {
    expect(forgeAuthConfig({
      VITE_ENTRA_CLIENT_ID: 'client',
      VITE_ENTRA_AUTHORITY: 'https://tenant.ciamlogin.com/tenant.onmicrosoft.com',
      VITE_ENTRA_API_SCOPE: 'api://api-id/access_as_user',
    }, 'http://localhost:4173')).toEqual({
      clientId: 'client',
      authority: 'https://tenant.ciamlogin.com/tenant.onmicrosoft.com',
      apiScope: 'api://api-id/access_as_user',
      redirectUri: 'http://localhost:4173',
    });
  });
});

describe('Forge local authentication', () => {
  it('uses the API-matched token in Vite development even when a stale override exists', () => {
    expect(localAccessToken({
      DEV: true,
      VITE_FORGE_SYNC_TOKEN: 'stale-local-token',
    })).toBe('forge-local-development');
  });

  it('preserves an explicit token outside Vite development', () => {
    expect(localAccessToken({
      DEV: false,
      VITE_FORGE_SYNC_TOKEN: 'configured-token',
    })).toBe('configured-token');
  });

  it('does not invent a production token', () => {
    expect(localAccessToken({ DEV: false })).toBeUndefined();
  });
});
