import { describe, expect, it, vi } from 'vitest';
import { DashboardSyncClient, dashboardSyncConfig, newerThanLocal } from './dashboardSync.js';
import type { DashboardState } from './dashboardStorage.js';

const state: DashboardState = {
  history: [],
  checkIn: { weightKg: 75, sleepScore: 80, sleepHours: 7, soreness: 3, stress: 2 },
};

describe('dashboard sync', () => {
  it('loads a remote dashboard using bearer authentication', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:00:00.000Z', revision: 'rev-1' }), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', token: 'secret' }, request as typeof fetch);
    await expect(client.load()).resolves.toMatchObject({ revision: 'rev-1', state });
    expect(request).toHaveBeenCalledWith('https://sync.forge.test/v1/dashboard', { headers: { authorization: 'Bearer secret' } });
  });

  it('sends the loaded revision when saving to prevent lost updates', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:00:00.000Z', revision: 'rev-1' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:01:00.000Z', revision: 'rev-2' }), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', token: 'secret' }, request as typeof fetch);
    await client.load();
    await client.save(state, '2026-08-12T12:01:00.000Z');
    expect(request.mock.calls[1]?.[1]).toMatchObject({ method: 'PUT', headers: { 'if-match': 'rev-1' } });
  });

  it('creates the first remote dashboard after an authenticated 404', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ state, updatedAt: '2026-08-12T12:01:00.000Z', revision: 'rev-1' }), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', token: 'secret' }, request as typeof fetch);
    await expect(client.initialize(state, '2026-08-12T12:00:00.000Z')).resolves.toMatchObject({ revision: 'rev-1' });
    expect(request.mock.calls[1]?.[1]).toMatchObject({ method: 'PUT' });
  });

  it('reloads the winning snapshot when two clients race to create it', async () => {
    const winner = { state, updatedAt: '2026-08-12T12:01:00.000Z', revision: 'rev-winner' };
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'revision_conflict' }), { status: 412 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(winner), { status: 200 }));
    const client = new DashboardSyncClient({ baseUrl: 'https://sync.forge.test', token: 'secret' }, request as typeof fetch);
    await expect(client.initialize(state, '2026-08-12T12:00:00.000Z')).resolves.toEqual(winner);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('stays local without complete configuration and compares update times', () => {
    expect(dashboardSyncConfig({ VITE_FORGE_SYNC_URL: 'https://sync.forge.test' })).toBeNull();
    expect(newerThanLocal('2026-08-12T12:01:00.000Z', '2026-08-12T12:00:00.000Z')).toBe(true);
    expect(newerThanLocal('2026-08-12T11:59:00.000Z', '2026-08-12T12:00:00.000Z')).toBe(false);
  });
});
