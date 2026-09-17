import { randomUUID } from 'node:crypto';
import { Pool, type PoolConfig } from 'pg';
import { RevisionConflictError, type DashboardEnvelope, type DashboardRepository } from './types.js';

interface DashboardRow {
  state: unknown;
  updated_at: Date | string;
  revision: string;
}

function envelope(row: DashboardRow): DashboardEnvelope {
  return {
    state: row.state,
    updatedAt: new Date(row.updated_at).toISOString(),
    revision: row.revision,
  };
}

export class PostgresDashboardRepository implements DashboardRepository {
  private readonly pool: Pool;

  constructor(config: PoolConfig | Pool) {
    this.pool = config instanceof Pool ? config : new Pool(config);
  }

  async get(userId: string): Promise<DashboardEnvelope | null> {
    const result = await this.pool.query<DashboardRow>(
      'SELECT state, updated_at, revision FROM dashboard_snapshots WHERE user_id = $1',
      [userId],
    );
    return result.rows[0] ? envelope(result.rows[0]) : null;
  }

  async put(userId: string, state: unknown, expectedRevision?: string): Promise<DashboardEnvelope> {
    const revision = randomUUID();
    const result = expectedRevision
      ? await this.pool.query<DashboardRow>(
        `UPDATE dashboard_snapshots
         SET state = $2::jsonb, updated_at = NOW(), revision = $3
         WHERE user_id = $1 AND revision = $4
         RETURNING state, updated_at, revision`,
        [userId, JSON.stringify(state), revision, expectedRevision],
      )
      : await this.pool.query<DashboardRow>(
        `INSERT INTO dashboard_snapshots (user_id, state, revision)
         VALUES ($1, $2::jsonb, $3)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING state, updated_at, revision`,
        [userId, JSON.stringify(state), revision],
      );
    if (!result.rows[0]) throw new RevisionConflictError();
    return envelope(result.rows[0]);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
