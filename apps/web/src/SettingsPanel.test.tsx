import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsPanel } from './SettingsPanel.js';

describe('Forge data controls', () => {
  const callbacks = { onClose: () => undefined, onGeneratePlan: () => undefined, onReset: () => undefined, onExport: () => undefined, onDelete: async () => undefined };

  it('offers a portable export and describes the deletion boundary', () => {
    const html = renderToStaticMarkup(<SettingsPanel {...callbacks} canDeleteCloud />);
    expect(html).toContain('Export my Forge data');
    expect(html).toContain('Delete synchronized Forge data');
    expect(html).toContain('cloud dashboard');
  });

  it('disables cloud deletion when no authenticated sync session exists', () => {
    const html = renderToStaticMarkup(<SettingsPanel {...callbacks} canDeleteCloud={false} />);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Sign in required<\/button>/);
  });
});
