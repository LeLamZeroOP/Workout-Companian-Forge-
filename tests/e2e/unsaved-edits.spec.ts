import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`guards edits and accepts replacement reps at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Programs', exact: true }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await page.getByLabel('Program name', { exact: true }).fill('Saved from navigation');
    const reps = page.getByLabel('Rep min', { exact: true }).first();
    await reps.fill('');
    await expect(reps).toHaveValue('');
    await reps.pressSequentially('10');
    await expect(reps).toHaveValue('10');
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Save your changes?' });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/#programs$/);
    await page.getByRole('button', { name: 'Keep editing' }).click();
    await expect(page.getByLabel('Program name', { exact: true })).toHaveValue('Saved from navigation');
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await page.getByRole('button', { name: 'Save and leave' }).click();
    await expect(page).toHaveURL(/#today$/);
    await page.getByRole('button', { name: 'Programs', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Saved from navigation' })).toBeVisible();
    await page.getByRole('button', { name: 'Edit', exact: true }).first().click();
    await page.getByLabel('Program name', { exact: true }).fill('Discarded name');
    await page.getByRole('button', { name: 'Today', exact: true }).click();
    await page.getByRole('button', { name: 'Discard changes' }).click();
    await page.getByRole('button', { name: 'Programs', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Saved from navigation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Discarded name' })).toHaveCount(0);
  });
}
