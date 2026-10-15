import type { DashboardSyncConfig } from './dashboardSync.js';

export interface ConsentDocument { id: string; version: string; title: string; text: string }
export interface ConsentEvent { eventId: string; digest: string; accepted: boolean; recordedAt: string; documents: ConsentDocument[]; locale: string; method: 'checkbox-and-button' | 'withdrawal' }
export interface ConsentHistoryPage { events: ConsentEvent[]; nextCursor: string | null }
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
  async history(before?: string): Promise<ConsentHistoryPage> {
    const result = await this.request(`${this.config.baseUrl}/v1/consent/history${before ? `?before=${encodeURIComponent(before)}` : ''}`, {
      headers: { authorization: `Bearer ${await this.config.accessToken()}` },
    });
    if (!result.ok) throw new Error('Unable to load your agreement history. Please retry.');
    const page: unknown = await result.json();
    if (!validConsentHistory(page)) throw new Error('Unable to verify your agreement history.');
    return page;
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

function validDocument(value: unknown): value is ConsentDocument {
  if (!value || typeof value !== 'object') return false;
  const d = value as ConsentDocument;
  return typeof d.id === 'string' && typeof d.version === 'string' && typeof d.title === 'string' && typeof d.text === 'string';
}
export function validConsentHistory(value: unknown): value is ConsentHistoryPage {
  if (!value || typeof value !== 'object') return false;
  const p = value as ConsentHistoryPage;
  const validId = (id: unknown) => typeof id === 'string' && /^[1-9][0-9]{0,18}$/.test(id) && BigInt(id) <= 9223372036854775807n;
  if (!Array.isArray(p.events) || p.events.length > 20 || !(p.nextCursor === null || validId(p.nextCursor))) return false;
  if (!p.events.every(e => e && validId(e.eventId) && typeof e.digest === 'string' && typeof e.accepted === 'boolean'
    && typeof e.recordedAt === 'string' && Number.isFinite(Date.parse(e.recordedAt)) && typeof e.locale === 'string'
    && (e.method === 'checkbox-and-button' || e.method === 'withdrawal') && e.accepted === (e.method === 'checkbox-and-button')
    && Array.isArray(e.documents) && e.documents.every(validDocument))) return false;
  if (!p.events.every((e, i) => i === 0 || BigInt(e.eventId) < BigInt(p.events[i - 1]!.eventId))) return false;
  return p.nextCursor === null || (p.events.length === 20 && p.nextCursor === p.events.at(-1)!.eventId);
}
export function agreementReceiptExport(event: ConsentEvent): string {
  return JSON.stringify({ schemaVersion: 1, kind: 'forge-agreement-receipt', event }, null, 2);
}
