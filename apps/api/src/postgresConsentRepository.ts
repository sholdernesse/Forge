import { Pool, type PoolConfig } from 'pg';
import type { ConsentRecord, ConsentRepository } from './consent.js';

export class PostgresConsentRepository implements ConsentRepository {
  private readonly pool: Pool;
  constructor(config: PoolConfig) { this.pool = new Pool(config); }
  async latest(userId: string): Promise<ConsentRecord | null> {
    const result = await this.pool.query<{ record: ConsentRecord }>(
      'SELECT record FROM consent_events WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
    return result.rows[0]?.record ?? null;
  }
  async append(userId: string, record: ConsentRecord): Promise<void> {
    await this.pool.query('INSERT INTO consent_events (user_id, record) VALUES ($1, $2::jsonb)', [userId, JSON.stringify(record)]);
  }
  async close() { await this.pool.end(); }
}
