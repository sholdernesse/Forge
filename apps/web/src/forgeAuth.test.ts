import { describe, expect, it } from 'vitest';
import { forgeAuthConfig } from './forgeAuth.js';

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
