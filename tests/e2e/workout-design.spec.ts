import { expect, test, type Page } from '@playwright/test';
import { setTheme } from './helpers/theme';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

function workoutFixture() {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const workout = structuredClone(program.workouts[0]!);
  workout.exercises.push({ ...program.workouts[1]!.exercises[0]!, targetSets: 2 });
  const session = createSession(program, workout, data.exercises, new Date().toISOString());
  const previous = createSession(program, workout, data.exercises, new Date(Date.now() - 86400000).toISOString());
  previous.completedAt = new Date(Date.now() - 82800000).toISOString();
  previous.exercises.forEach(exercise => exercise.sets.forEach(set => Object.assign(set, { weightKg: 30, reps: 10, completed: true })));
  data.sessions = [session, previous];
  data.settings.restAlertSound = false; data.settings.restAlertVibration = false;
  return { data, session };
}

async function seed(page: Page, data: ReturnType<typeof createDefaultData>) {
  await page.addInitScript(value => {
    if (!localStorage.getItem('workout-tracker:data')) localStorage.setItem('workout-tracker:data', value);
  }, JSON.stringify(data));
}

test('keeps mobile set entry above the fold and updates progress through rest, undo and reload', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const { data } = workoutFixture(); await seed(page, data);
  await page.goto('/#workout');
  await setTheme(page, 'dark');
  const progress = page.getByRole('progressbar', { name: 'Workout completion' });
  await expect(progress).toHaveAttribute('value', '0'); await expect(progress).toHaveAttribute('max', '5');
  const complete = page.getByRole('button', { name: 'Complete set', exact: true });
  const completeBox = await complete.boundingBox();
  const navigationBox = await page.getByRole('navigation').boundingBox();
  expect(completeBox!.y + completeBox!.height).toBeLessThan(navigationBox!.y);
  await expect(page.getByRole('button', { name: /^Workout order/ })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Use previous set' }).click();
  await expect(page.getByLabel('Weight in kilograms')).toHaveValue('30');
  await expect(complete).toBeEnabled();
  await page.screenshot({ path: 'output/playwright/workout-design-mobile-dark.png' });
  await complete.click();
  await expect(progress).toHaveAttribute('value', '1');
  await expect(page.getByRole('region', { name: 'Rest timer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip rest' })).toBeFocused();
  await page.getByRole('region', { name: 'Rest timer' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/playwright/workout-design-rest-mobile.png' });
  await page.getByRole('button', { name: 'Skip rest' }).click();
  await expect(page.getByLabel('Weight in kilograms')).toBeFocused();
  await page.getByRole('button', { name: 'Undo set 1' }).click();
  await expect(progress).toHaveAttribute('value', '0');
  await page.getByRole('button', { name: /^Workout order/ }).click();
  await page.getByRole('button', { name: /^2 Lat Pulldown/ }).click();
  await expect(page.getByRole('heading', { name: 'Lat Pulldown' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Lat Pulldown' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('shows a compact desktop session with keyboard-accessible editing and visible exercise order', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const { data } = workoutFixture(); await seed(page, data);
  await page.goto('/#workout');
  await setTheme(page, 'light');
  await expect(page.getByRole('button', { name: /^Workout order/ })).toHaveAttribute('aria-expanded', 'true');
  const entry = await page.getByLabel('Weight in kilograms').boundingBox();
  const table = await page.getByRole('table', { name: 'Sets for Dumbbell Chest Press' }).boundingBox();
  expect(entry!.y).toBeLessThan(table!.y);
  await page.getByRole('button', { name: 'Use previous set' }).click();
  await page.screenshot({ path: 'output/playwright/workout-design-desktop-light.png', fullPage: true });
  await page.getByRole('button', { name: 'Exercise options', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Exercise options', exact: true })).toBeFocused();
  await page.getByRole('button', { name: /^Workout order/ }).click();
  await expect(page.getByRole('button', { name: /^2 Lat Pulldown/ })).toBeHidden();
  await page.setViewportSize({ width: 768, height: 1024 });
  await setTheme(page, 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/playwright/workout-design-tablet-dark.png', fullPage: true });
});

test('keeps set entry above navigation on a shorter mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const { data } = workoutFixture(); await seed(page, data); await page.goto('/#workout');
  const complete = page.getByRole('button', { name: 'Complete set', exact: true });
  const actionBox = await complete.boundingBox(); const navigationBox = await page.getByRole('navigation').boundingBox();
  expect(actionBox!.y + actionBox!.height).toBeLessThan(navigationBox!.y);
  await setTheme(page, 'light');
  await page.getByRole('button', { name: 'Use previous set' }).click();
  await page.screenshot({ path: 'output/playwright/workout-design-mobile-compact.png' });
  await complete.click();
  await expect(page.getByRole('button', { name: 'Skip rest' })).toBeFocused();
});

test('handles long workout names and notes at 320px without hiding the primary action behind navigation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const { data, session } = workoutFixture();
  session.workoutName = 'Strength session with a longer workout name';
  session.exercises[0]!.exerciseName = 'Dumbbell Chest Press with a deliberate pause and controlled tempo';
  session.exercises[0]!.notes = 'Setup note: ' + 'longword'.repeat(20);
  session.notes = 'Session note\n' + 'longword'.repeat(20);
  await seed(page, data); await page.goto('/#workout');
  await setTheme(page, 'dark');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const complete = page.getByRole('button', { name: 'Complete set', exact: true });
  await complete.scrollIntoViewIfNeeded();
  const actionBox = await complete.boundingBox(); const navigationBox = await page.getByRole('navigation').boundingBox();
  expect(actionBox!.y + actionBox!.height).toBeLessThan(navigationBox!.y);
  await page.getByRole('button', { name: 'Edit workout details' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
  await page.getByText('Workout notes', { exact: true }).click();
  await expect(page.locator('.saved-notes').getByText(session.notes, { exact: true })).toBeVisible();
});

test('previews the chosen plan before starting on desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/#workout');
  await setTheme(page, 'light');
  await page.getByRole('radio', { name: /^Pull/ }).check();
  const preview = page.getByRole('complementary', { name: 'Workout preview' });
  await expect(preview.getByText('Lat Pulldown', { exact: true })).toBeVisible();
  await expect(preview).toContainText('3 sets · 8–12 reps · 90s rest');
  await page.screenshot({ path: 'output/playwright/workout-design-start-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await preview.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/playwright/workout-design-start-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Begin guided workout' }).click();
  await expect(page.getByRole('heading', { name: 'Lat Pulldown' })).toBeVisible();
});

test('keeps rejected session edits inside the dialog and saves the same changes on retry', async ({ page }) => {
  const { data } = workoutFixture(); await seed(page, data);
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    let rejected = false;
    Storage.prototype.setItem = function(key, value) {
      if (!rejected && key === 'workout-tracker:data' && value.includes('Retry this note')) {
        rejected = true; throw new DOMException('Storage is full', 'QuotaExceededError');
      }
      original.call(this, key, value);
    };
  });
  await page.goto('/#workout');
  await page.getByRole('button', { name: 'Edit workout details' }).click();
  await page.getByLabel('Session notes').fill('Retry this note');
  await page.getByRole('button', { name: 'Save changes' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toContainText('could not be saved');
  await expect(page.getByLabel('Session notes')).toHaveValue('Retry this note');
  await dialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(dialog).toBeHidden();
  await page.getByText('Workout notes', { exact: true }).click();
  await expect(page.locator('.saved-notes').getByText('Retry this note', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!).sessions[0].notes)).toBe('Retry this note');
});

test('summarizes the active workout on Today and shows the next plan suggestion after finishing', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { data, session } = workoutFixture();
  Object.assign(session.exercises[0]!.sets[0]!, { weightKg: 30, reps: 10, completed: true });
  await seed(page, data); await page.goto('/#today');
  await setTheme(page, 'light');
  await expect(page.getByRole('progressbar', { name: 'Active workout completion' })).toHaveAttribute('value', '1');
  await expect(page.getByRole('list', { name: 'Workouts this week' }).getByRole('listitem')).toHaveCount(7);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'output/playwright/workout-design-today-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Resume workout' }).click();
  await page.getByRole('button', { name: 'Finish early', exact: true }).click();
  await page.getByRole('button', { name: 'Save and finish' }).click();
  await page.getByRole('navigation').getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Selected workout' })).toContainText('Pull');
  await expect(page.getByText(/Next in program order, after Push/)).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'output/playwright/workout-design-today-desktop.png', fullPage: true });
});

test('preserves workout controls when text is doubled and motion is reduced', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const { data } = workoutFixture(); await seed(page, data); await page.goto('/#workout');
  // Simulate a user text-size override independently of viewport reflow.
  await page.evaluate(() => {
    const resized = new WeakSet<HTMLElement>();
    const resize = () => {
      const elements = [...document.querySelectorAll<HTMLElement>('main p, main h1, main h2, main h3, main h4, main span, main strong, main small, main button, main input, main label, main summary, main th, main td')].filter(element => !resized.has(element));
      const sizes = elements.map(element => Number.parseFloat(getComputedStyle(element).fontSize));
      elements.forEach((element, index) => { resized.add(element); element.style.fontSize = `${sizes[index]! * 2}px`; });
    };
    resize();
    new MutationObserver(resize).observe(document.querySelector('main')!, { childList: true, subtree: true });
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const complete = page.getByRole('button', { name: 'Complete set', exact: true });
  await complete.scrollIntoViewIfNeeded();
  const actionBox = await complete.boundingBox();
  expect(actionBox!.x).toBeGreaterThanOrEqual(0); expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(375);
  await page.getByRole('button', { name: 'Use previous set' }).click();
  await complete.click();
  await expect(page.getByRole('region', { name: 'Rest timer' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Skip rest' }).click();
  await expect(page.getByLabel('Weight in kilograms')).toBeVisible();
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await expect(page.getByRole('progressbar', { name: 'Workout completion' })).toHaveCSS('appearance', 'auto');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('takes an empty workout library directly to the program builder without losing the route', async ({ page }) => {
  const data = createDefaultData(); data.programs = []; data.settings.lastSelectedProgramId = null;
  await seed(page, data); await page.goto('/#workout');
  await page.getByRole('link', { name: 'Create your first program' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Programs' })).toBeVisible();
  await page.getByRole('button', { name: 'Create program', exact: true }).click();
  await expect(page.getByLabel('Program name')).toBeVisible();
});
