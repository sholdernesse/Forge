import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BetaClient, type BetaStatus } from './betaClient.js';
import { ConsentClient } from './consentClient.js';
import { dashboardSyncConfig } from './dashboardSync.js';
import type { useForgeAuth } from './useForgeAuth.js';

type Auth = ReturnType<typeof useForgeAuth>;
export function BetaEligibilityForm({ status, busy, onConfirm }: { status: BetaStatus; busy: boolean; onConfirm(): void }) {
  const [adult, setAdult] = useState(false);
  const [resident, setResident] = useState(false);
  const country = status.country ? new Intl.DisplayNames([navigator.language || 'en'], { type: 'region' }).of(status.country) : '';
  return <form onSubmit={event => { event.preventDefault(); if (adult && resident) onConfirm(); }}>
    <h1>Your Forge beta invitation</h1>
    <p>Forge by gnosislab.io is welcoming adult testers internationally in stages.</p>
    <p>Your invitation is for {country}. Confirm these details before reviewing your Forge agreements.</p>
    <label className="consent-choice"><input type="checkbox" checked={adult} disabled={busy} onChange={event => setAdult(event.target.checked)} /><span>I am 18 years of age or older.</span></label>
    <label className="consent-choice"><input type="checkbox" checked={resident} disabled={busy} onChange={event => setResident(event.target.checked)} /><span>I currently reside in {country}.</span></label>
    <p>No birth date is collected. If this country is incorrect, contact support before continuing.</p>
    <button type="submit" disabled={busy || !adult || !resident}>{busy ? 'Confirming…' : 'Confirm eligibility and continue'}</button>
  </form>;
}

export function BetaGate({ auth, environment, children }: { auth: Auth; environment: Record<string, unknown>; children: ReactNode }) {
  const config = useMemo(() => dashboardSyncConfig(environment, auth.accessToken), [environment, auth.accessToken]);
  const client = useMemo(() => config ? new BetaClient(config) : null, [config]);
  const bypass = auth.status === 'development' && environment.DEV === true && environment.VITE_FORGE_BETA_PREVIEW !== 'true';
  const manage = window.location.pathname === '/agreements';
  const [status, setStatus] = useState<BetaStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (bypass || manage || auth.status === 'signed-out' || auth.status === 'loading') return;
    let active = true;
    setStatus(null); setError('');
    if (!client) { setError('The account service is unavailable. Please retry.'); return; }
    void client.status().then(value => { if (active) setStatus(value); }).catch(() => { if (active) setError('Unable to verify beta access. Check your connection and retry.'); });
    const recheck = () => { if (document.visibilityState === 'visible') setRefresh(value => value + 1); };
    window.addEventListener('focus', recheck); document.addEventListener('visibilitychange', recheck);
    return () => { active = false; window.removeEventListener('focus', recheck); document.removeEventListener('visibilitychange', recheck); };
  }, [client, bypass, manage, auth.status, refresh]);
  if (bypass || manage || auth.status === 'signed-out' || auth.status === 'loading' || status?.admitted) return <>{children}</>;
  async function confirm() {
    if (!client || !status?.country) return;
    setBusy(true); setError('');
    try { setStatus(await client.confirm(status.country)); }
    catch { setError('Eligibility was not confirmed. Check your connection and retry.'); }
    finally { setBusy(false); }
  }
  async function deleteDashboard() {
    if (!config || !window.confirm('Delete your synchronized Forge dashboard? This cannot be undone.')) return;
    setBusy(true);
    try { await new ConsentClient(config).deleteDashboard(); setError('Synchronized dashboard deleted. Clear local Forge data separately on each device.'); }
    catch { setError('Deletion was not confirmed. Please retry.'); }
    finally { setBusy(false); }
  }
  return <div className="public-document-shell"><main className="public-document consent-gate">
    {!status ? <><h1>Forge international beta</h1><p role="status">{error ? 'Personal features are paused.' : 'Checking your beta invitation…'}</p></> :
      !status.invited ? <><h1>Forge international beta</h1><p>Beta access is by invitation. Contact support to express interest and include your country of residence. Please do not send health information.</p></> :
      !status.countryEnabled ? <><h1>Your beta country is not open yet</h1><p>We are opening Forge to testers in stages. Your invitation is saved; support can help with availability.</p></> :
      <BetaEligibilityForm status={status} busy={busy} onConfirm={() => void confirm()} />}
    {error && <p role="alert">{error}</p>}
    <p><button disabled={busy} onClick={() => setRefresh(value => value + 1)}>Check access again</button></p>
    <p><a href="/agreements">Agreement history and withdrawal</a> · <a href="/privacy">Privacy</a> · <a href="/support">Contact support</a></p>
    <p><button disabled={busy || !config} onClick={() => void deleteDashboard()}>Delete synchronized dashboard</button></p>
    <button disabled={busy} onClick={() => void auth.signOut()}>Sign out</button>
  </main></div>;
}
