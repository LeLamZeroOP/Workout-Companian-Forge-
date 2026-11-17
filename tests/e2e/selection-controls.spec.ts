import { expect, test } from '@playwright/test';
import { createDefaultData } from '../../src/data/defaults';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(data => {
    if (!localStorage.getItem('workout-tracker:data')) localStorage.setItem('workout-tracker:data', data);
    localStorage.setItem('forge:theme', 'dark');
  }, JSON.stringify(createDefaultData()));
});

test('exercise selections use themed menus and keep changes after reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#programs');
  await page.getByRole('button', { name: /^Dumbbell Chest Press/ }).click();
  for (const [label, option] of [['Equipment', 'Barbell'], ['Chest contribution', '0.75'], ['Chest role', 'Indirect'], ['Chest emphasis', 'Upper chest']] as const) {
    const trigger = page.getByRole('button', { name: label, exact: true });
    await trigger.click();
    await expect(trigger).toHaveCSS('background-image', 'none');
    await expect(page.getByRole('listbox')).toHaveCount(1);
    await page.getByRole('option', { name: option, exact: true }).click();
    await expect(trigger).toBeFocused();
    await expect(trigger).toContainText(option);
  }
  await page.getByRole('button', { name: 'Save exercise', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /^Dumbbell Chest Press/ }).click();
  await expect(page.getByRole('button', { name: 'Equipment', exact: true })).toContainText('Barbell');
  await expect(page.getByRole('button', { name: 'Chest role', exact: true })).toContainText('Indirect');
  await expect(page.getByRole('button', { name: 'Chest emphasis', exact: true })).toContainText('Upper chest');
  await page.getByRole('button', { name: 'Chest contribution', exact: true }).click();
  await expect(page.getByRole('option', { name: '0.75', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.locator('.contribution-grid').first().screenshot({ path: 'output/playwright/selection-menu-dark.png', animations: 'disabled' });
});

test('menus flip inside a short mobile viewport and dismiss with keyboard focus restored', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 480 });
  await page.goto('/#programs');
  await page.getByRole('button', { name: /^Dumbbell Chest Press/ }).click();
  const trigger = page.getByRole('button', { name: 'Chest contribution', exact: true });
  await trigger.evaluate(element => element.scrollIntoView({ block: 'end' }));
  await trigger.click();
  const popup = page.locator('.select-control-popup');
  await expect(popup).toHaveAttribute('data-side', 'top');
  const bounds = await popup.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(480);
  const navigation = await page.getByRole('navigation').boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThan(navigation!.y);
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText('1');
  await expect(trigger).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('selection tabs track the active value and support immediate keyboard changes', async ({ page }) => {
  await page.goto('/#progress');
  await page.getByRole('button', { name: 'Muscles', exact: true }).click();
  const periods = page.getByRole('group', { name: 'Muscle summary period' });
  await periods.getByRole('button', { name: 'Week', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(periods.getByRole('button', { name: 'Month', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(periods.getByRole('button', { name: 'Month', exact: true })).toBeFocused();
  await expect(periods.locator('.tab-highlight')).toHaveCSS('transition-duration', '0s');
  await page.keyboard.press('End');
  await expect(page.getByLabel('From', { exact: true })).toBeVisible();
  await periods.getByRole('button', { name: 'Week', exact: true }).click();
  await expect.poll(() => periods.evaluate(element => {
    const selected = element.querySelector('[aria-pressed="true"]')!.getBoundingClientRect();
    const highlight = element.querySelector('.tab-highlight')!.getBoundingClientRect();
    return Math.abs(selected.x - highlight.x) < 1 && Math.abs(selected.width - highlight.width) < 1;
  })).toBe(true);
});

test('typeahead selects without page scrolling and repositions after a viewport resize', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#programs');
  await page.getByRole('button', { name: /^Dumbbell Chest Press/ }).click();
  const equipment = page.getByRole('button', { name: 'Equipment', exact: true });
  await equipment.scrollIntoViewIfNeeded();
  await equipment.focus();
  await page.keyboard.type('bar');
  await expect(page.getByRole('option', { name: 'Barbell', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(equipment).toContainText('Barbell');
  await equipment.click();
  await page.setViewportSize({ width: 375, height: 480 });
  await expect.poll(async () => {
    const bounds = await page.locator('.select-control-popup').boundingBox();
    const navigation = await page.getByRole('navigation').boundingBox();
    return bounds !== null && bounds.y >= 0 && bounds.y + bounds.height < navigation!.y;
  }).toBe(true);
  await page.keyboard.press('Escape');
  await expect(equipment).toBeFocused();
});

test('workout dialogs scroll internally and keep nested dismissal and focus restoration intact', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 480 });
  await page.goto('/#today');
  await page.getByRole('button', { name: 'Start workout', exact: true }).click();
  await page.getByRole('button', { name: 'Add exercise', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add exercise', exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
  const bounds = await dialog.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(480);
  await dialog.getByRole('button', { name: 'Exercise to add', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search exercise to add' }).fill('press');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Close workout editor' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add exercise', exact: true })).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});
