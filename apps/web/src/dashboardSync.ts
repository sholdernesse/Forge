import { parseDashboardState, type DashboardState } from './dashboardStorage.js';

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'syncing' | 'offline';

export interface RemoteDashboard {
  state: DashboardState;
  updatedAt: string;
  revision: string;
}

export interface DashboardSyncConfig {
  baseUrl: string;
  token: string;
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
    const response = await this.request(`${this.config.baseUrl}/v1/dashboard`, {
      headers: { authorization: `Bearer ${this.config.token}` },
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
    return remote ?? this.save(localState, localUpdatedAt);
  }

  save(state: DashboardState, updatedAt: string): Promise<RemoteDashboard> {
    const operation = this.saveQueue.then(() => this.performSave(state, updatedAt));
    this.saveQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async performSave(state: DashboardState, updatedAt: string): Promise<RemoteDashboard> {
    const response = await this.request(`${this.config.baseUrl}/v1/dashboard`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${this.config.token}`,
        'content-type': 'application/json',
        ...(this.revision ? { 'if-match': this.revision } : {}),
      },
      body: JSON.stringify({ state, updatedAt }),
    });
    if (response.status === 409 || response.status === 412) throw new Error('Dashboard changed on another device; refresh before saving');
    if (!response.ok) throw new Error(`Dashboard sync save failed (${response.status})`);
    const payload = await response.json() as RemoteDashboardPayload;
    if (!isRemoteDashboard(payload)) throw new Error('Dashboard sync returned an invalid payload');
    this.revision = payload.revision;
    return { ...payload, state: parseDashboardState(payload.state)! };
  }
}

export function dashboardSyncConfig(environment: Record<string, unknown>): DashboardSyncConfig | null {
  const baseUrl = environment.VITE_FORGE_SYNC_URL;
  const token = environment.VITE_FORGE_SYNC_TOKEN;
  if (typeof baseUrl !== 'string' || !baseUrl.trim() || typeof token !== 'string' || !token.trim()) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}
