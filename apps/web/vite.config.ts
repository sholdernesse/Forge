import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const https =
    mode === 'https'
      ? {
          key: readFileSync(new URL('./.cert/forge-key.pem', import.meta.url)),
          cert: readFileSync(new URL('./.cert/forge-cert.pem', import.meta.url)),
        }
      : undefined;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@forge/coach': fileURLToPath(
          new URL('../../packages/ai/coach/src/index.ts', import.meta.url),
        ),
        '@forge/digital-twin': fileURLToPath(
          new URL('../../packages/digital-twin/src/index.ts', import.meta.url),
        ),
        '@forge/recommendation-engine': fileURLToPath(
          new URL('../../packages/ai/recommendation-engine/src/index.ts', import.meta.url),
        ),
        '@forge/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: { auth: ['@azure/msal-browser'] },
        },
      },
    },
    server: { port: 4173, ...(https ? { https } : {}) },
  };
});
