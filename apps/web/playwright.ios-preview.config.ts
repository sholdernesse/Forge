import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ios-preview',
  testMatch: '**/*.pw.ts',
  use: {
    baseURL: 'http://127.0.0.1:4175',
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    ...(process.env.FORGE_BROWSER_CHANNEL ? { channel: process.env.FORGE_BROWSER_CHANNEL } : {}),
  },
  webServer: {
    command: 'pnpm exec vite preview --config vite.ios-preview.config.ts --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    timeout: 30_000,
  },
});
