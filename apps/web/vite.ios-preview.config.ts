import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: fileURLToPath(new URL('./ios-preview', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react()],
  css: { postcss: { plugins: [{
    postcssPlugin: 'forge-offline-preview',
    AtRule: { import: rule => { if (/^url\(['"]?https?:\/\//i.test(rule.params)) rule.remove(); } },
  }] } },
  build: {
    outDir: fileURLToPath(new URL('./dist-ios-preview', import.meta.url)),
    emptyOutDir: true,
  },
});
