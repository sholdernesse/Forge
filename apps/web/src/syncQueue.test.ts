import { describe, expect, it, vi } from 'vitest';
import { DashboardSyncClient, DashboardSyncConflictError } from './dashboardSync.js';
import type { DashboardState } from './dashboardStorage.js';
const state: DashboardState = { history: [], checkIn: { weightKg: 75, sleepScore: 80, sleepHours: 7, soreness: 3, stress: 2 } };
const config = { baseUrl: 'https://forge.test', accessToken: async () => 'test' };
function result(revision: string) { return Response.json({ state, updatedAt: '2026-11-01T00:00:00Z', revision }); }

describe('bounded, coalescing sync queue', () => {
  it('sends only the latest pending snapshot, retaining the revision from an in-flight save', async () => {
    let finish!: (value: Response) => void;
    const request = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { finish = resolve; }))
      .mockResolvedValueOnce(result('rev-2'));
    const client = new DashboardSyncClient(config, request);
    const first = client.save(state, 'first');
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    const second = client.save({ ...state, savedAt: 'intermediate' }, 'second');
    const third = client.save({ ...state, savedAt: 'latest' }, 'third');
    finish(result('rev-1'));
    await Promise.all([first, second, third]);
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[1]?.[1].headers['if-match']).toBe('rev-1');
    expect(JSON.parse(request.mock.calls[1]?.[1].body)).toMatchObject({ updatedAt: 'third', state: { savedAt: 'latest' } });
  });
  it('never combines writes across deletion or leaks the deleted revision into a new write', async () => {
    const request = vi.fn().mockResolvedValueOnce(result('before-delete'))
      .mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(result('after-delete'));
    const client = new DashboardSyncClient(config, request);
    const before = client.save({ ...state, savedAt: 'before' }, 'before');
    const deleted = client.delete();
    const after = client.save({ ...state, savedAt: 'after' }, 'after');
    await Promise.all([before, deleted, after]);
    expect(request.mock.calls.map(call => call[1].method)).toEqual(['PUT', 'DELETE', 'PUT']);
    expect(JSON.parse(request.mock.calls[0]?.[1].body).state.savedAt).toBe('before');
    expect(request.mock.calls[2]?.[1].headers).not.toHaveProperty('if-match');
  });
  it('keeps a queued coalesced write behind conflict protection', async () => {
    const request = vi.fn().mockResolvedValueOnce(result('old'))
      .mockResolvedValue(new Response(JSON.stringify({ current: { revision: 'another-device' } }), { status: 412 }));
    const client = new DashboardSyncClient(config, request);
    await client.load();
    const first = client.save(state, 'first');
    const second = client.save({ ...state, savedAt: 'latest' }, 'second');
    const results = await Promise.allSettled([first, second]);
    expect(results.every(r => r.status === 'rejected' && r.reason instanceof DashboardSyncConflictError)).toBe(true);
    expect(request.mock.calls[1]?.[1].headers['if-match']).toBe('old');
  });
  it('times out a stalled response body, aborts it, and lets the next operation proceed', async () => {
    let signal: AbortSignal | undefined;
    const request = vi.fn().mockImplementationOnce(async (_url, init) => {
      signal = init.signal;
      return { ok: true, status: 200, json: () => new Promise(() => undefined) } as unknown as Response;
    }).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = new DashboardSyncClient({ ...config, requestTimeoutMs: 15 }, request);
    await expect(client.load()).rejects.toThrow('timed out');
    expect(signal?.aborted).toBe(true);
    await expect(client.delete()).resolves.toBeUndefined();
  });
  it('cannot replace a newer revision when a timed-out response eventually finishes', async () => {
    let finishOld!: (value: unknown) => void;
    const request = vi.fn().mockResolvedValueOnce({
      ok: true, status: 200, json: () => new Promise(resolve => { finishOld = resolve; }),
    } as unknown as Response).mockResolvedValueOnce(result('new')).mockResolvedValueOnce(result('saved'));
    const client = new DashboardSyncClient({ ...config, requestTimeoutMs: 15 }, request);
    await expect(client.load()).rejects.toThrow('timed out');
    await client.load();
    finishOld({ state, updatedAt: '2026-10-01T00:00:00Z', revision: 'old' });
    await new Promise(resolve => setTimeout(resolve, 0));
    await client.save(state, 'latest');
    expect(request.mock.calls[2]?.[1].headers['if-match']).toBe('new');
  });
});
