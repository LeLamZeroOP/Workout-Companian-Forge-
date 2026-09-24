import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

function offlineShell(): Plugin {
  return {
    name: 'forge-offline-shell',
    apply: 'build',
    generateBundle(_options, bundle) {
      const bundledFiles = Object.keys(bundle).sort().map((file) => `/${file}`);
      const shellFiles = ['/', '/index.html', '/manifest.webmanifest', '/icons/forge.svg', ...bundledFiles];
      const revision = createHash('sha256').update(shellFiles.join('|')).digest('hex').slice(0, 10);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE_NAME = 'forge-shell-${revision}';\nconst SHELL_FILES = ${JSON.stringify(shellFiles)};\nself.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())); });\nself.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('forge-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });\nself.addEventListener('fetch', (event) => { const url = new URL(event.request.url); if (event.request.method !== 'GET' || url.origin !== self.location.origin) return; event.respondWith(caches.open(CACHE_NAME).then(async (cache) => { const cacheKey = event.request.mode === 'navigate' ? '/index.html' : url.pathname; const cached = await cache.match(cacheKey, { ignoreSearch: true }); if (cached) return cached; try { const response = await fetch(event.request); if (response.ok) await cache.put(url.pathname, response.clone()); return response; } catch { return event.request.mode === 'navigate' ? cache.match('/index.html') : Response.error(); } })); });\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineShell()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
});
