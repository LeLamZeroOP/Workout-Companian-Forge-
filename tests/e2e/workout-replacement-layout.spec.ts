import { expect, test } from '@playwright/test';

test('replacement dropdown stays inside a short desktop dialog with reachable actions', async ({ page }) => {
  await page.setViewportSize({ width: 1006, height: 510 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await page.getByRole('navigation', { name: 'Desktop primary' }).getByRole('button', { name: 'Workout', exact: true }).click();
  await page.getByRole('button', { name: 'Program', exact: true }).click();
  await page.getByRole('option', { name: /Starter Strength/ }).click();
  await page.getByRole('radio', { name: /^Push/ }).click();
  await page.getByRole('button', { name: 'Begin guided workout' }).click();
  await page.getByRole('button', { name: 'Exercise options', exact: true }).click();
  await page.getByRole('button', { name: 'Replace exercise', exact: true }).click();
  await page.getByRole('button', { name: 'Replacement exercise', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const popup = dialog.locator('.select-control-popup');
  await expect(page.getByLabel('Search replacement exercise')).toBeVisible();
  expect(await popup.evaluate(e => getComputedStyle(e).position)).toBe('relative');
  const popupBox = (await popup.boundingBox())!;
  const dialogBox = (await dialog.boundingBox())!;
  expect(popupBox.y + popupBox.height).toBeLessThanOrEqual(dialogBox.y + dialogBox.height);
  await page.screenshot({ path: 'artifacts/workout-replacement-desktop.png' });
  await page.getByLabel('Search replacement exercise').fill('Lat Pulldown');
  await page.getByRole('option', { name: 'Lat Pulldown cable', exact: true }).click();
  await dialog.getByRole('button', { name: 'Replace exercise', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lat Pulldown', exact: true })).toBeVisible();
});
