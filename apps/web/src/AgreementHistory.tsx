import { useEffect, useRef, useState } from 'react';
import { ConsentClient, agreementReceiptExport, type ConsentEvent } from './consentClient.js';

export function AgreementReceipt({ event, onDownload }: { event: ConsentEvent; onDownload(event: ConsentEvent): void }) {
  return <article className="agreement-receipt">
    <h2>{event.accepted ? 'Agreements accepted' : 'Consent withdrawn'}</h2>
    <p><time dateTime={event.recordedAt}>{new Date(event.recordedAt).toLocaleString()}</time> · {event.locale}</p>
    <p>{event.accepted ? 'This is the exact text recorded with your acceptance.' : 'This event records withdrawal. Any text shown below is from the prior agreement and does not represent a new acceptance.'}</p>
    {event.documents.map(document => <details key={document.id}><summary>{document.title} · {document.version}</summary>
      {document.text.split('\n\n').map((paragraph, index) => <p key={index} style={{ whiteSpace: 'pre-line' }}>{paragraph}</p>)}
    </details>)}
    <button onClick={() => onDownload(event)}>Download this receipt</button>
  </article>;
}

function downloadReceipt(event: ConsentEvent) {
  const url = URL.createObjectURL(new Blob([agreementReceiptExport(event)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `forge-agreement-${event.eventId}.json`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AgreementHistory({ client }: { client: ConsentClient }) {
  const [events, setEvents] = useState<ConsentEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const loading = useRef(false);
  useEffect(() => {
    const current = ++generation.current;
    setEvents([]); setCursor(null); setLoaded(false); setBusy(true); setError(''); loading.current = true;
    void client.history().then(page => {
      if (generation.current !== current) return;
      setEvents(page.events); setCursor(page.nextCursor); setLoaded(true);
    }).catch(() => { if (generation.current === current) setError('Unable to load your agreement history. Please retry.'); })
      .finally(() => { if (generation.current === current) { setBusy(false); loading.current = false; } });
    return () => { generation.current++; };
  }, [client]);
  async function loadMore() {
    if (loading.current) return;
    const current = generation.current;
    setBusy(true); setError(''); loading.current = true;
    try {
      const page = await client.history(loaded ? cursor ?? undefined : undefined);
      if (generation.current !== current) return;
      setEvents(previous => loaded ? [...previous, ...page.events] : page.events);
      setCursor(page.nextCursor); setLoaded(true);
    } catch { if (generation.current === current) setError('Unable to load your agreement history. Please retry.'); }
    finally { if (generation.current === current) { setBusy(false); loading.current = false; } }
  }
  return <section aria-labelledby="agreement-history-title" aria-busy={busy}>
    <h2 id="agreement-history-title">Your agreement history</h2>
    <p>Review and download earlier acceptances and withdrawals. History remains available when you need to accept a newer agreement.</p>
    {events.map(event => <AgreementReceipt key={event.eventId} event={event} onDownload={downloadReceipt} />)}
    {loaded && events.length === 0 && <p>No agreement events have been recorded for this account.</p>}
    {busy && <p role="status">Loading agreement history…</p>}
    {error && <p role="alert">{error}</p>}
    {(!loaded || cursor || error) && <button disabled={busy} onClick={() => void loadMore()}>{error ? 'Retry history' : loaded ? 'Load older agreements' : 'Load agreement history'}</button>}
  </section>;
}
