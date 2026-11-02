import { describe, expect, it, vi } from 'vitest';
import { BetaClient, validBetaStatus } from './betaClient.js';
const status = { required: true, invited: true, country: 'US', countryEnabled: true, adultConfirmed: false, admitted: false };
describe('beta account client', () => {
  it('rejects contradictory and malformed admission responses', () => {
    expect(validBetaStatus(status)).toBe(true);
    expect(validBetaStatus({ ...status, admitted: true })).toBe(false);
    expect(validBetaStatus({ ...status, adultConfirmed: true, admitted: true })).toBe(true);
    expect(validBetaStatus({ ...status, invited: false })).toBe(false);
    expect(validBetaStatus({ ...status, country: 'Australia' })).toBe(false);
    expect(validBetaStatus(null)).toBe(false);
    expect(validBetaStatus({ ...status, country: 'AU', adultConfirmed: true, admitted: true })).toBe(false);
  });
  it('sends authenticated eligibility and verifies it again before opening personal features', async () => {
    const request = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => Response.json({ ...status, adultConfirmed: true, admitted: true }));
    const client = new BetaClient({ baseUrl: '/api', accessToken: async () => 'token' }, request);
    expect((await client.confirm('US')).admitted).toBe(true);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', headers: { authorization: 'Bearer token' }, body: JSON.stringify({ country: 'US', adultConfirmed: true }) });
    expect(request.mock.calls[1]?.[1]?.method).toBe('GET');
  });
  it('keeps access closed after a failed or unconfirmed write', async () => {
    const config = { baseUrl: '/api', accessToken: async () => 'token' };
    await expect(new BetaClient(config, async () => Response.json(status)).confirm('US')).rejects.toThrow('not confirmed');
    await expect(new BetaClient(config, async () => new Response(null, { status: 503 })).status()).rejects.toThrow('Unable to verify');
  });
});
