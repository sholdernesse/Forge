import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PanelLoading } from './deferredPanel.js';
describe('deferred screen access', () => {
  it('provides a named, closable dialog during loading and a retry when loading fails', () => {
    const props = { title: 'Movement guides', onClose() {}, onRetry() {} };
    const loading = renderToStaticMarkup(<PanelLoading {...props} failed={false} />);
    expect(loading).toContain('role="dialog"');
    expect(loading).toContain('aria-label="Close Movement guides"');
    expect(loading).toContain('role="status"');
    expect(loading).not.toContain('Try again');
    const failed = renderToStaticMarkup(<PanelLoading {...props} failed />);
    expect(failed).toContain('role="alert"');
    expect(failed).toContain('Try again');
  });
});
