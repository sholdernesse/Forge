import { describe, expect, it, vi } from 'vitest';
import { DashboardSyncClient, DashboardSyncConflictError, dashboardSyncConfig, newerThanLocal } from './dashboardSync.js';
import type { DashboardState } from './dashboardStorage.js';

const state: DashboardState = {
  history: [],
  checkIn: { weightKg: 75, sleepScore: 80, sleepHours: 7, soreness: 3, stress: 2 },
};

describe('dashboard sync', () => {
  it('loads a remote dashboard using bearer authentication', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:00:00.000Z', revision: 'rev-1' }), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);
    await expect(client.load()).resolves.toMatchObject({ revision: 'rev-1', state });
    expect(request).toHaveBeenCalledWith('https://sync.forge.test/v1/dashboard', { headers: { authorization: 'Bearer secret' } });
  });

  it('sends the loaded revision when saving to prevent lost updates', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:00:00.000Z', revision: 'rev-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:01:00.000Z', revision: 'rev-2' }), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);
    await client.load();
    await client.save(state, '2026-08-12T12:01:00.000Z');
    expect(request.mock.calls[1]?.[1]).toMatchObject({ method: 'PUT', headers: { 'if-match': 'rev-1' } });
  });

  it('creates the first remote dashboard after an authenticated 404', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:01:00.000Z', revision: 'rev-1' }), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);
    await expect(client.initialize(state, '2026-08-12T12:00:00.000Z')).resolves.toMatchObject({ revision: 'rev-1' });
    expect(request.mock.calls[1]?.[1]).toMatchObject({ method: 'PUT' });
  });

  it('pushes a newer local snapshot after an offline period instead of accepting stale remote data', async () => {
    const remoteState = { ...state, checkIn: { ...state.checkIn, sleepScore: 60 } };
    const localState = { ...state, checkIn: { ...state.checkIn, sleepScore: 78 } };
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ state: remoteState, updatedAt: '2026-08-12T12:00:00.000Z', revision: 'rev-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state: localState, updatedAt: '2026-09-09T07:45:00.000Z', revision: 'rev-2' }), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);

    await expect(client.initialize(localState, '2026-09-09T07:44:00.000Z')).resolves.toMatchObject({ revision: 'rev-2', state: localState });
    expect(request.mock.calls[1]?.[1]).toMatchObject({ method: 'PUT', headers: { 'if-match': 'rev-1' } });
    expect(JSON.parse(String(request.mock.calls[1]?.[1]?.body))).toMatchObject({ state: localState });
  });

  it('keeps a newer remote snapshot without overwriting it during initialization', async () => {
    const remote = { state, updatedAt: '2026-09-09T07:45:00.000Z', revision: 'rev-2' };
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(remote), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);

    await expect(client.initialize(state, '2026-09-09T07:44:00.000Z')).resolves.toEqual(remote);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('recovers the latest local snapshot after a transient save failure', async () => {
    const localState = { ...state, checkIn: { ...state.checkIn, sleepScore: 53, sleepHours: 8.9 } };
    const staleRemote = { state, updatedAt: '2026-08-12T22:09:11.214Z', revision: 'rev-1' };
    const recovered = { state: localState, updatedAt: '2026-09-09T07:55:40.020Z', revision: 'rev-2' };
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(staleRemote), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(staleRemote), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(recovered), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);

    await client.load();
    await expect(client.save(localState, recovered.updatedAt)).rejects.toThrow('Dashboard sync save failed (503)');
    await expect(client.initialize(localState, recovered.updatedAt)).resolves.toEqual(recovered);
    expect(request.mock.calls[3]?.[1]).toMatchObject({ method: 'PUT', headers: { 'if-match': 'rev-1' } });
  });

  it('reloads the winning snapshot when two clients race to create it', async () => {
    const winner = { state, updatedAt: '2026-08-12T12:01:00.000Z', revision: 'rev-winner' };
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'revision_conflict' }), { status: 412 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(winner), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);
    await expect(client.initialize(state, '2026-08-12T12:00:00.000Z')).resolves.toEqual(winner);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('returns the winning revision details when a save conflicts', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:00:00.000Z', revision: 'rev-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: 'revision_conflict',
        current: { revision: 'rev-2', updatedAt: '2026-08-12T12:02:00.000Z' },
      }), { status: 412 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', accessToken: async () => 'secret' }, request as typeof fetch);
    await client.load();

    const error = await client.save(state, '2026-08-12T12:01:00.000Z').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(DashboardSyncConflictError);
    expect(error).toMatchObject({ currentRevision: 'rev-2', currentUpdatedAt: '2026-08-12T12:02:00.000Z' });
  });

  it('stays local without complete configuration and compares update times', () => {
    expect(dashboardSyncConfig({ VITE_FORGE_SYNC_URL: 'https://sync.forge.test' })).toBeNull();
    expect(dashboardSyncConfig({ DEV: true, VITE_FORGE_SYNC_URL: 'http://localhost:8787' }, async () => 'token')?.baseUrl).toBe('/api');
    expect(newerThanLocal('2026-08-12T12:01:00.000Z', '2026-08-12T12:00:00.000Z')).toBe(true);
    expect(newerThanLocal('2026-08-12T11:59:00.000Z', '2026-08-12T12:00:00.000Z')).toBe(false);
  });
});
