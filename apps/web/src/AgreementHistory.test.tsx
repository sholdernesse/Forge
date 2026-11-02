import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AgreementReceipt } from './AgreementHistory.js';
import { agreementReceiptExport, validConsentHistory, type ConsentEvent } from './consentClient.js';
const event: ConsentEvent = { eventId: '12', digest: 'original-digest', accepted: true, recordedAt: '2026-10-12T19:00:00.000Z',
  documents: [{ id: 'terms', version: 'old-1', title: 'Terms', text: 'Exact old text\n\nSecond paragraph <script>never execute</script>' }], locale: 'en-US', method: 'checkbox-and-button' };
describe('historical agreement receipts', () => {
  it('exports exact historical text and metadata rather than the current policy', () => {
    expect(JSON.parse(agreementReceiptExport(event))).toEqual({ schemaVersion: 1, kind: 'forge-agreement-receipt', event });
  });
  it('renders old versions and escapes their text with an explicit download action', () => {
    const html = renderToStaticMarkup(<AgreementReceipt event={event} onDownload={() => undefined} />);
    expect(html).toContain('old-1');
    expect(html).toContain('Exact old text');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('Download this receipt');
  });
  it('distinguishes withdrawal from a fresh acceptance', () => {
    const html = renderToStaticMarkup(<AgreementReceipt event={{ ...event, accepted: false, method: 'withdrawal' }} onDownload={() => undefined} />);
    expect(html).toContain('Consent withdrawn');
    expect(html).toContain('does not represent a new acceptance');
  });
  it('requires descending unique event IDs and consistent acceptance metadata', () => {
    expect(validConsentHistory({ events: [event], nextCursor: null })).toBe(true);
    expect(validConsentHistory({ events: [event, event], nextCursor: null })).toBe(false);
    expect(validConsentHistory({ events: [{ ...event, accepted: false }], nextCursor: null })).toBe(false);
    expect(validConsentHistory({ events: [{ ...event, recordedAt: 'invalid' }], nextCursor: null })).toBe(false);
  });
});
