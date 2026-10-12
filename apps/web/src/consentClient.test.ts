import { describe, expect, it, vi } from 'vitest';
import { ConsentClient, type ConsentStatus } from './consentClient.js';
const status: ConsentStatus = { required: true, approved: true, accepted: false, digest: 'current', documents: [{ id: 'terms', version: '1', title: 'Terms', text: 'Approved terms' }] };
const config = { baseUrl: '/api', accessToken: async () => 'account-token' };
describe('consent persistence confirmation', () => {
  it('requires server verification after a successful write', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ accepted: true })).mockResolvedValueOnce(Response.json(status));
    await expect(new ConsentClient(config, request).accept(status, ['terms'], 'en-US')).rejects.toThrow('not confirmed');
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: 'Bearer account-token' });
  });
  it('never marks a failed or stale-version write successful', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ error: 'consent_version_changed' }, { status: 409 }));
    await expect(new ConsentClient(config, request).accept(status, ['terms'], 'en-US')).rejects.toThrow('agreements changed');
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid status responses instead of permitting personal features', async () => {
    await expect(new ConsentClient(config, vi.fn<typeof fetch>().mockResolvedValue(Response.json({ accepted: true }))).status()).rejects.toThrow('verify');
  });
});
