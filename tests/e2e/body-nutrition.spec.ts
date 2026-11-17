/// <reference types="node" />
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
  await expect(page.locator('.meal-entries').getByText('Chicken breast')).toBeVisible();

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

for (const timezoneId of ['Asia/Bangkok', 'America/Los_Angeles']) {
  test(`same-day measurements retain entry order and local dates in ${timezoneId}`, async ({ browser }) => {
    const context = await browser.newContext({ timezoneId }); const page = await context.newPage();
    await page.clock.install({ time: new Date(timezoneId === 'Asia/Bangkok' ? '2026-09-27T17:30:00Z' : '2026-09-28T06:30:00Z') });
    await page.goto('http://127.0.0.1:4174');
    await page.getByRole('button', { name: 'Body', exact: true }).click();
    for (const weight of ['80', '50', '100']) {
      await page.getByRole('button', { name: weight === '80' ? 'Log weight' : 'Log measurement', exact: true }).click();
      await expect(page.getByLabel('Recorded date')).toHaveValue(timezoneId === 'Asia/Bangkok' ? '2026-09-28' : '2026-09-27');
      await page.getByLabel('Weight in kilograms').fill(weight); await page.getByRole('button', { name: 'Save measurement' }).click();
    }
    await expect(page.getByRole('heading', { name: '100 kg' })).toBeVisible(); await expect(page.getByText('+50.0 kg from previous entry')).toBeVisible();
    await page.reload(); await page.getByRole('button', { name: 'Body', exact: true }).click();
    await expect(page.getByRole('heading', { name: '100 kg' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit measurement', exact: true }).last().click();
    await expect(page.getByLabel('Recorded date')).toHaveValue(timezoneId === 'Asia/Bangkok' ? '2026-09-28' : '2026-09-27');
    await page.getByLabel('Weight in kilograms').fill('81'); await page.getByRole('button', { name: 'Save measurement' }).click();
    await expect(page.getByRole('heading', { name: '100 kg' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete measurement', exact: true }).first().click(); await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('heading', { name: '50 kg' })).toBeVisible(); await context.close();
  });
}

test('creates a named food portion on mobile with unknown macros and retains its snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('button', { name: 'More', exact: true }).click(); await page.getByRole('button', { name: 'Open Nutrition' }).click();
  await page.getByRole('button', { name: 'Add lunch' }).click(); await page.getByRole('button', { name: 'Create my food' }).click();
  await page.getByRole('radio', { name: /Named portion/ }).check(); await page.screenshot({ animations: 'disabled', path: 'artifacts/food-selection-mobile.png', fullPage: true }); await page.getByLabel('Food name').fill('My pizza'); await page.getByLabel('Serving name').fill('1 slice'); await page.getByLabel('Calories per serving').fill('300');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Save custom food' }).click(); await page.getByLabel('Number of portions (1 slice)').fill('2'); await page.getByRole('button', { name: 'Add to lunch' }).click();
  await expect(page.locator('.meal-entries').getByText('600 kcal', { exact: true })).toBeVisible(); await expect(page.getByText('Known total · incomplete data').first()).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'More', exact: true }).click(); await page.getByRole('button', { name: 'Open Nutrition' }).click(); await expect(page.getByText('My pizza', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'My foods', exact: true }).click(); await page.getByRole('button', { name: 'Edit My pizza' }).click(); await page.getByLabel('Calories per serving').fill('400'); await page.getByRole('button', { name: 'Save custom food' }).click();
  await expect(page.locator('.meal-entries').getByText('600 kcal', { exact: true })).toBeVisible();
});

// The production worker must wait for every open tab before activating an update.
test('keeps an update waiting across two tabs and preserves an active workout', async ({ page, context }) => {
  const { readFile, writeFile } = await import('node:fs/promises');
  const path = 'dist/sw.js'; const original = await readFile(path, 'utf8');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.getByRole('button', { name: 'Workout', exact: true }).click();
  await page.getByRole('button', { name: 'Program', exact: true }).click(); await page.getByRole('option').first().click(); await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Begin guided workout' }).click();
  const saved = await page.evaluate(() => localStorage.getItem('workout-tracker:data'));
  const second = await context.newPage(); await second.goto('/');
  try {
    const updated = original.replace(/forge-shell-([a-z0-9]+)/, 'forge-shell-testupdate');
    await writeFile(path, updated);
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.ready; await registration.update(); });
    await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
    await expect(page.getByText(/A Forge update is ready/)).toBeVisible();
    await page.getByRole('button', { name: 'Go to Today to update' }).click();
    await expect(page.getByRole('button', { name: 'Update and reload' })).toBeDisabled();
    await expect(page.getByText('Finish your active workout before updating.')).toBeVisible();
    await expect.poll(() => second.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
    await page.close();
    expect(await second.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(true);
    expect(await second.evaluate(() => localStorage.getItem('workout-tracker:data'))).toBe(saved);
    await second.close();
    const reopened = await context.newPage(); await reopened.goto('/');
    await expect.poll(() => reopened.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting))).toBe(false);
    await reopened.getByRole('button', { name: 'Workout', exact: true }).click();
    await expect(reopened.getByText('Elapsed', { exact: true })).toBeVisible();
    expect(await reopened.evaluate(() => localStorage.getItem('workout-tracker:data'))).toBe(saved);
    await reopened.close();
  } finally { await writeFile(path, original); }
});


test('customizes a sourced split and starts it after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Programs', exact: true }).click();
  await page.getByRole('button', { name: '4 days / week' }).click();
  await page.getByText('Preview 4 workouts', { exact: true }).click();
  await expect(page.getByRole('link', { name: 'Public source' })).toBeVisible();
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('heading', { name: 'Start with a split' }).scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: 'artifacts/training-library-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Customize Upper / Lower', exact: true }).click();
  await page.getByRole('button', { name: 'Save program', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Workout', exact: true }).click();
  await page.getByRole('button', { name: 'Program', exact: true }).click();
  await page.getByRole('option', { name: /Upper \/ Lower/ }).click();
  await page.getByRole('radio', { name: /^Upper A/ }).check();
  await page.getByRole('button', { name: 'Begin guided workout' }).click();
  await expect(page.getByRole('heading', { name: 'Barbell Bench Press', exact: true })).toBeVisible();
});

test('workout selections render on desktop and mobile with keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Workout', exact: true }).click();
  await page.getByRole('button', { name: 'Program', exact: true }).click();
  await page.keyboard.press('Enter');
  await page.getByRole('radio').first().check();
  await expect(page.getByRole('button', { name: 'Begin guided workout' })).toBeEnabled();
  await page.screenshot({ animations: 'disabled', path: 'artifacts/selection-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('radio').first()).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ animations: 'disabled', path: 'artifacts/selection-mobile.png', fullPage: true });
});


test('editor and theme remain usable across narrow and wide screens', async ({ page }) => {
  const { readFile } = await import('node:fs/promises');
  const fixture = JSON.parse(await readFile('imports/upper-a-lower-upper-b.forge.json', 'utf8'));
  await page.evaluate(data => localStorage.setItem('workout-tracker:data', JSON.stringify(data)), fixture);
  await page.reload();
  await page.getByRole('button', { name: 'Programs', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  for (const width of [1440, 768, 390, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ animations: 'disabled', path: 'artifacts/editor-light.png' });
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ animations: 'disabled', path: 'artifacts/editor-dark.png' });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({ animations: 'disabled', path: 'artifacts/editor-mobile.png' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});


test('durable workout drafts, inline rest and undo work across themes and screen sizes', async ({ page }) => {
  await page.getByRole('button', { name: 'Start workout', exact: true }).click();
  await page.getByLabel('Weight in kilograms').fill('30');
  // Reload while the field still has focus: no blur/save event is needed for local recovery.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Workout', exact: true })).toBeVisible();
  await expect(page.getByLabel('Weight in kilograms')).toHaveValue('30');
  await page.getByLabel('Repetitions').fill('10');
  await page.getByRole('button', { name: 'Complete set', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Skip rest' })).toBeVisible();
  await expect(page.getByRole('table', { name: /Sets for/ })).toBeVisible();
  for (const width of [1440,768,390,375,320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ animations: 'disabled', path: 'artifacts/workout-light.png', fullPage: true });
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await page.screenshot({ animations: 'disabled', path: 'artifacts/workout-dark.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 900 });
  await page.screenshot({ animations: 'disabled', path: 'artifacts/workout-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Undo set 1', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Skip rest' })).toHaveCount(0);
  await expect(page.getByLabel('Repetitions')).toHaveValue('10');
  await expect(page.getByRole('button', { name: 'Complete set', exact: true })).toBeEnabled();
});

test('nutrition edits and copied meals survive reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Nutrition', exact: true }).click();
  await page.getByRole('button', { name: 'Add lunch', exact: true }).click();
  await page.getByLabel('Search foods').fill('chicken breast');
  await page.getByRole('button', { name: /Chicken breast/ }).click();
  await page.getByLabel('Amount in grams').fill('100');
  await page.getByRole('button', { name: 'Add to lunch', exact: true }).click();
  await page.getByRole('button', { name: /Edit entry Chicken breast/ }).click();
  await page.getByLabel('Amount in grams').fill('150');
  await page.getByRole('button', { name: 'Save entry', exact: true }).click();
  await page.getByRole('button', { name: 'Copy lunch', exact: true }).click();
  const destination = await page.getByLabel('Copy to date').inputValue();
  await page.getByRole('button', { name: 'Review copy' }).click();
  await page.getByRole('button', { name: 'Confirm copy' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Nutrition', exact: true }).click();
  await page.getByLabel('Diary date').fill(destination);
  await expect(page.getByText(/150 g/)).toBeVisible();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole('button', { name: 'Dark theme' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ animations: 'disabled', path: 'artifacts/nutrition-mobile.png', fullPage: true });
});


test('finishes a workout, corrects history and reuses compatible previous sets', async ({ page }) => {
  await page.getByRole('button', { name: 'Start workout', exact: true }).click();
  for (let index = 0; index < 3; index++) {
    await page.getByLabel('Weight in kilograms').fill('30');
    await page.getByLabel('Repetitions').fill('10');
    await page.getByRole('button', { name: 'Complete set', exact: true }).click();
    if (index < 2) await page.getByRole('button', { name: 'Skip rest' }).click();
  }
  await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await page.getByRole('button', { name: /Open Push from Starter Strength/ }).click();
  await page.getByRole('button', { name: 'Correct recorded sets' }).click();
  await page.getByLabel('Dumbbell Chest Press set 1 weight', { exact: true }).fill('35');
  await page.getByRole('button', { name: 'Save corrections' }).click();
  await expect(page.getByText('950 kg', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Progress', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Exercise trend data' }).getByText('35 kg')).toBeVisible();
  await page.getByRole('button', { name: 'Volume', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Exercise trend data' }).getByText('950 kg')).toBeVisible();
  await page.getByRole('button', { name: 'Dark theme' }).click();
  await page.screenshot({ animations: 'disabled', path: 'artifacts/progress-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await page.screenshot({ animations: 'disabled', path: 'artifacts/today-dark.png', fullPage: true });
  await expect(page.getByRole('button', { name: 'Selected workout' })).toContainText('Pull');
  await page.getByRole('button', { name: 'Selected workout' }).click();
  await page.getByRole('option', { name: /^Push/ }).click();
  await page.getByRole('button', { name: 'Start workout', exact: true }).click();
  await expect(page.getByText(/Last session/)).toBeVisible();
  await page.getByRole('button', { name: 'Use previous set' }).click();
  await expect(page.getByLabel('Weight in kilograms')).toHaveValue('35');
});
