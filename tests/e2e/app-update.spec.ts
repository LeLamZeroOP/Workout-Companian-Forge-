import { expect, test } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

test('mobile can check for updates and safely reload while preserving saved records', async ({ page, context }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: 'Open Body' }).click();
  await page.getByRole('button', { name: 'Log weight', exact: true }).click();
  await page.getByLabel('Weight in kilograms').fill('81');
  await page.getByRole('button', { name: 'Save measurement' }).click();
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: 'Open Settings' }).click();
  await page.getByRole('button', { name: 'Check for updates' }).click();
  await expect(page.getByText('You’re using the latest available version.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const saved = await page.evaluate(() => localStorage.getItem('workout-tracker:data'));
  expect(saved).not.toBeNull();
  const original = await readFile('dist/sw.js', 'utf8');
  const second = await context.newPage();
  await second.goto('/');
  try {
    await writeFile('dist/sw.js', original.replace(/forge-shell-([a-z0-9]+)/, 'forge-shell-mobile-update-test'));
    await page.getByRole('button', { name: 'Check for updates' }).click();
    await expect(page.getByRole('heading', { name: 'A Forge update is ready' })).toBeVisible();
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'output/playwright/mobile-update-ready.png', fullPage: true });
    await page.getByRole('button', { name: 'Go to Today to update' }).click();
    await page.getByRole('button', { name: 'Update and reload' }).click();
    await expect(page.getByText('Close other Forge tabs and app windows, then try Update and reload again.')).toBeVisible();
    expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
    await second.close();
    await page.getByRole('button', { name: 'Update and reload' }).click();
    await expect(page.getByRole('heading', { name: 'A Forge update is ready' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('workout-tracker:data'))).toBe(saved);
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await page.getByRole('button', { name: 'Open Body' }).click();
    await expect(page.getByRole('heading', { name: '81 kg' })).toBeVisible();
    expect(await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(false);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Body' })).toBeVisible();
  } finally {
    await context.setOffline(false);
    await writeFile('dist/sw.js', original);
  }
});
