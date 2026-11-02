import { parseDashboardState, type DashboardState } from './dashboardStorage.js';

export type SyncStatus = 'local' | 'connecting' | 'synced' | 'syncing' | 'reconnecting' | 'conflict' | 'offline';

export function syncFailureStatus(browserOnline: boolean): SyncStatus {
  return browserOnline ? 'reconnecting' : 'offline';
}

export interface RemoteDashboard {
  state: DashboardState;
  updatedAt: string;
  revision: string;
}

export interface DashboardSyncConfig {
  baseUrl: string;
  accessToken(): Promise<string>;
  requestTimeoutMs?: number;
}

export class DashboardSyncConflictError extends Error {
  constructor(
    readonly currentRevision?: string,
    readonly currentUpdatedAt?: string,
  ) {
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
  private pendingSave: { state: DashboardState; updatedAt: string; promise: Promise<RemoteDashboard> } | undefined;

  constructor(
    private readonly config: DashboardSyncConfig,
    private readonly request: typeof fetch = fetch,
  ) {}

  load(): Promise<RemoteDashboard | null> {
    // Reads and deletes are barriers: never combine saves across either one.
    this.pendingSave = undefined;
    return this.enqueue(() => this.timed(signal => this.performLoad(signal)));
  }

  private async performLoad(signal: AbortSignal): Promise<RemoteDashboard | null> {
    const token = await this.config.accessToken();
    signal.throwIfAborted();
    const response = await this.request(`${this.config.baseUrl}/v1/dashboard`, {
      headers: { authorization: `Bearer ${token}` }, signal,
    });
    if (response.status === 404) { signal.throwIfAborted(); this.revision = undefined; return null; }
    if (!response.ok) throw new Error(`Dashboard sync load failed (${response.status})`);
    const payload = await response.json() as RemoteDashboardPayload;
    if (!isRemoteDashboard(payload)) throw new Error('Dashboard sync returned an invalid payload');
    signal.throwIfAborted();
    this.revision = payload.revision;
    return { ...payload, state: parseDashboardState(payload.state)! };
  }

  async initialize(localState: DashboardState, localUpdatedAt: string): Promise<RemoteDashboard> {
    const remote = await this.load();
    if (remote && !newerThanLocal(localUpdatedAt, remote.updatedAt)) return remote;
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
    if (this.pendingSave) {
      this.pendingSave.state = state;
      this.pendingSave.updatedAt = updatedAt;
      return this.pendingSave.promise;
    }
    const batch = { state, updatedAt, promise: undefined! as Promise<RemoteDashboard> };
    this.pendingSave = batch;
    batch.promise = this.enqueue(() => {
      if (this.pendingSave === batch) this.pendingSave = undefined;
      return this.timed(signal => this.performSave(batch.state, batch.updatedAt, signal));
    });
    return batch.promise;
  }

  delete(): Promise<void> {
    this.pendingSave = undefined;
    return this.enqueue(() => this.timed(async signal => {
      const token = await this.config.accessToken();
      signal.throwIfAborted();
      const response = await this.request(`${this.config.baseUrl}/v1/dashboard`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` }, signal,
      });
      signal.throwIfAborted();
      if (!response.ok) throw new Error(`Dashboard deletion failed (${response.status})`);
      this.revision = undefined;
    }));
  }

  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const operation = this.saveQueue.then(work);
    this.saveQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  private async timed<T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> {
    const controller = new AbortController();
    let rejectTimeout: (reason: Error) => void = () => undefined;
    const timeout = new Promise<never>((_resolve, reject) => { rejectTimeout = reject; });
    const timer = setTimeout(() => {
      const error = new Error('Dashboard sync timed out; your changes remain saved on this device');
      controller.abort(error);
      rejectTimeout(error);
    }, this.config.requestTimeoutMs ?? 15_000);
    try { return await Promise.race([work(controller.signal), timeout]); }
    finally { clearTimeout(timer); }
  }

  private async performSave(state: DashboardState, updatedAt: string, signal: AbortSignal): Promise<RemoteDashboard> {
    const token = await this.config.accessToken();
    signal.throwIfAborted();
    const response = await this.request(`${this.config.baseUrl}/v1/dashboard`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        ...(this.revision ? { 'if-match': this.revision } : {}),
      },
      body: JSON.stringify({ state, updatedAt }), signal,
    });
    if (response.status === 409 || response.status === 412) {
      const conflict = await response.json().catch(() => null) as { current?: { revision?: unknown; updatedAt?: unknown } } | null;
      throw new DashboardSyncConflictError(
        typeof conflict?.current?.revision === 'string' ? conflict.current.revision : undefined,
        typeof conflict?.current?.updatedAt === 'string' ? conflict.current.updatedAt : undefined,
      );
    }
    if (!response.ok) throw new Error(`Dashboard sync save failed (${response.status})`);
    const payload = await response.json() as RemoteDashboardPayload;
    if (!isRemoteDashboard(payload)) throw new Error('Dashboard sync returned an invalid payload');
    signal.throwIfAborted();
    this.revision = payload.revision;
    return { ...payload, state: parseDashboardState(payload.state)! };
  }
}

export function dashboardSyncConfig(environment: Record<string, unknown>, accessToken?: () => Promise<string>): DashboardSyncConfig | null {
  if (environment.DEV === true && accessToken) return { baseUrl: '/api', accessToken };
  const baseUrl = environment.VITE_FORGE_SYNC_URL;
  if (typeof baseUrl !== 'string' || !baseUrl.trim() || !accessToken) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), accessToken };
}
