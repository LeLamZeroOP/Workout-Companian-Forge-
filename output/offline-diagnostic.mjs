import { preview } from 'vite';
import { chromium } from '@playwright/test';

const server = await preview({ preview: { host: '127.0.0.1', port: 4175, strictPort: true } });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on('console', message => console.log('console', message.type(), message.text()));
  page.on('pageerror', error => console.log('pageerror', String(error)));
  page.on('requestfailed', request => console.log('failed', request.url(), request.failure()));
  await page.addInitScript(() => {
    const original = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = (...args) => original(...args).then(registration => {
      console.log('SW registered', JSON.stringify({ scope: registration.scope, active: registration.active?.state, installing: registration.installing?.state, waiting: registration.waiting?.state }));
      registration.addEventListener('updatefound', () => console.log('SW updatefound', registration.installing?.state));
      registration.installing?.addEventListener('statechange', event => console.log('SW state', event.target.state));
      return registration;
    }).catch(error => { console.log('SW registration failed', String(error)); throw error; });
    navigator.serviceWorker.addEventListener('controllerchange', () => console.log('SW controllerchange', navigator.serviceWorker.controller?.state));
  });
  await page.goto('http://127.0.0.1:4175');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  try {
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), { timeout: 20000 });
    console.log('controlled');
  } catch (error) { console.log('wait failed', String(error)); }
  console.log(JSON.stringify(await page.evaluate(async () => ({
    readyState: document.readyState,
    controller: navigator.serviceWorker.controller?.state,
    registrations: (await navigator.serviceWorker.getRegistrations()).map(r => ({scope:r.scope, active:r.active?.state, installing:r.installing?.state, waiting:r.waiting?.state})),
    cacheKeys: await caches.keys(),
  }))));
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
