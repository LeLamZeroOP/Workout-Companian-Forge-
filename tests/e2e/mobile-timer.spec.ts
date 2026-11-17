import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });

test('mobile workout timer remains visible and advances after a set', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('navigation', { name: 'Mobile primary' }).getByRole('button', { name: 'Workout', exact: true }).click();
  await page.getByRole('button', { name: 'Program', exact: true }).click();
  await page.getByRole('option', { name: /Starter Strength/ }).click();
  await page.getByRole('radio', { name: /^Push/ }).click();
  await page.getByRole('button', { name: 'Begin guided workout' }).click();
  await expect(page.getByText('Elapsed')).toBeVisible();
  const weight = page.getByLabel('Weight in kilograms');
  const reps = page.getByLabel('Repetitions');
  await weight.fill('70');
  await reps.fill('12');
  await expect(weight).toHaveValue('70');
  await weight.fill('80');
  await expect(reps).toHaveValue('12');
  await reps.fill('10');
  await expect(weight).toHaveValue('80');
  await page.getByRole('button', { name: 'Complete set' }).click();
  const rest = page.getByRole('region', { name: 'Rest timer' });
  await expect(rest).toBeVisible();
  const first = await rest.locator('strong').innerText();
  await expect.poll(async () => rest.locator('strong').innerText(), { timeout: 3000 }).not.toBe(first);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
