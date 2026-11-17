import { expect, test } from '@playwright/test';
import { createServer, type Plugin } from 'vite';

test('replaces a cached production shell when returning to the development preview', async ({ page }) => {
  const stalePage = '<h1>Cached app version</h1><button onclick="navigator.serviceWorker.register(\'/sw.js\', {updateViaCache: \'none\'})">Refresh preview</button>';
  const fixture: Plugin = {
    name: 'stale-preview-fixture',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url === '/old-worker.js') {
          response.setHeader('Content-Type', 'text/javascript');
          response.end(`self.addEventListener('install', event => event.waitUntil(caches.open('forge-shell-old-test').then(cache => cache.put('/cache-fixture', new Response(${JSON.stringify(stalePage)}, {headers: {'Content-Type': 'text/html'}}))).then(() => self.skipWaiting()))); self.addEventListener('activate', event => event.waitUntil(self.clients.claim())); self.addEventListener('fetch', event => { if (event.request.mode === 'navigate') event.respondWith(caches.open('forge-shell-old-test').then(cache => cache.match('/cache-fixture'))); });`);
        } else if (request.url === '/cache-fixture') {
          response.setHeader('Content-Type', 'text/html');
          response.end('<h1>Current app version</h1>');
        } else next();
      });
    },
  };
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, plugins: [fixture] });
  try {
    await server.listen();
    const address = server.httpServer!.address();
    if (!address || typeof address === 'string') throw new Error('Missing preview test address');
    const origin = `http://127.0.0.1:${address.port}`;
    await page.goto(`${origin}/cache-fixture`);
    await page.evaluate(async () => {
      localStorage.setItem('workout-tracker:data', 'preserved workout records');
      await caches.open('unrelated-cache');
      await navigator.serviceWorker.register('/old-worker.js');
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Cached app version' })).toBeVisible();
    await page.getByRole('button', { name: 'Refresh preview' }).click();
    await expect(page.getByRole('heading', { name: 'Current app version' })).toBeVisible({ timeout: 10000 });
    expect(await page.evaluate(() => localStorage.getItem('workout-tracker:data'))).toBe('preserved workout records');
    expect(await page.evaluate(() => caches.keys())).toEqual(['unrelated-cache']);
    expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(items => items.length))).toBe(0);
  } finally {
    await server.close();
  }
});
