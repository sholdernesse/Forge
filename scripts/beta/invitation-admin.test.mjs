import assert from 'node:assert/strict';
import test from 'node:test';
import { manageInvitation, parseInvitationCommand } from './invitation-admin.mjs';

const subject = 'verified-subject-not-email';
test('requires a verified subject and rejects accidental or non-US options', () => {
  assert.equal(parseInvitationCommand(['invite'], { FORGE_BETA_SUBJECT: subject }).subject, subject);
  assert.equal(parseInvitationCommand(['invite', '--subject', subject, '--country', 'us']).country, 'US');
  for (const args of [['invite'], ['invite', '--subject'], ['invite', '--subject', subject, '--country', 'AU'], ['invite', '--subject', subject, '--apply', '--apply'], ['invite', '--subject', subject, '--unknown'], ['delete', '--subject', subject]]) assert.throws(() => parseInvitationCommand(args, {}));
});

test('previews writes without opening a database connection', async () => {
  for (const action of ['invite', 'revoke']) {
    const options = parseInvitationCommand([action, '--subject', subject], {});
    const result = await manageInvitation(options, () => { throw new Error('must not connect'); });
    assert.equal(result.mode, 'preview');
    assert.ok(!JSON.stringify(result).includes(subject));
  }
});

test('binds identity and country and preserves confirmation on ordinary repeated invitations', async () => {
  let closed = false;
  const result = await manageInvitation(parseInvitationCommand(['invite', '--subject', subject, '--apply'], {}), async () => ({
    query: async (sql, parameters) => {
      assert.deepEqual(parameters, [subject, 'US']);
      assert.ok(!sql.includes(subject));
      assert.match(sql, /ON CONFLICT/);
      assert.match(sql, /THEN NULL ELSE beta_invitations.adult_confirmed_at END/);
      return { rows: [{ country: 'US', revoked: false, adult_confirmed_at: null }] };
    }, end: async () => { closed = true; },
  }));
  assert.deepEqual(result, { action: 'invite', mode: 'applied', found: true, country: 'US', revoked: false, adultConfirmed: false });
  assert.equal(closed, true);
  assert.ok(!JSON.stringify(result).includes(subject));
});

test('status is read-only and revocation affects only the requested subject', async () => {
  for (const action of ['status', 'revoke']) {
    const options = parseInvitationCommand([action, '--subject', subject, '--apply'], {});
    await manageInvitation(options, async () => ({
      query: async (sql, parameters) => {
        assert.match(sql, action === 'status' ? /^SELECT/ : /^UPDATE/);
        assert.deepEqual(parameters, [subject]);
        assert.match(sql, /WHERE user_id = \$1/);
        return { rows: [] };
      }, end: async () => undefined,
    }));
  }
});

test('closes the connection even when a database operation fails', async () => {
  let closed = false;
  await assert.rejects(() => manageInvitation(parseInvitationCommand(['status', '--subject', subject], {}), async () => ({
    query: async () => { throw new Error('database unavailable'); }, end: async () => { closed = true; },
  })));
  assert.equal(closed, true);
});
