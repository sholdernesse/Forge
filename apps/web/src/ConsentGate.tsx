import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ConsentClient, type ConsentStatus } from './consentClient.js';
import { dashboardSyncConfig } from './dashboardSync.js';
import type { useForgeAuth } from './useForgeAuth.js';

type Auth = ReturnType<typeof useForgeAuth>;
export function ConsentForm({ status, busy, onAccept }: { status: ConsentStatus; busy: boolean; onAccept(ids: string[]): void }) {
  const [checked, setChecked] = useState<string[]>([]);
  return <form onSubmit={event => { event.preventDefault(); onAccept(checked); }}>
    <h1>Before you start your Forge plan</h1>
    <p>Review these agreements before entering personal fitness or nutrition information.</p>
    {!status.approved && <p role="status">These agreements are drafts awaiting approval. Personal features are not available yet.</p>}
    {status.documents.map(document => <section key={document.id}>
      <details><summary>{document.title} · {document.version}</summary>{document.text.split('\n\n').map((paragraph, index) => <p key={index} style={{ whiteSpace: 'pre-line' }}>{paragraph}</p>)}</details>
      <label className="consent-choice"><input type="checkbox" disabled={busy || !status.approved}
        checked={checked.includes(document.id)} onChange={event => setChecked(current => event.target.checked ? [...current, document.id] : current.filter(id => id !== document.id))} />
        <span>{document.id === 'health-data' ? 'I consent to the health-data use described above.' : `I have read and agree to the ${document.title}.`}</span></label>
    </section>)}
    <p><a href="/privacy" target="_blank" rel="noreferrer">Read the Privacy Notice</a></p>
    <button type="submit" disabled={busy || !status.approved || checked.length !== status.documents.length}>{busy ? 'Saving your agreement…' : 'Agree and continue'}</button>
  </form>;
}

export function ConsentGate({ auth, environment, children }: { auth: Auth; environment: Record<string, unknown>; children: ReactNode }) {
  const client = useMemo(() => {
    const config = dashboardSyncConfig(environment, auth.accessToken);
    return config ? new ConsentClient(config) : null;
  }, [environment, auth.accessToken]);
  const bypass = (auth.status === 'development' && environment.DEV === true && environment.VITE_FORGE_CONSENT_PREVIEW !== 'true');
  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (bypass || auth.status === 'loading' || auth.status === 'signed-out') return;
    let active = true;
    setStatus(null);
    if (!client) { setError('Forge cannot verify your agreements while the account service is unavailable.'); return; }
    void client.status().then(value => { if (active) { setStatus(value); setError(''); } }).catch(() => { if (active) setError('Unable to verify your agreements. Check your connection and retry.'); });
    const recheck = () => { if (document.visibilityState === 'visible') setRefresh(value => value + 1); };
    window.addEventListener('focus', recheck); document.addEventListener('visibilitychange', recheck);
    return () => { active = false; window.removeEventListener('focus', recheck); document.removeEventListener('visibilitychange', recheck); };
  }, [client, bypass, auth.status, auth.username, refresh]);
  if (auth.status === 'signed-out') return <div className="public-document-shell"><main className="public-document consent-gate"><h1>Welcome to Forge</h1><p>Sign in to review your agreements and start your personal fitness and nutrition plan.</p><button onClick={() => void auth.signIn()}>Sign in</button><p><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/support">Support</a></p></main></div>;
  const manage = window.location.pathname === '/agreements';
  if (manage && status?.accepted) return <div className="public-document-shell"><main className="public-document consent-gate">
    <h1>Your Forge agreements</h1><p>Accepted {status.record?.recordedAt}. You can print this page to keep a copy.</p>
    {(status.record?.documents ?? status.documents).map(document => <section key={document.id}><h2>{document.title} · {document.version}</h2>{document.text.split('\n\n').map((p, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{p}</p>)}</section>)}
    <p>Withdrawing consent stops personal fitness and nutrition use until you accept again. Dashboard deletion remains available through the account service; contact support if you need assistance.</p>
    <button disabled={busy} onClick={async () => { if (!client) return; setBusy(true); try { await client.withdraw(); setStatus(null); setRefresh(value => value + 1); } catch { setError('Unable to withdraw consent. Please retry.'); } finally { setBusy(false); } }}>Withdraw consent</button>
    {error && <p role="alert">{error}</p>}<p><a href="/">Return to Forge</a> · <a href="/support">Support</a></p>
  </main></div>;
  if (bypass || (status && (!status.required || status.accepted) && !manage)) return <>{children}</>;
  async function accept(ids: string[]) {
    if (!client || !status) return;
    setBusy(true); setError('');
    try { setStatus(await client.accept(status, ids, navigator.language || 'en')); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save your agreement.'); }
    finally { setBusy(false); }
  }
  async function deleteDashboard() {
    if (!client || !window.confirm('Delete your synchronized Forge dashboard? This cannot be undone. Local copies on other devices must be cleared separately.')) return;
    setBusy(true);
    try { await client.deleteDashboard(); setError('Synchronized dashboard deleted. Clear local Forge data separately on each device.'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Deletion failed.'); }
    finally { setBusy(false); }
  }
  return <div className="public-document-shell"><main className="public-document consent-gate">
    {status ? <ConsentForm key={status.digest} status={status} busy={busy} onAccept={ids => void accept(ids)} /> : <p role="status">{error ? 'Personal features are paused.' : 'Checking your Forge agreements…'}</p>}
    {error && <><p role="alert">{error}</p><button onClick={() => setRefresh(value => value + 1)}>Retry</button></>}
    <p><button disabled={busy || !client} onClick={() => void deleteDashboard()}>Delete synchronized dashboard</button></p>
    <p><button onClick={() => void auth.signOut()}>Sign out</button> · <a href="/support">Support</a></p>
  </main></div>;
}
