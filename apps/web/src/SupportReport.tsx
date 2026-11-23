import { useState } from 'react';
import { supportReport } from './supportReport.js';

export function SupportReport() {
  const [report, setReport] = useState('');
  const [status, setStatus] = useState('');
  return <section className="support-report" aria-labelledby="support-report-title">
    <h3 id="support-report-title">Report a beta issue</h3>
    <p>Prepare the build, UTC time, browser version, and connection status for support. Review the report before sharing it. Preparing it sends nothing.</p>
    <button type="button" onClick={() => {
      const environment = (import.meta as ImportMeta & { env: Record<string, unknown> }).env;
      setReport(supportReport({ releaseSha: environment.VITE_FORGE_RELEASE_SHA,
        userAgent: navigator.userAgent, online: navigator.onLine, at: new Date() }));
      setStatus('Report prepared. Review it below before copying.');
    }}>{report ? 'Refresh support report' : 'Prepare support report'}</button>
    {report && <>
      <label htmlFor="forge-support-report">Support report</label>
      <textarea id="forge-support-report" readOnly value={report} rows={10} onFocus={event => event.currentTarget.select()} />
      <button type="button" onClick={() => {
        setStatus('');
        void (async () => {
          try {
            await navigator.clipboard.writeText(report);
            setStatus('Report copied. Paste it into your support message.');
          } catch {
            setStatus('Clipboard unavailable. Select the report above and copy it manually.');
          }
        })();
      }}>Copy support report</button>
    </>}
    <p role="status">{status}</p>
    <a href="/support">Contact Forge support</a>
  </section>;
}
