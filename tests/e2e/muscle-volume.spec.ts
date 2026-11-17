import { expect, test } from '@playwright/test';

test('PPL repeat schedule and muscle summary survive customization', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Programs', exact: true }).click();
  const ppl = page.locator('.split-card').filter({ has: page.getByRole('heading', { name: 'Push / Pull / Legs' }) });
  await ppl.locator('details > summary').filter({ hasText: 'Muscle sets' }).click();
  await expect(ppl.getByText('60 performed sets')).toBeVisible();
  await ppl.getByRole('button', { name: 'Customize Push / Pull / Legs' }).click();
  await expect(page.getByText('7-day cycle', { exact: true })).toBeVisible();
  await expect(page.getByText('60 performed sets')).toBeVisible();
  await page.locator('.program-muscle-summary').scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: 'artifacts/muscle-volume-desktop.png' });
  await page.setViewportSize({ width: 375, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.program-muscle-summary').scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: 'artifacts/muscle-volume-mobile.png' });
  await page.getByRole('button', { name: 'Save program' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Programs', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).last().click();
  await expect(page.getByText('7-day cycle', { exact: true })).toBeVisible();
  await expect(page.getByText('60 performed sets')).toBeVisible();
});
