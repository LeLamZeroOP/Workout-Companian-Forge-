import { expect, test, type Page } from '@playwright/test';
import { setTheme } from './helpers/theme';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { localDateString } from '../../src/domain/calendar';

async function seed(page: Page, data: ReturnType<typeof createDefaultData>) {
  await page.addInitScript(value => { if (!localStorage.getItem('workout-tracker:data')) localStorage.setItem('workout-tracker:data', value); }, JSON.stringify(data));
}

test('shows a saved completion summary in both themes and keeps the next session reachable', async ({ page }) => {
  const data = createDefaultData();
  const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date(Date.now() - 750000).toISOString());
  Object.assign(session.exercises[0]!.sets[0]!, { completed: true, weightKg: 30, reps: 10 });
  session.guide.currentSetId = session.exercises[0]!.sets[1]!.id;
  data.sessions = [session]; data.settings.restAlertSound = false; data.settings.restAlertVibration = false;
  await seed(page, data); await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#workout'); await setTheme(page, 'light');
  await page.getByRole('button', { name: 'Finish early', exact: true }).click();
  await page.getByRole('button', { name: 'Save and finish' }).click();
  const summary = page.getByRole('region', { name: 'Finished workout' });
  await expect(summary.getByRole('heading', { name: 'Push' })).toBeFocused();
  await expect(summary).toContainText('300 kg'); await expect(summary).toContainText('Saved on this device');
  await page.screenshot({ path: 'output/playwright/ui-next-completion-desktop-light.png', fullPage: true });
  for (const width of [320, 375, 768]) {
    await page.setViewportSize({ width, height: 812 });
    await setTheme(page, 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(summary.getByRole('button', { name: 'Choose next workout' })).toBeVisible();
    const next = summary.getByRole('button', { name: 'Choose next workout' });
    await next.scrollIntoViewIfNeeded();
    const action = await next.boundingBox(); const dock = await page.getByRole('navigation').boundingBox();
    if (width <= 640) expect(action!.y + action!.height).toBeLessThan(dock!.y);
    if (width === 375) await page.screenshot({ path: 'output/playwright/ui-next-completion-mobile-dark.png', fullPage: true });
  }
  await summary.getByRole('button', { name: 'Choose next workout' }).click();
  await expect(page.getByRole('button', { name: 'Begin guided workout' })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!).sessions[0].completedAt)).toBeTruthy();
});

test('balances real daily cards on tablet and retains incomplete nutrient context on mobile', async ({ page }) => {
  const data = createDefaultData(); const date = localDateString(new Date());
  data.body.measurements = [79.8, 79.5].map((weightKg, index) => ({ id: `weight-${index}`, localDate: localDateString(new Date(Date.now() - (1 - index) * 86400000)), entryOrder: index, recordedAt: new Date(Date.now() - (1 - index) * 86400000).toISOString(), weightKg, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' }));
  data.nutrition.targets = [{ id: 'target', effectiveFrom: date, mode: 'manual', caloriesKcal: 2200, proteinG: 150, carbsG: 250, fatG: 70, formulaVersion: null }];
  data.nutrition.diary = [{ id: 'meal', localDate: date, meal: 'lunch', foodId: null, foodName: 'Example lunch', grams: 100, servingDescription: '1 bowl', nutrients: { caloriesKcal: 600, proteinG: 40, carbsG: null, fatG: null, fiberG: null, sodiumMg: null }, source: 'custom', sourceId: null }];
  await seed(page, data); await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/#today'); await setTheme(page, 'light');
  await expect(page.getByRole('region', { name: 'Daily body summary' })).toContainText('79.5 kg');
  await expect(page.getByRole('region', { name: 'Daily nutrition overview' })).toContainText('Known totals, incomplete data');
  await expect(page.getByRole('progressbar', { name: 'Recorded calories toward daily target' })).toHaveAttribute('value', '600');
  const stats = await page.getByRole('complementary', { name: 'Training overview' }).boundingBox();
  expect(stats).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/playwright/ui-next-today-tablet-light.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 }); await setTheme(page, 'dark');
  await page.screenshot({ path: 'output/playwright/ui-next-today-mobile-dark.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('restores focus immediately on dismissal and keeps rapid reopening usable', async ({ page }) => {
  const data = createDefaultData(); data.sessions = [createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString())];
  await seed(page, data); await page.goto('/#workout');
  const trigger = page.getByRole('button', { name: 'Edit workout details' });
  await trigger.click(); await page.getByRole('button', { name: 'Close workout editor' }).click();
  await expect(trigger).toBeFocused(); await expect(page.getByRole('dialog')).toHaveCount(0);
  await trigger.click(); await expect(page.getByLabel('Workout name')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
  await expect(page.locator('.dialog-backdrop')).toHaveCount(0);
  const options = page.getByRole('button', { name: 'Exercise options', exact: true });
  await options.click(); await page.getByRole('button', { name: 'Edit details', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(options).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await trigger.click(); await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await expect(trigger).toBeFocused(); await expect(page.locator('.dialog-backdrop')).toHaveCount(0);
  await expect(page.locator('.progress-meter-track > span')).toHaveCSS('transition-duration', '0s');
});
