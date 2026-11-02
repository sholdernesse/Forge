import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';

test('container gateway permits a slow photo result while ordinary APIs retain short timeouts', {
  skip: process.env.FORGE_GATEWAY_TESTS !== 'isolated', timeout: 100_000,
}, async () => {
  const timers = new Set();
  const upstream = createServer((request, response) => {
    if (request.url === '/health') { response.end('ok'); return; }
    const timer = setTimeout(() => {
      timers.delete(timer);
      response.setHeader('content-type', 'application/json');
      response.end(JSON.stringify({ received: request.url }));
    }, 31_500);
    timers.add(timer);
  });
  await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
  const name = 'forge-gateway-test-' + randomUUID();
  const container = spawn('docker', ['run', '--rm', '--network', 'host', '--name', name,
    '-e', 'FORGE_API_SCHEME=http', '-e', 'FORGE_API_HOSTPORT=127.0.0.1:' + upstream.address().port,
    'forge-web:ci'], { stdio: 'ignore' });
  let containerError;
  container.on('error', error => { containerError = error; });
  let exited = false;
  container.on('exit', () => { exited = true; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (containerError) throw containerError;
      if (exited) throw new Error('Gateway container exited before readiness');
      try { if ((await fetch('http://127.0.0.1:8080/health', { signal: AbortSignal.timeout(1_000) })).ok) { ready = true; break; } } catch {}
      await delay(200);
    }
    assert.ok(ready, 'gateway becomes ready');
    const [photo, ordinary] = await Promise.all([
      fetch('http://127.0.0.1:8080/v1/foods/photo-analysis', { method: 'POST', body: '{}', signal: AbortSignal.timeout(45_000) }),
      fetch('http://127.0.0.1:8080/v1/dashboard', { signal: AbortSignal.timeout(45_000) }),
    ]);
    assert.equal(photo.status, 200, 'photo request must survive the former 30-second cutoff');
    assert.equal(photo.headers.get('x-frame-options'), 'DENY');
    assert.deepEqual(await photo.json(), { received: '/v1/foods/photo-analysis' });
    assert.equal(ordinary.status, 504, 'ordinary API requests keep their 30-second limit');
    await ordinary.text();
  } finally {
    for (const timer of timers) clearTimeout(timer);
    try { execFileSync('docker', ['rm', '-f', name], { stdio: 'ignore', timeout: 10_000 }); } catch {}
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  }
});
