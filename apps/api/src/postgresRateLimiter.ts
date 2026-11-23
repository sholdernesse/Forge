import type { Pool } from 'pg';
import type { RequestRateLimiter } from './rateLimit.js';

/** ON CONFLICT locks one account row, so concurrent replicas cannot overspend its quota. */
export class PostgresWindowRateLimiter implements RequestRateLimiter {
  constructor(private readonly pool: Pool, private readonly limit: number, private readonly windowMs: number) {
    if (!Number.isInteger(limit) || limit < 1 || !Number.isFinite(windowMs) || windowMs < 1) throw new Error('Invalid rate-limit configuration');
  }
  async allow(key: string): Promise<boolean> {
    const result = await this.pool.query(
      `INSERT INTO meal_photo_limits (user_id, attempts)
       VALUES ($1, ARRAY[statement_timestamp()])
       ON CONFLICT (user_id) DO UPDATE SET attempts =
         array_append(ARRAY(SELECT t FROM unnest(meal_photo_limits.attempts) AS t
           WHERE t > statement_timestamp() - ($2 * interval '1 millisecond')), statement_timestamp())
       WHERE cardinality(ARRAY(SELECT t FROM unnest(meal_photo_limits.attempts) AS t
         WHERE t > statement_timestamp() - ($2 * interval '1 millisecond'))) < $3
       RETURNING user_id`,
      [key, this.windowMs, this.limit],
    );
    return result.rowCount === 1;
  }
}
