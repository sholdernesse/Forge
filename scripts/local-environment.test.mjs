import assert from 'node:assert/strict';
import test from 'node:test';
import { localEnvironmentWarnings } from './local-environment.mjs';

test('warns about a stale shell key without leaking either credential', () => {
  const environment = { OPENAI_API_KEY: 'old-private-value' };
  const messages = localEnvironmentWarnings('OPENAI_API_KEY="new-private-value"\n', environment);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /Remove-Item Env:OPENAI_API_KEY/);
  assert.ok(!messages.join().includes('old-private-value'));
  assert.ok(!messages.join().includes('new-private-value'));
  assert.equal(environment.OPENAI_API_KEY, 'old-private-value');
});

test('accepts matching, absent and commented local keys without warnings', () => {
  assert.deepEqual(localEnvironmentWarnings('OPENAI_API_KEY="same-value" # local key', { OPENAI_API_KEY: 'same-value' }), []);
  assert.deepEqual(localEnvironmentWarnings('OPENAI_API_KEY=new-value', {}), []);
  assert.deepEqual(localEnvironmentWarnings('# OPENAI_API_KEY=unused', { OPENAI_API_KEY: 'shell-only' }), []);
  assert.deepEqual(localEnvironmentWarnings('OPENAI_API_KEY=', { OPENAI_API_KEY: 'shell-only' }), []);
});

test('warns when an empty inherited variable masks a configured file value', () => {
  assert.equal(localEnvironmentWarnings('OPENAI_API_KEY=local-value', { OPENAI_API_KEY: '' }).length, 1);
});
