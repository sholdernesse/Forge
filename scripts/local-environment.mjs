import { parseEnv } from 'node:util';

/** Diagnose precedence without printing credentials or changing explicit shell settings. */
export function localEnvironmentWarnings(contents, environment) {
  const local = parseEnv(contents);
  if (!local.OPENAI_API_KEY?.trim() || environment.OPENAI_API_KEY === undefined || environment.OPENAI_API_KEY.trim() === local.OPENAI_API_KEY.trim()) return [];
  return ['Forge: the terminal OPENAI_API_KEY overrides a different value in root .env.local. If unintended, stop Forge, run Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue in PowerShell, then restart corepack pnpm dev:https. Neither key value is displayed.'];
}
