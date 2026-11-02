import { describe, expect, it } from 'vitest';
import {
  DashboardSyncClient,
  DashboardSyncConflictError,
} from './dashboardSync.js';
import type { DashboardState } from './dashboardStorage.js';

interface StoredDashboard {
  state: DashboardState;
  updatedAt: string;
  revision: string;
}

function dashboard(weightKg: number): DashboardState {
  return {
    history: [],
    checkIn: {
      weightKg,
      sleepScore: 80,
      sleepHours: 7,
      soreness: 3,
      stress: 2,
    },
  };
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function createIsolatedSyncServer() {
  const dashboards = new Map<string, StoredDashboard>();
  let revision = 0;

  const request = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);
    const authorization = headers.get('authorization');
    const subject = authorization?.match(/^Bearer user-(.+)$/)?.[1];
    if (!subject) return json({ error: 'unauthorized' }, 401);

    const current = dashboards.get(subject);
    if (!init?.method || init.method === 'GET') {
      return current ? json(current) : new Response(null, { status: 404 });
    }

    if (init.method !== 'PUT') return json({ error: 'method_not_allowed' }, 405);
    const expectedRevision = headers.get('if-match');
    if ((current && expectedRevision !== current.revision) || (!current && expectedRevision)) {
      return json({
        error: 'revision_conflict',
        ...(current ? {
          current: {
            revision: current.revision,
            updatedAt: current.updatedAt,
          },
        } : {}),
      }, 412);
    }

    const payload = JSON.parse(String(init.body)) as {
      state: DashboardState;
      updatedAt: string;
    };
    const stored = {
      state: payload.state,
      updatedAt: payload.updatedAt,
      revision: `rev-${++revision}`,
    };
    dashboards.set(subject, stored);
    return json(stored);
  };

  return { request: request as typeof fetch, dashboards };
}

function clientFor(subject: string, request: typeof fetch): DashboardSyncClient {
  return new DashboardSyncClient({
    baseUrl: 'https://sync.forge.test',
    accessToken: async () => `user-${subject}`,
  }, request);
}

describe('release acceptance: authenticated cross-device continuity', () => {
  it('hydrates a second device and protects the newer remote revision', async () => {
    const server = createIsolatedSyncServer();
    const desktop = clientFor('shane', server.request);
    const phone = clientFor('shane', server.request);

    await expect(
      desktop.initialize(dashboard(75), '2026-08-16T11:00:00.000Z'),
    ).resolves.toMatchObject({
      revision: 'rev-1',
      state: { checkIn: { weightKg: 75 } },
    });

    await expect(phone.load()).resolves.toMatchObject({
      revision: 'rev-1',
      state: { checkIn: { weightKg: 75 } },
    });

    await expect(
      phone.save(dashboard(74.8), '2026-08-16T11:05:00.000Z'),
    ).resolves.toMatchObject({
      revision: 'rev-2',
      state: { checkIn: { weightKg: 74.8 } },
    });

    const staleSave = desktop
      .save(dashboard(75.2), '2026-08-16T11:06:00.000Z')
      .catch((error: unknown) => error);

    await expect(staleSave).resolves.toBeInstanceOf(DashboardSyncConflictError);
    await expect(staleSave).resolves.toMatchObject({
      currentRevision: 'rev-2',
      currentUpdatedAt: '2026-08-16T11:05:00.000Z',
    });
    expect(server.dashboards.get('shane')?.state.checkIn.weightKg).toBe(74.8);
  });

  it('keeps snapshots isolated by the authenticated subject', async () => {
    const server = createIsolatedSyncServer();
    const shaneDesktop = clientFor('shane', server.request);
    const anotherAccount = clientFor('another-account', server.request);

    await shaneDesktop.initialize(dashboard(75), '2026-08-16T11:00:00.000Z');

    await expect(anotherAccount.load()).resolves.toBeNull();
    await anotherAccount.initialize(dashboard(82), '2026-08-16T11:01:00.000Z');

    await expect(shaneDesktop.load()).resolves.toMatchObject({
      state: { checkIn: { weightKg: 75 } },
    });
    await expect(anotherAccount.load()).resolves.toMatchObject({
      state: { checkIn: { weightKg: 82 } },
    });
    expect(server.dashboards.size).toBe(2);
  });

  it('rejects requests without a usable authenticated subject', async () => {
    const server = createIsolatedSyncServer();
    const anonymous = new DashboardSyncClient({
      baseUrl: 'https://sync.forge.test',
      accessToken: async () => 'invalid-token',
    }, server.request);

    await expect(anonymous.load()).rejects.toThrow('Dashboard sync load failed (401)');
    expect(server.dashboards.size).toBe(0);
  });
});
