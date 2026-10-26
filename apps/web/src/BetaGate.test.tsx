import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BetaEligibilityForm } from './BetaGate.js';
describe('international beta eligibility form', () => {
  it('shows adulthood and residence as separate unchecked confirmations', () => {
    const html = renderToStaticMarkup(<BetaEligibilityForm status={{ required: true, invited: true, country: 'US', countryEnabled: true, adultConfirmed: false, admitted: false }} busy={false} onConfirm={() => undefined} />);
    expect(html).toContain('gnosislab.io');
    expect(html).toContain('18 years');
    expect(html).toContain('United States');
    expect(html).not.toContain('checked=""');
    expect(html).toContain('disabled=""');
    expect(html).not.toContain('type="date"');
  });
});
