import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MovementLibrary } from './MovementLibrary.js';

describe('movement library', () => {
  it('opens the full independent exercise catalog with search and practical filters', () => {
    const html = renderToStaticMarkup(<MovementLibrary onClose={() => undefined} />);

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="Close exercise lookup"');
    expect(html).toContain('placeholder="Try RDL, DB shoulder press, or chest"');
    expect(html).toContain('Form and muscle views');
    expect(html).toContain('32 of 32 exercises');
    expect(html.match(/loading="lazy"/g)).toHaveLength(32);
    expect(html.match(/decoding="async"/g)).toHaveLength(32);
    expect(html).toContain('All equipment');
    expect(html).toContain('All muscles');
    expect(html).toContain('Lookup only; your workout stays unchanged.');
    expect(html).toContain('View Barbell Romanian deadlift guide');
    expect(html).not.toContain('AI characters');
  });
});
