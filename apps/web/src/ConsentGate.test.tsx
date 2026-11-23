import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ConsentForm, ConsentGate } from './ConsentGate.js';
import type { ConsentStatus } from './consentClient.js';
const status: ConsentStatus = { required: true, approved: true, accepted: false, digest: 'current', documents: [{ id: 'terms', version: '1', title: 'Terms', text: 'Full exact terms' }, { id: 'health-data', version: '1', title: 'Health Data', text: 'Full exact consent' }] };
describe('signup agreement presentation', () => {
  it('does not mount personal health features for signed-out users', () => {
    const html = renderToStaticMarkup(<ConsentGate auth={{ status: 'signed-out', accessToken: async () => '', signIn: async () => undefined, signOut: async () => undefined }} environment={{}}><div>PRIVATE HEALTH INPUT</div></ConsentGate>);
    expect(html).not.toContain('PRIVATE HEALTH INPUT');
    expect(html).toContain('Sign in');
  });
  it('starts with distinct unchecked choices and prevents accidental acceptance', () => {
    const html = renderToStaticMarkup(<ConsentForm status={status} busy={false} onAccept={() => undefined} />);
    expect(html.match(/type="checkbox"/g)).toHaveLength(2);
    expect(html).not.toContain('checked=""');
    expect(html).toContain('Full exact terms');
    expect(html).toContain('Full exact consent');
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Accept and continue/);
  });
  it('shows the exact policy safety notice outside collapsed agreements and discloses the waiver', () => {
    const notice = 'STOP IMMEDIATELY IF YOU FEEL DISCOMFORT.\nStop and seek medical advice from my doctor before resuming.';
    const html = renderToStaticMarkup(<ConsentForm status={{ ...status, approved: false, documents: [
      ...status.documents, { id: 'fitness-risk', version: '2-draft', title: 'Release of Liability', text: `Voluntary participation.\n\n${notice}` },
    ] }} busy={false} onAccept={() => undefined} />);
    const visibleNotice = html.slice(html.indexOf('<aside'), html.indexOf('</aside>'));
    expect(visibleNotice).toContain('<strong>STOP IMMEDIATELY IF YOU FEEL DISCOMFORT.</strong>');
    expect(visibleNotice).toContain('seek medical advice from my doctor before resuming');
    expect(html.indexOf('<aside')).toBeLessThan(html.indexOf('<details>'));
    expect(html).toContain('includes a waiver of certain legal claims');
    expect(html.match(/type="checkbox" disabled=""/g)).toHaveLength(3);
    expect(html).not.toContain('checked=""');
  });
  it('makes draft text unavailable for signature', () => {
    const html = renderToStaticMarkup(<ConsentForm status={{ ...status, approved: false }} busy={false} onAccept={() => undefined} />);
    expect(html).toContain('drafts awaiting approval');
    expect(html.match(/type="checkbox" disabled=""/g)).toHaveLength(2);
  });
});
