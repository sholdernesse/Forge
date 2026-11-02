import { Pool, type PoolConfig } from 'pg';
import type { ConsentRecord, ConsentRepository, ConsentHistoryPage } from './consent.js';

export class PostgresConsentRepository implements ConsentRepository {
  private readonly pool: Pool;
  private readonly ownsPool: boolean;
  constructor(config: PoolConfig | Pool) {
    this.ownsPool = !(config instanceof Pool);
    this.pool = config instanceof Pool ? config : new Pool(config);
  }
  async latest(userId: string): Promise<ConsentRecord | null> {
    const result = await this.pool.query<{ record: ConsentRecord }>(
      'SELECT record FROM consent_events WHERE user_id = $1 ORDER BY id DESC LIMIT 1', [userId]);
    return result.rows[0]?.record ?? null;
  }
  async history(userId: string, before?: string): Promise<ConsentHistoryPage> {
    const result = await this.pool.query<{ id: string; record: ConsentRecord }>(
      `SELECT id::text AS id, record FROM consent_events
       WHERE user_id = $1 AND ($2::bigint IS NULL OR id < $2::bigint)
       ORDER BY consent_events.id DESC LIMIT 21`, [userId, before ?? null]);
    const events = result.rows.slice(0, 20).map(row => ({ ...row.record, eventId: row.id }));
    return { events, nextCursor: result.rows.length > 20 ? events.at(-1)!.eventId : null };
  }
  async append(userId: string, record: ConsentRecord): Promise<void> {
    await this.pool.query('INSERT INTO consent_events (user_id, record) VALUES ($1, $2::jsonb)', [userId, JSON.stringify(record)]);
  }
  async close() { if (this.ownsPool) await this.pool.end(); }
}
