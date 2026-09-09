import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OnboardingFlow } from './OnboardingFlow.js';

describe('critical onboarding browser markup', () => {
  it('exposes a named modal and a single clear first-step question', () => {
    const html = renderToStaticMarkup(<OnboardingFlow onComplete={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="onboarding-title"');
    expect(html).toContain('id="onboarding-title"');
    expect(html).toContain('What would you like Forge to help you change?');
  });

  it('exposes every goal as an unselected toggle and blocks continuation', () => {
    const html = renderToStaticMarkup(<OnboardingFlow onComplete={() => undefined} onClose={() => undefined} />);
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(7);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Continue/);
  });

  it('provides a named close control and visible four-step progress context', () => {
    const html = renderToStaticMarkup(<OnboardingFlow onComplete={() => undefined} onClose={() => undefined} />);
    expect(html).toContain('aria-label="Close plan setup"');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="1"');
    expect(html).toContain('aria-valuemax="4"');
    expect(html).toContain('aria-valuetext="Step 1 of 4"');
    expect(html).toContain('STEP 1 OF 4');
  });
});
