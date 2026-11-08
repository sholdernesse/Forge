import { describe, expect, it } from 'vitest';
import { InMemoryWindowRateLimiter } from './rateLimit.js';

describe('in-memory request limiter', () => {
  it('limits each subject independently and recovers after the window', () => {
    let now = 1_000;
    const limiter = new InMemoryWindowRateLimiter(2, 100, () => now);
    expect(limiter.allow('user-a')).toBe(true);
    expect(limiter.allow('user-a')).toBe(true);
    expect(limiter.allow('user-a')).toBe(false);
    expect(limiter.allow('user-b')).toBe(true);
    now = 1_101;
    expect(limiter.allow('user-a')).toBe(true);
  });
});
