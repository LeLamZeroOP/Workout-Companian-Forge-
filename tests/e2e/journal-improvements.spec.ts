import { expect, test } from '@playwright/test';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { readFile } from 'node:fs/promises';
import { createFoodLogEntry } from '../../src/domain/nutrition';
import type { FoodDefinition } from '../../src/domain/models';

test('saves a shortened mobile workout, keeps notes, and retains the section on reload', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Start workout', exact: true }).click();
  await page.getByRole('button', { name: 'Edit workout details' }).click();
  await page.getByLabel('Session notes').fill('A shorter session\nOne completed working set');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByLabel('Weight in kilograms').fill('30');
  await page.getByLabel('Repetitions').fill('10');
  await page.getByRole('button', { name: 'Complete set', exact: true }).click();
  await page.getByRole('button', { name: 'Finish early', exact: true }).click();
  await expect(page.getByRole('alertdialog')).toContainText('2 unfinished sets');
  await page.getByRole('button', { name: 'Save and finish' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Open History' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'History' })).toBeVisible();
  await page.getByRole('button', { name: 'Open Push from Starter Strength' }).click();
  await expect(page.getByText('A shorter session\nOne completed working set')).toBeVisible();
  await expect(page.getByText('300 kg', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/playwright/journal-history-mobile.png', fullPage: true });
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!));
  expect(data.sessions[0].exercises[0].sets.filter((set: { completed: boolean }) => set.completed)).toHaveLength(1);
  expect(data.sessions[0].guide.restTimer).toBeNull();
  expect(await page.evaluate(id => localStorage.getItem(`forge:workout-draft:local:${id}`), data.sessions[0].id)).toBeNull();
});

test('downloads only matching completed workout sets with the original notes', async ({ page }) => {
  const data = createDefaultData();
  const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-10-08T09:00:00Z');
  session.completedAt = '2026-10-08T10:00:00Z';
  session.notes = 'Reviewed, "completed"\nOriginal note';
  Object.assign(session.exercises[0]!.sets[0]!, { weightKg: 30, reps: 10, completed: true });
  const excluded = { ...session, id: 'excluded', workoutName: 'Excluded workout', notes: '' };
  data.sessions = [session, excluded];
  await page.addInitScript(value => localStorage.setItem('workout-tracker:data', value), JSON.stringify(data));
  await page.goto('/#history');
  await page.getByLabel('Search history').fill('Reviewed');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export history CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^forge-workouts-\d{4}-\d{2}-\d{2}\.csv$/);
  const file = await download.path();
  const csv = await readFile(file!, 'utf8');
  expect(csv).toContain('"30","10","300","true"');
  expect(csv).toContain('"Reviewed, ""completed""\nOriginal note"');
  expect(csv).not.toContain('Excluded workout');
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(2);
});

test('retains a program draft when storage rejects its save and retries successfully', async ({ page }) => {
  await page.goto('/#programs');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Program name', { exact: true }).fill('Retained after storage failure');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'workout-tracker:data') throw new DOMException('Storage full', 'QuotaExceededError');
      return original.call(this, key, value);
    };
    Object.assign(window, { restoreTestStorage: () => { Storage.prototype.setItem = original; } });
  });
  await page.getByRole('button', { name: 'Save program', exact: true }).click();
  await expect(page.getByLabel('Program name', { exact: true })).toHaveValue('Retained after storage failure');
  await expect(page.getByRole('alert')).toContainText('Storage full');
  await page.evaluate(() => (window as unknown as { restoreTestStorage: () => void }).restoreTestStorage());
  await page.getByRole('button', { name: 'Save program', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Retained after storage failure', exact: true })).toBeVisible();
});

test('protects an open program draft from edits in another browser tab', async ({ page, context }) => {
  await page.goto('/#programs');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Program name', { exact: true }).fill('Unsaved device draft');
  const other = await context.newPage();
  await other.goto('/#programs');
  await other.getByRole('button', { name: 'Edit', exact: true }).click();
  await other.getByLabel('Program name', { exact: true }).fill('Saved in the other tab');
  await other.getByRole('button', { name: 'Save program', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('This program changed elsewhere');
  await expect(page.getByLabel('Program name', { exact: true })).toHaveValue('Unsaved device draft');
  await expect(page.getByRole('button', { name: 'Save program', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Load saved program' }).click();
  await expect(page.getByLabel('Program name', { exact: true })).toHaveValue('Saved in the other tab');
});

test('exports body and diary snapshots and fits the body controls on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const data = createDefaultData();
  data.body.measurements = [{ id: 'measurement', recordedAt: '2026-10-08T10:00:00Z', localDate: '2026-10-08', weightKg: 80, bodyFatPercent: null, waistCm: 85, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: 'Original body note' }];
  const food: FoodDefinition = { id: 'csv-food', name: 'Saved test bowl', brand: null, category: 'Other', preparation: 'As entered', source: 'custom', sourceId: null, dataVersion: 'test', nutrientsPer100g: { caloriesKcal: 100, proteinG: 10, carbsG: 15, fatG: 3, fiberG: null, sodiumMg: null }, servings: [] };
  data.nutrition.customFoods = [food];
  const foodEntry = createFoodLogEntry(food, 150, 'lunch', '2026-10-08');
  data.nutrition.diary = [foodEntry];
  await page.addInitScript(value => localStorage.setItem('workout-tracker:data', value), JSON.stringify(data));
  await page.goto('/#body');
  const bodyDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export measurements CSV' }).click();
  const bodyFile = await (await bodyDownload).path();
  const bodyCsv = await readFile(bodyFile!, 'utf8');
  expect(bodyCsv).toContain('"80","","85"');
  expect(bodyCsv).toContain('"Original body note"');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const deleteControl = await page.getByRole('button', { name: 'Delete measurement', exact: true }).boundingBox();
  expect(deleteControl!.x + deleteControl!.width).toBeLessThanOrEqual(359);
  await page.screenshot({ path: 'output/playwright/journal-body-mobile.png', fullPage: true });
  await page.goto('/#nutrition');
  await page.getByLabel('Diary date').fill('2026-10-08');
  const diaryDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export day CSV' }).click();
  const diaryFile = await (await diaryDownload).path();
  const diaryCsv = await readFile(diaryFile!, 'utf8');
  expect(diaryCsv).toContain(`"${foodEntry.foodName}"`);
  expect(diaryCsv).toContain('"150",""');
  expect(diaryCsv.split('\r\n').filter(Boolean)).toHaveLength(2);
});

test('preserves unreadable data until a reviewed recovery backup is confirmed', async ({ page }) => {
  const original = '{"version":99,"saved":"original document"}';
  await page.addInitScript(value => { if (!localStorage.getItem('workout-tracker:data')) localStorage.setItem('workout-tracker:data', value); }, original);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your saved data needs attention.' })).toBeVisible();
  await page.getByLabel('Choose recovery backup').setInputFiles({ name: 'forge-recovery.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(createDefaultData())) });
  await expect(page.getByText('Validated backup', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('workout-tracker:data'))).toBe(original);
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' }).click();
  expect(await page.evaluate(() => localStorage.getItem('workout-tracker:data'))).toBe(original);
  await page.getByRole('button', { name: 'Restore this backup' }).click();
  await page.getByRole('button', { name: 'Replace with backup' }).click();
  await expect(page.getByRole('button', { name: 'Start workout', exact: true })).toBeVisible();
});

test('keeps an active set draft while another tab saves body data', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start workout', exact: true }).click();
  await page.getByLabel('Weight in kilograms').fill('30');
  const other = await context.newPage();
  await other.goto('/#body');
  await other.getByRole('button', { name: 'Log weight', exact: true }).click();
  await other.getByLabel('Weight in kilograms').fill('80');
  await other.getByRole('button', { name: 'Save measurement' }).click();
  await expect(other.getByRole('heading', { name: '80 kg', exact: true })).toBeVisible();
  await expect(page.getByLabel('Weight in kilograms')).toHaveValue('30');
  await page.getByLabel('Repetitions').fill('10');
  await page.getByRole('button', { name: 'Complete set', exact: true }).click();
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!));
  expect(data.body.measurements[0].weightKg).toBe(80);
  expect(data.sessions[0].exercises[0].sets[0]).toMatchObject({ weightKg: 30, reps: 10, completed: true });
});

test('loads deferred charts offline and retains workout preferences after reload', async ({ page, context }) => {
  const data = createDefaultData();
  const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-10-08T09:00:00.000Z');
  session.completedAt = '2026-10-08T10:00:00.000Z';
  Object.assign(session.exercises[0]!.sets[0]!, { weightKg: 30, reps: 10, completed: true });
  data.sessions = [session];
  await page.addInitScript(value => { if (!localStorage.getItem('workout-tracker:data')) localStorage.setItem('workout-tracker:data', value); }, JSON.stringify(data));
  await page.goto('/#settings');
  await page.getByLabel(/Sound when rest ends/).uncheck();
  await page.getByLabel(/Keep the screen awake/).uncheck();
  // Switches save immediately; there is no Save button.
  await expect(page.getByText('Workout preferences saved').first()).toBeVisible();
  await expect(page.getByLabel(/Keep the screen awake/)).not.toBeChecked();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel(/Sound when rest ends/)).not.toBeChecked();
  await page.getByRole('navigation').getByRole('button', { name: 'Progress', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Exercise trend data' })).toBeVisible();
  await expect(page.locator('.recharts-surface')).toBeVisible();
  await page.screenshot({ path: 'output/playwright/journal-progress-offline-desktop.png', fullPage: true });
});

test('charts bodyweight reps and sets with all metric controls visible on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  const data = createDefaultData();
  const program = data.programs[0]!;
  const workout = { ...program.workouts[0]!, exercises: [{ ...program.workouts[0]!.exercises[0]!, exerciseId: 'push-up' }] };
  const first = createSession(program, workout, data.exercises, '2026-10-06T09:00:00Z');
  first.completedAt = '2026-10-06T10:00:00Z';
  first.exercises[0]!.sets.forEach((set, index) => Object.assign(set, { weightKg: 0, reps: [12, 10, 8][index], completed: true }));
  const second = createSession(program, workout, data.exercises, '2026-10-08T09:00:00Z');
  second.completedAt = '2026-10-08T10:00:00Z';
  second.exercises[0]!.sets.forEach((set, index) => Object.assign(set, { weightKg: 0, reps: [15, 12, 10][index], completed: true }));
  data.sessions = [first, second];
  await page.addInitScript(value => localStorage.setItem('workout-tracker:data', value), JSON.stringify(data));
  await page.goto('/#progress');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toHaveCSS('opacity', '0');
  await page.keyboard.press('Tab');
  await expect(skip).toBeFocused();
  await expect(skip).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  expect(new URL(page.url()).hash).toBe('#progress');
  await expect(skip).toHaveCSS('opacity', '0');
  await page.getByRole('button', { name: 'Reps', exact: true }).click();
  const table = page.getByRole('table', { name: 'Exercise trend data' });
  await expect(table.getByText('30 reps', { exact: true })).toBeVisible();
  await expect(table.getByText('37 reps', { exact: true })).toBeVisible();
  await expect(page.locator('.recharts-surface')).toBeVisible();
  for (const name of ['Top load', 'Volume', 'Reps', 'Sets']) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/playwright/journal-bodyweight-progress-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Sets', exact: true }).click();
  await expect(table.getByText('3 sets', { exact: true })).toHaveCount(2);
});

test('downloads a complete JSON backup before a confirmed full reset clears private metadata', async ({ page }) => {
  const data = createDefaultData();
  data.settings.restAlertSound = false;
  data.exercises[0]!.setupNotes = 'Private library note';
  data.mergeLedger = { mappings: [{ key: 'sessions:old', sourceContent: '{"notes":"Private original session"}', destinationId: 'old', resultContent: '{"notes":"Private original session"}' }], receipts: [] };
  await page.addInitScript(value => {
    if (!localStorage.getItem('workout-tracker:data')) {
      localStorage.setItem('workout-tracker:data', value);
      localStorage.setItem('forge:workout-draft:local:old', '{"private":"draft"}');
    }
  }, JSON.stringify(data));
  await page.goto('/#settings');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^forge-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(backup).toEqual(data);
  await page.getByRole('button', { name: 'Reset all data' }).click();
  expect(await page.evaluate(() => localStorage.getItem('workout-tracker:data'))).toContain('Private original session');
  await page.getByRole('button', { name: 'Reset everything' }).click();
  await expect(page.getByText('Your data was reset.')).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!));
  expect(saved.mergeLedger).toBeUndefined();
  expect(saved.programs).toEqual([]);
  expect(JSON.stringify(saved)).not.toContain('Private');
  expect(saved.settings.restAlertSound).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('forge:workout-draft:local:old'))).toBeNull();
  await page.reload();
  await expect(page.getByLabel(/Sound when rest ends/)).toBeChecked();
});
