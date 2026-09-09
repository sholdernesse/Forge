import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MovementLibrary } from './MovementLibrary.js';

describe('movement library', () => {
  it('opens as one searchable catalog without a redundant visual-system filter', () => {
    const html = renderToStaticMarkup(<MovementLibrary onClose={() => undefined} />);

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Close movement library"');
    expect(html).toContain('placeholder="Search movement or muscle"');
    expect(html).toContain('Every guide includes form and muscle views.');
    expect(html).toContain('32 movements');
    expect(html.match(/loading="lazy"/g)).toHaveLength(32);
    expect(html.match(/decoding="async"/g)).toHaveLength(32);
    expect(html).not.toContain('All guides');
    expect(html).not.toContain('AI characters');
  });
});
