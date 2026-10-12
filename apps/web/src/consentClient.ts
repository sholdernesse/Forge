import type { DashboardSyncConfig } from './dashboardSync.js';

export interface ConsentDocument { id: string; version: string; title: string; text: string }
export interface ConsentStatus { required: boolean; approved: boolean; accepted: boolean; digest: string; documents: ConsentDocument[]; record?: { recordedAt: string; documents: ConsentDocument[]; accepted: boolean } | null }
export class ConsentClient {
  constructor(private readonly config: DashboardSyncConfig, private readonly request: typeof fetch = fetch) {}
  private async call(method: string, body?: unknown): Promise<Response> {
    const result = await this.request(`${this.config.baseUrl}/v1/consent`, {
      method, headers: { authorization: `Bearer ${await this.config.accessToken()}`, 'content-type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!result.ok) throw new Error(result.status === 409 ? 'The agreements changed. Review the latest version and try again.' : 'Unable to confirm your agreement. Please retry.');
    return result;
  }
  async status(): Promise<ConsentStatus> {
    const value = await (await this.call('GET')).json() as ConsentStatus;
    if (typeof value.required !== 'boolean' || typeof value.approved !== 'boolean' || typeof value.accepted !== 'boolean'
      || typeof value.digest !== 'string' || !Array.isArray(value.documents) || value.documents.length === 0
      || !value.documents.every(d => typeof d.id === 'string' && typeof d.version === 'string' && typeof d.title === 'string' && typeof d.text === 'string')) throw new Error('Unable to verify Forge agreements.');
    return value;
  }
  async accept(status: ConsentStatus, accepted: string[], locale: string): Promise<ConsentStatus> {
    await this.call('POST', { digest: status.digest, accepted, locale });
    // Mount personal features only after the server confirms current account acceptance.
    const next = await this.status();
    if (!next.accepted) throw new Error('Your agreement was not confirmed. Please retry.');
    return next;
  }
  async deleteDashboard(): Promise<void> {
    const result = await this.request(`${this.config.baseUrl}/v1/dashboard`, { method: 'DELETE', headers: { authorization: `Bearer ${await this.config.accessToken()}` } });
    if (!result.ok) throw new Error('Unable to delete synchronized data. Please retry.');
  }
  async withdraw(): Promise<void> { await this.call('DELETE'); }
}
