import { describe, expect, it } from 'vitest';
import { publicDocumentForPath, supportEmailFromEnvironment } from './PublicDocumentPage.js';

describe('public release documents', () => {
  it('routes only supported public document paths', () => {
    expect(publicDocumentForPath('/privacy')).toBe('privacy');
    expect(publicDocumentForPath('/terms/')).toBe('terms');
    expect(publicDocumentForPath('/support')).toBe('support');
    expect(publicDocumentForPath('/')).toBeNull();
    expect(publicDocumentForPath('/account')).toBeNull();
  });

  it('accepts only a configured email-shaped support contact', () => {
    expect(supportEmailFromEnvironment({ VITE_FORGE_SUPPORT_EMAIL: ' help@forge.test ' })).toBe('help@forge.test');
    expect(supportEmailFromEnvironment({ VITE_FORGE_SUPPORT_EMAIL: 'not-an-email' })).toBeNull();
    expect(supportEmailFromEnvironment({})).toBeNull();
  });
});
