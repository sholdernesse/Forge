import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

export function parseInvitationCommand(args, environment = process.env) {
  const action = args[0];
  if (!['invite', 'status', 'revoke'].includes(action)) throw new Error('Choose invite, status, or revoke.');
  const options = { action, subject: environment.FORGE_BETA_SUBJECT, country: 'US', apply: false };
  const seen = new Set();
  for (let index = 1; index < args.length; index++) {
    const flag = args[index];
    if (seen.has(flag)) throw new Error('Duplicate option.');
    seen.add(flag);
    if (flag === '--apply') options.apply = true;
    else if (flag === '--subject' || flag === '--country') {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error('Missing option value.');
      options[flag.slice(2)] = value;
    } else throw new Error('Unknown option.');
  }
  if (typeof options.subject !== 'string' || !options.subject.trim() || options.subject.length > 512 || /[\x00-\x1f\x7f]/.test(options.subject)) throw new Error('A verified identity subject is required (use --subject or FORGE_BETA_SUBJECT).');
  options.subject = options.subject.trim();
  options.country = options.country.toUpperCase();
  if (options.country !== 'US') throw new Error('The initial beta accepts US residents only.');
  return options;
}

/** Uses a bound identity subject, never an email lookup or a browser-supplied identity. */
export async function manageInvitation(options, connect) {
  if (!['invite', 'status', 'revoke'].includes(options.action) || !options.subject || options.country !== 'US') throw new Error('Invalid invitation command.');
  if (options.action !== 'status' && !options.apply) return { action: options.action, mode: 'preview', country: options.country, message: 'No database connection or change was made. Add --apply to execute.' };
  const client = await connect();
  try {
    let result;
    if (options.action === 'invite') {
      result = await client.query(`INSERT INTO beta_invitations (user_id, country) VALUES ($1, $2)
        ON CONFLICT (user_id) DO UPDATE SET
          country = EXCLUDED.country,
          adult_confirmed_at = CASE WHEN beta_invitations.revoked OR beta_invitations.country <> EXCLUDED.country THEN NULL ELSE beta_invitations.adult_confirmed_at END,
          invited_at = CASE WHEN beta_invitations.revoked OR beta_invitations.country <> EXCLUDED.country THEN NOW() ELSE beta_invitations.invited_at END,
          revoked = false
        RETURNING country, revoked, adult_confirmed_at`, [options.subject, options.country]);
    } else if (options.action === 'revoke') {
      result = await client.query('UPDATE beta_invitations SET revoked = true WHERE user_id = $1 RETURNING country, revoked, adult_confirmed_at', [options.subject]);
    } else {
      result = await client.query('SELECT country, revoked, adult_confirmed_at FROM beta_invitations WHERE user_id = $1', [options.subject]);
    }
    const row = result.rows[0];
    return { action: options.action, mode: options.action === 'status' ? 'read-only' : 'applied', found: Boolean(row),
      ...(row ? { country: row.country, revoked: row.revoked, adultConfirmed: row.adult_confirmed_at !== null } : {}) };
  } finally { await client.end(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const options = parseInvitationCommand(process.argv.slice(2));
    const result = await manageInvitation(options, async () => {
      if (!process.env.DATABASE_URL) throw new Error('Database configuration is required.');
      const require = createRequire(new URL('../../apps/api/package.json', import.meta.url));
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false } });
      await client.connect();
      return client;
    });
    console.log(JSON.stringify(result, null, 2));
  } catch {
    // Database errors can contain identifiers, hostnames, and other private configuration.
    console.error('Invitation command failed. Check command options, authorized database configuration, and migration 003. No credentials or identity values are printed.');
    process.exitCode = 1;
  }
}
