import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { authVerifierFromEnvironment } from './auth.js';
import { createApiHandler } from './handler.js';
import { PostgresDashboardRepository } from './postgresRepository.js';
import { HybridFoodProvider } from './foodProvider.js';

const connectionString = process.env.DATABASE_URL
  ?? (process.env.NODE_ENV !== 'production' ? 'postgresql://forge:forge@localhost:5432/forge' : undefined);
if (!connectionString) throw new Error('DATABASE_URL is required');
const usdaApiKey = process.env.USDA_FOODDATA_API_KEY
  ?? (process.env.NODE_ENV !== 'production' ? 'DEMO_KEY' : undefined);

const dashboards = new PostgresDashboardRepository({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false },
  max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
});
const handle = createApiHandler({
  auth: authVerifierFromEnvironment(process.env),
  dashboards,
  foodProvider: new HybridFoodProvider(usdaApiKey),
  ...(process.env.FORGE_WEB_ORIGIN ? { allowedOrigin: process.env.FORGE_WEB_ORIGIN } : {}),
});
const port = Number(process.env.PORT ?? 8787);

const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url ?? '/', `http://${incoming.headers.host ?? 'localhost'}`);
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
      else if (value !== undefined) headers.set(name, value);
    }
    const hasBody = incoming.method !== 'GET' && incoming.method !== 'HEAD';
    const request = new Request(url, {
      method: incoming.method,
      headers,
      ...(hasBody ? { body: Readable.toWeb(incoming) as ReadableStream, duplex: 'half' } : {}),
    } as RequestInit & { duplex?: 'half' });
    const result = await handle(request);
    outgoing.writeHead(result.status, Object.fromEntries(result.headers.entries()));
    outgoing.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    outgoing.end(JSON.stringify({ error: 'internal_error' }));
  }
});

server.listen(port, () => console.log(`Forge API listening on http://localhost:${port}`));

async function shutdown() {
  server.close();
  await dashboards.close();
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
