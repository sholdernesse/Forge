import { parseDashboardState, type DashboardState } from './dashboardStorage.js';

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'syncing' | 'offline';

export interface RemoteDashboard {
  state: DashboardState;
  updatedAt: string;
  revision: string;
}

export interface DashboardSyncConfig {
  baseUrl: string;
  accessToken(): Promise<string>;
}

export class DashboardSyncConflictError extends Error {
  constructor() {
    super('Dashboard changed on another device; refresh before saving');
    this.name = 'DashboardSyncConflictError';
  }
}

interface RemoteDashboardPayload {
  state?: unknown;
  updatedAt?: unknown;
  revision?: unknown;
}

function isRemoteDashboard(payload: RemoteDashboardPayload): payload is RemoteDashboard {
  return parseDashboardState(payload.state) !== null
    && typeof payload.updatedAt === 'string'
    && typeof payload.revision === 'string';
}

export function newerThanLocal(remoteUpdatedAt: string, localUpdatedAt?: string): boolean {
  if (!localUpdatedAt) return true;
  return Date.parse(remoteUpdatedAt) > Date.parse(localUpdatedAt);
}

export class DashboardSyncClient {
  private revision: string | undefined;
  private saveQueue: Promise<void> = Promise.resolve();

  constructor(
    private readonly config: DashboardSyncConfig,
    private readonly request: typeof fetch = fetch,
  ) {}

  async load(): Promise<RemoteDashboard | null> {
    const token = await this.config.accessToken();
    const response = await this.request(`${this.config.baseUrl}/v1/dashboard`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Dashboard sync load failed (${response.status})`);
    const payload = await response.json() as RemoteDashboardPayload;
    if (!isRemoteDashboard(payload)) throw new Error('Dashboard sync returned an invalid payload');
    this.revision = payload.revision;
    return { ...payload, state: parseDashboardState(payload.state)! };
  }

  async initialize(localState: DashboardState, localUpdatedAt: string): Promise<RemoteDashboard> {
    const remote = await this.load();
    if (remote) return remote;
    try {
      return await this.save(localState, localUpdatedAt);
    } catch (error) {
      if (!(error instanceof DashboardSyncConflictError)) throw error;
      const winner = await this.load();
      if (!winner) throw error;
      return winner;
    }
  }

  save(state: DashboardState, updatedAt: string): Promise<RemoteDashboard> {
    const operation = this.saveQueue.then(() => this.performSave(state, updatedAt));
    this.saveQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async performSave(state: DashboardState, updatedAt: string): Promise<RemoteDashboard> {
    const token = await this.config.accessToken();
    const response = await this.request(`${this.config.baseUrl}/v1/dashboard`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...(this.revision ? { 'if-match': this.revision } : {}),
      },
      body: JSON.stringify({ state, updatedAt }),
    });
    if (response.status === 409 || response.status === 412) throw new DashboardSyncConflictError();
    if (!response.ok) throw new Error(`Dashboard sync save failed (${response.status})`);
    const payload = await response.json() as RemoteDashboardPayload;
    if (!isRemoteDashboard(payload)) throw new Error('Dashboard sync returned an invalid payload');
    this.revision = payload.revision;
    return { ...payload, state: parseDashboardState(payload.state)! };
  }
}

export function dashboardSyncConfig(environment: Record<string, unknown>, accessToken?: () => Promise<string>): DashboardSyncConfig | null {
  const baseUrl = environment.VITE_FORGE_SYNC_URL;
  if (typeof baseUrl !== 'string' || !baseUrl.trim() || !accessToken) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), accessToken };
}
