import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.pw.ts',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
  use: { actionTimeout: 10_000, baseURL: 'http://127.0.0.1:4173', viewport: { width: 1366, height: 900 }, screenshot: 'only-on-failure',
    ...(process.env.FORGE_BROWSER_CHANNEL ? { channel: process.env.FORGE_BROWSER_CHANNEL } : {}) },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
