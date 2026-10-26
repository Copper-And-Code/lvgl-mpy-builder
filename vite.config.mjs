import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const src = (dir = '') => fileURLToPath(new URL(`./src/${dir}`, import.meta.url));

// Production Content Security Policy. Electron loads the build from file://,
// where the response-header CSP set in main.js is not applied, so the policy
// is also embedded in index.html (build only: the dev server needs inline
// scripts for React Fast Refresh).
// 'unsafe-eval' is still required by Handlebars.compile() for runtime templates.
const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const productionCsp = () => ({
  name: 'production-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      attrs: { 'http-equiv': 'Content-Security-Policy', content: PRODUCTION_CSP },
      injectTo: 'head-prepend',
    },
  ],
});

export default defineConfig({
  plugins: [react(), productionCsp()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Desktop app loaded from disk: a single ~1 MB bundle is fine
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: {
      '@': src(),
      '@core': src('core'),
      '@components': src('components'),
      '@generators': src('generators'),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{js,jsx}'],
  },
});
