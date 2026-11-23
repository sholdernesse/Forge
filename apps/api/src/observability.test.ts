import { describe, expect, it, vi } from 'vitest';
import { errorType, requestLog, requestRoute, writeApiLog } from './observability.js';

describe('API observability', () => {
  it('normalizes routes so queries and barcode values never enter logs', () => {
    expect(requestRoute('/v1/foods/search')).toBe('/v1/foods/search');
    expect(requestRoute('/v1/foods/photo-analysis')).toBe('/v1/foods/photo-analysis');
    expect(requestRoute('/v1/foods/barcode/0123456789012')).toBe('/v1/foods/barcode/:barcode');
    expect(requestRoute('/private/value')).toBe('unmatched');
  });

  it('creates a bounded structured completion record without request content', () => {
    expect(requestLog({
      level: 'info',
      event: 'api.request.completed',
      requestId: 'request-1',
      method: 'PUT',
      route: '/v1/dashboard',
      status: 200,
      startedAt: 10,
      finishedAt: 22.345,
      now: new Date('2026-09-17T12:00:00.000Z'),
    })).toEqual({
      timestamp: '2026-09-17T12:00:00.000Z',
      level: 'info',
      event: 'api.request.completed',
      requestId: 'request-1',
      method: 'PUT',
      route: '/v1/dashboard',
      status: 200,
      durationMs: 12.3,
    });
  });

  it('records only the error class and writes failures to stderr', () => {
    const output = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(errorType(new TypeError('token=secret'))).toBe('TypeError');
    writeApiLog(requestLog({ level: 'error', event: 'api.request.failed', requestId: 'request-2', method: 'GET', route: 'unmatched', status: 500, errorType: 'TypeError', startedAt: 0, finishedAt: 1 }));
    expect(output).toHaveBeenCalledOnce();
    expect(output.mock.calls[0]![0]).not.toContain('secret');
    output.mockRestore();
  });
});
