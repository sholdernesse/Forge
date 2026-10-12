import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ConsentForm } from './ConsentGate.js';
import type { ConsentStatus } from './consentClient.js';
const status: ConsentStatus = { required: true, approved: true, accepted: false, digest: 'current', documents: [{ id: 'terms', version: '1', title: 'Terms', text: 'Full exact terms' }, { id: 'health-data', version: '1', title: 'Health Data', text: 'Full exact consent' }] };
describe('signup agreement presentation', () => {
  it('starts with distinct unchecked choices and prevents accidental acceptance', () => {
    const html = renderToStaticMarkup(<ConsentForm status={status} busy={false} onAccept={() => undefined} />);
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html).not.toContain('checked=""');
    expect(html).toContain('Full exact terms');
    expect(html).toContain('Full exact consent');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Agree and continue/);
  });
  it('makes draft text unavailable for signature', () => {
    const html = renderToStaticMarkup(<ConsentForm status={{ ...status, approved: false }} busy={false} onAccept={() => undefined} />);
    expect(html).toContain('drafts awaiting approval');
    expect(html.match(/type="checkbox" disabled=""/g)).toHaveLength(2);
  });
});
