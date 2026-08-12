import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@forge/coach': fileURLToPath(new URL('../../packages/ai/coach/src/index.ts', import.meta.url)),
      '@forge/digital-twin': fileURLToPath(
        new URL('../../packages/digital-twin/src/index.ts', import.meta.url),
      ),
      '@forge/recommendation-engine': fileURLToPath(
        new URL('../../packages/ai/recommendation-engine/src/index.ts', import.meta.url),
      ),
      '@forge/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
    },
  },
  server: { port: 4173 },
});
