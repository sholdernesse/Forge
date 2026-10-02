import { randomUUID } from 'node:crypto';

export type ApiLogLevel = 'info' | 'error';

export interface ApiRequestLog {
  timestamp: string;
  level: ApiLogLevel;
  event: 'api.request.completed' | 'api.request.failed';
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  errorType?: string;
}

export function createRequestId(): string {
  return randomUUID();
}

export function requestRoute(pathname: string): string {
  if (pathname === '/health') return '/health';
  if (pathname === '/v1/dashboard') return '/v1/dashboard';
  if (pathname === '/v1/foods/search') return '/v1/foods/search';
  if (pathname === '/v1/foods/photo-analysis') return '/v1/foods/photo-analysis';
  if (/^\/v1\/foods\/barcode\/\d{8,14}$/.test(pathname)) return '/v1/foods/barcode/:barcode';
  return 'unmatched';
}

export function requestLog(input: Omit<ApiRequestLog, 'timestamp' | 'durationMs'> & { startedAt: number; finishedAt: number; now?: Date }): ApiRequestLog {
  const { startedAt, finishedAt, now = new Date(), ...fields } = input;
  return {
    timestamp: now.toISOString(),
    ...fields,
    durationMs: Math.max(0, Math.round((finishedAt - startedAt) * 10) / 10),
  };
}

export function errorType(error: unknown): string {
  return error instanceof Error && error.name ? error.name : 'UnknownError';
}

export function writeApiLog(entry: ApiRequestLog): void {
  const serialized = JSON.stringify(entry);
  if (entry.level === 'error') console.error(serialized);
  else console.log(serialized);
}
