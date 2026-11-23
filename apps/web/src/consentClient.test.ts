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

describe('agreement receipt history and export', () => {
  it('loads older records using the authenticated cursor without resubmitting consent', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ events: [], nextCursor: null }));
    const client = new ConsentClient(config, request);
    expect(await client.history('42')).toEqual({ events: [], nextCursor: null });
    expect(request.mock.calls[0]?.[0]).toBe('/api/v1/consent/history?before=42');
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: 'Bearer account-token' });
  });
  it('rejects malformed receipts and broken pagination instead of displaying them', async () => {
    for (const page of [{ events: [{ accepted: true }], nextCursor: null }, { events: [], nextCursor: '42' }, { events: [], nextCursor: '-1' }]) {
      const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(page));
      await expect(new ConsentClient(config, request).history()).rejects.toThrow('verify');
    }
  });
  it('reports failed history loading without treating it as an empty receipt history', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}, { status: 503 }));
    await expect(new ConsentClient(config, request).history()).rejects.toThrow('retry');
  });
});
