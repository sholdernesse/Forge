#!/usr/bin/env node
import { setTimeout as delay } from 'node:timers/promises';
import { smokeCandidate } from './candidate-smoke-lib.mjs';

try {
  const attempts = Number.parseInt(process.env.SMOKE_ATTEMPTS ?? '1', 10);
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 12) throw new Error('SMOKE_ATTEMPTS must be between 1 and 12');
  let result;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      result = await smokeCandidate({
        deploymentUrl: process.env.DEPLOYMENT_URL ?? process.argv[2],
        expectedCommit: process.env.EXPECTED_COMMIT ?? '',
      });
      break;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.error(`Forge candidate smoke attempt ${attempt}/${attempts} failed; retrying in 10 seconds.`);
        await delay(10_000);
      }
    }
  }
  if (!result) throw lastError;
  console.log(`Forge candidate smoke passed: ${result.baseUrl}`);
  console.log(`Release: ${result.releaseSha}`);
  console.log('Support contact: configured');
  for (const check of result.checks) console.log(`- ${check}`);
} catch (error) {
  console.error(`Forge candidate smoke failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
