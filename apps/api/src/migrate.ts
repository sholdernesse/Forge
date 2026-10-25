import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false },
});

try {
  for (const name of ['001_dashboard_snapshots.sql', '002_consent_events.sql', '003_beta_invitations.sql']) {
    const migrationUrl = new URL(`../migrations/${name}`, import.meta.url);
    await pool.query(await readFile(fileURLToPath(migrationUrl), 'utf8'));
    console.log(`Applied ${name}`);
  }
} finally {
  await pool.end();
}
