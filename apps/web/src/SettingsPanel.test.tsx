import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsPanel } from './SettingsPanel.js';

describe('Forge data controls', () => {
  const callbacks = { onClose: () => undefined, onGeneratePlan: () => undefined, onReset: () => undefined, onExport: () => undefined, onDelete: async () => undefined, onOpenBudget: () => undefined };

  it('offers a portable export and describes the deletion boundary', () => {
    const html = renderToStaticMarkup(<SettingsPanel {...callbacks} canDeleteCloud showOperationsBudget />);
    expect(html).toContain('Export my Forge data');
    expect(html).toContain('Delete synchronized Forge data');
    expect(html).toContain('cloud dashboard');
    expect(html).toContain('Forge operating budget');
  });

  it('disables cloud deletion when no authenticated sync session exists', () => {
    const html = renderToStaticMarkup(<SettingsPanel {...callbacks} canDeleteCloud={false} showOperationsBudget={false} />);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Sign in required<\/button>/);
    expect(html).not.toContain('Forge operating budget');
  });
});
