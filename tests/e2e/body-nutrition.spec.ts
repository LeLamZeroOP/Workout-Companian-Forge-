import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('logs body data, creates a target, logs food, and retains everything after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Body' }).click();
  await page.getByRole('button', { name: /log weight/i }).click();
  await page.getByLabel(/weight in kilograms/i).fill('80');
  await page.getByRole('button', { name: /save measurement/i }).click();
  await expect(page.getByText('80 kg').first()).toBeVisible();

  await page.getByRole('button', { name: /set up profile/i }).click();
  await page.getByLabel(/birth date/i).fill('1996-01-01');
  await page.getByLabel(/height in centimeters/i).fill('180');
  await page.getByRole('button', { name: /equation sex/i }).click();
  await page.getByRole('option', { name: 'Male equation', exact: true }).click();
  await page.getByRole('button', { name: /activity level/i }).click();
  await page.getByRole('option', { name: 'Moderately active', exact: true }).click();
  await page.getByLabel(/eligible adult/i).check();
  await page.getByRole('button', { name: /save profile/i }).click();
  await page.getByRole('button', { name: /use this target/i }).click();

  await page.getByRole('button', { name: 'Nutrition' }).click();
  await page.getByRole('button', { name: /add breakfast/i }).click();
  await page.getByLabel(/search foods/i).fill('chicken breast');
  await page.getByRole('button', { name: /chicken breast/i }).click();
  await page.getByLabel(/amount in grams/i).fill('150');
  await page.getByRole('button', { name: /add to breakfast/i }).click();
  await expect(page.getByText('Chicken breast')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Body' }).click();
  await expect(page.getByText('80 kg').first()).toBeVisible();
  await page.getByRole('button', { name: 'Nutrition' }).click();
  await expect(page.getByText('Chicken breast')).toBeVisible();
  await expect(page.getByText(/of .* kcal/i).first()).toBeVisible();
});

test('installs the application shell and opens it offline', async ({ page, context }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
  page.on('requestfailed', (request) => runtimeErrors.push(`${new URL(request.url()).pathname}: ${request.failure()?.errorText ?? 'request failed'}`));
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
  await page.waitForFunction(() => Boolean('serviceWorker' in navigator && navigator.serviceWorker.controller));
  const cachedPaths = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async (name) => (await caches.open(name)).keys()))).flat().map((request) => new URL(request.url).pathname));
  expect(cachedPaths).toContain('/index.html');
  expect(cachedPaths.some((path) => path.endsWith('.js'))).toBe(true);
  await page.reload();

  await context.setOffline(true);
  try {
    await page.reload();
    expect(runtimeErrors).toEqual([]);
    await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

test('keeps compact layouts usable and honors reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 720 });
  await expect(page.getByRole('navigation', { name: /mobile primary/i }).getByRole('button', { name: 'Workout' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: /open body/i }).click();
  await page.getByRole('button', { name: /set up profile/i }).click();
  await page.getByRole('button', { name: /equation sex/i }).click();
  await expect(page.getByRole('listbox', { name: /equation sex/i })).toHaveCSS('animation-name', 'none');

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
