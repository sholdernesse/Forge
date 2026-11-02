import { Pool, type PoolConfig } from 'pg';
import type { BetaInvitation, BetaRepository } from './betaAccess.js';
export class PostgresBetaRepository implements BetaRepository {
  private readonly pool: Pool;
  private readonly ownsPool: boolean;
  constructor(config: PoolConfig | Pool) {
    this.ownsPool = !(config instanceof Pool);
    this.pool = config instanceof Pool ? config : new Pool(config);
  }
  async invitation(userId: string): Promise<BetaInvitation | null> {
    const result = await this.pool.query<{ country: string; adult_confirmed_at: Date | null; revoked: boolean }>(
      'SELECT country, adult_confirmed_at, revoked FROM beta_invitations WHERE user_id = $1', [userId]);
    const row = result.rows[0];
    return row ? { country: row.country, adultConfirmedAt: row.adult_confirmed_at?.toISOString() ?? null, revoked: row.revoked } : null;
  }
  async confirmAdult(userId: string, country: string): Promise<boolean> {
    const result = await this.pool.query(
      'UPDATE beta_invitations SET adult_confirmed_at = COALESCE(adult_confirmed_at, NOW()) WHERE user_id = $1 AND country = $2 AND revoked = false', [userId, country]);
    return result.rowCount === 1;
  }
  async close() { if (this.ownsPool) await this.pool.end(); }
}
