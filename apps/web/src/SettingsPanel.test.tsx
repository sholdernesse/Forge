import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SettingsPanel } from './SettingsPanel.js';

describe('Forge data controls', () => {
  const callbacks = { onClose: () => undefined, onGeneratePlan: () => undefined, onReset: () => undefined, onExport: () => undefined, onDelete: async () => undefined, onOpenBudget: () => undefined, onOpenGlp1Support: () => undefined, glp1SupportEnabled: false, appearancePreference: 'light-gradient' as const, onAppearanceChange: () => undefined };

  it('offers a portable export and describes the deletion boundary', () => {
    const html = renderToStaticMarkup(<SettingsPanel {...callbacks} canDeleteCloud showOperationsBudget />);
    expect(html).toContain('Export my Forge data');
    expect(html).toContain('Delete synchronized Forge data');
    expect(html).toContain('cloud dashboard');
    expect(html).toContain('Forge operating budget');
    expect(html).toContain('GLP-1 support');
    expect(html).toContain('Light Gradient');
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*Light Gradient/);
  });

  it('disables cloud deletion when no authenticated sync session exists', () => {
    const html = renderToStaticMarkup(<SettingsPanel {...callbacks} canDeleteCloud={false} showOperationsBudget={false} />);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Sign in required<\/button>/);
    expect(html).not.toContain('Forge operating budget');
  });
});
