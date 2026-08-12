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
  const migrationUrl = new URL('../migrations/001_dashboard_snapshots.sql', import.meta.url);
  const sql = await readFile(fileURLToPath(migrationUrl), 'utf8');
  await pool.query(sql);
  console.log('Applied 001_dashboard_snapshots.sql');
} finally {
  await pool.end();
}
