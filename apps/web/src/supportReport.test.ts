import { describe, expect, it } from 'vitest';
import { supportReport } from './supportReport.js';

const base = { releaseSha: 'A'.repeat(40), userAgent: 'Mozilla/5.0 Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0', online: true, at: new Date('2026-11-02T01:00:00Z') };

describe('support report privacy and interpretation', () => {
  it('reports the exact build and UTC capture time while distinguishing connection from API health', () => {
    const report = supportReport(base);
    expect(report).toContain('Build: ' + 'a'.repeat(40));
    expect(report).toContain('2026-11-02T01:00:00.000Z');
    expect(report).toContain('Browser: Edge 156');
    expect(report).toContain('service availability not verified');
    expect(supportReport({ ...base, online: false })).toContain('Browser connection: Offline');
  });

  it('never echoes arbitrary release, user agent, or extra identity/health fields', () => {
    const input = { ...base, releaseSha: 'secret-build-token', userAgent: 'secret-device-name',
      account: 'private-account', health: 'private-health', url: 'https://private-host/?token=private-token' };
    const report = supportReport(input);
    for (const secret of ['secret-build-token', 'secret-device-name', 'private-account', 'private-health', 'private-host', 'private-token']) expect(report).not.toContain(secret);
    expect(report).toContain('Development / unrecorded');
    expect(report).toContain('Other / unknown');
    expect(supportReport({ ...input, userAgent: 'Chrome/156.0 private-device-name' })).toContain('Browser: Chrome 156');
    expect(supportReport({ ...input, userAgent: 'Chrome/156.0 private-device-name' })).not.toContain('private-device-name');
  });

  it.each([
    ['FxiOS/144.0', 'Firefox 144'], ['Firefox/144.0', 'Firefox 144'],
    ['CriOS/143.0 Mobile', 'Chrome 143'], ['Version/18.6 Mobile Safari/604.1', 'Safari 18'],
    ['EdgiOS/140.0 Version/18.0 Safari/604.1', 'Edge 140'],
  ])('recognizes supported browser families without collecting the raw agent: %s', (userAgent, expected) => {
    expect(supportReport({ ...base, userAgent })).toContain('Browser: ' + expected);
  });
});
