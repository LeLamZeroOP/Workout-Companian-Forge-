import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const source = new URL('../public/icons/forge.svg', import.meta.url);
const output = new URL('../public/icons/forge-google-consent-120.png', import.meta.url);
const svg = (await readFile(source, 'utf8')).replace('<svg ', '<svg width="120" height="120" ');
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 120, height: 120 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;background:#fff">${svg}</body>`);
  await page.screenshot({ path: fileURLToPath(output), animations: 'disabled' });
} finally {
  await browser.close();
}

const png = await readFile(output);
if (png.length >= 1_000_000 || png.readUInt32BE(16) !== 120 || png.readUInt32BE(20) !== 120) {
  throw new Error('Consent logo must be a 120×120 PNG under 1 MB.');
}
console.log(`Saved ${fileURLToPath(output)} (${png.length} bytes)`);
