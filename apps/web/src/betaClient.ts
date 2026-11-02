import type { DashboardSyncConfig } from './dashboardSync.js';
export interface BetaStatus { required: boolean; invited: boolean; country: string | null; countryEnabled: boolean; adultConfirmed: boolean; admitted: boolean }
export function validBetaStatus(value: unknown): value is BetaStatus {
  if (!value || typeof value !== 'object') return false;
  const status = value as BetaStatus;
  if (!['required', 'invited', 'countryEnabled', 'adultConfirmed', 'admitted'].every(key => typeof (value as Record<string, unknown>)[key] === 'boolean')) return false;
  if (status.invited ? typeof status.country !== 'string' || !/^[A-Z]{2}$/.test(status.country) : status.country !== null || status.countryEnabled || status.adultConfirmed) return false;
  if (status.countryEnabled && status.country !== 'US') return false;
  return status.admitted === (!status.required || (status.invited && status.countryEnabled && status.adultConfirmed));
}
export class BetaClient {
  constructor(private readonly config: DashboardSyncConfig, private readonly request: typeof fetch = fetch) {}
  private async call(method: string, body?: unknown): Promise<BetaStatus> {
    const result = await this.request(`${this.config.baseUrl}/v1/beta`, {
      method, headers: { authorization: `Bearer ${await this.config.accessToken()}`, 'content-type': 'application/json' },
      signal: AbortSignal.timeout(15_000), ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!result.ok) throw new Error('Unable to verify your beta invitation. Check your connection and retry.');
    const value: unknown = await result.json();
    if (!validBetaStatus(value)) throw new Error('Unable to verify your beta access.');
    return value;
  }
  status(): Promise<BetaStatus> { return this.call('GET'); }
  async confirm(country: string): Promise<BetaStatus> {
    await this.call('POST', { country, adultConfirmed: true });
    const status = await this.status();
    if (!status.admitted) throw new Error('Your beta access was not confirmed. Please retry.');
    return status;
  }
}
