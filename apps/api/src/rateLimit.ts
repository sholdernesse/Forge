export interface RequestRateLimiter {
  allow(key: string): boolean;
}

export class InMemoryWindowRateLimiter implements RequestRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(private readonly limit: number, private readonly windowMs: number, private readonly now: () => number = Date.now) {
    if (!Number.isInteger(limit) || limit < 1 || windowMs < 1) throw new Error('Invalid rate-limit configuration');
  }

  allow(key: string): boolean {
    const current = this.now();
    const cutoff = current - this.windowMs;
    const recent = (this.attempts.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
    if (recent.length >= this.limit) { this.attempts.set(key, recent); return false; }
    recent.push(current);
    this.attempts.set(key, recent);
    if (this.attempts.size > 10_000) for (const [candidate, timestamps] of this.attempts) if (!timestamps.some((timestamp) => timestamp > cutoff)) this.attempts.delete(candidate);
    return true;
  }
}
