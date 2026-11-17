import { expect, test, type Page } from '@playwright/test';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

/*
 * Pixel baselines for key screens, added before the stylesheet consolidation (UI plan, Chunk 7).
 * They use a fixed clock, synthetic data, disabled animations and a masked workout timer.
 * Baselines depend on this machine's system fonts; regenerate them with --update-snapshots after an
 * intended visual change and review the new images before committing them.
 */

const now = new Date('2026-11-17T12:00:00');

function journal({ active = false } = {}) {
  const data = createDefaultData();
  const program = data.programs[0]!;
  data.sessions = [26, 22, 19, 15, 12, 8, 5, 1].map((back, index) => {
    const start = new Date(now); start.setDate(start.getDate() - back); start.setHours(18, 0, 0, 0);
    const session = createSession(program, program.workouts[index % program.workouts.length]!, data.exercises, start.toISOString());
    session.exercises.forEach(exercise => exercise.sets.forEach((set, setIndex) => Object.assign(set, { weightKg: 20 + Math.floor(index / 2) * 2.5, reps: setIndex > 1 ? 9 : 10, completed: true })));
    const end = new Date(start); end.setMinutes(end.getMinutes() + 55 + (index % 3) * 10);
    session.completedAt = end.toISOString();
    session.guide = { currentExerciseId: null, currentSetId: null, restTimer: null };
    return session;
  });
  if (active) {
    const start = new Date(now); start.setMinutes(start.getMinutes() - 20);
    data.sessions.push(createSession(program, program.workouts[0]!, data.exercises, start.toISOString()));
  }
  const base = { bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' };
  data.body.measurements = [27, 20, 14, 9, 4, 1, 0].map((back, index) => {
    const date = new Date(now); date.setDate(date.getDate() - back); date.setHours(7, 30, 0, 0);
    const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { ...base, id: `m-${index}`, recordedAt: date.toISOString(), localDate, entryOrder: 0, weightKg: Math.round((82.4 - index * 0.35) * 10) / 10 };
  });
  data.nutrition.targets = [{ id: 't-1', effectiveFrom: '2026-10-01', mode: 'manual', caloriesKcal: 2600, proteinG: 170, carbsG: 300, fatG: 80, formulaVersion: null }];
  const entry = (id: string, meal: 'breakfast' | 'lunch' | 'snack', foodName: string, kcal: number, protein: number, carbs: number | null, fat: number | null, servingDescription: string) => ({ id, localDate: '2026-11-17', meal, foodId: null, foodName, grams: 100, servingDescription, nutrients: { caloriesKcal: kcal, proteinG: protein, carbsG: carbs, fatG: fat, fiberG: null, sodiumMg: null }, source: 'custom' as const, sourceId: null });
  data.nutrition.diary = [entry('d1', 'breakfast', 'Oats with milk', 420, 18, 62, 9, '1 bowl'), entry('d2', 'lunch', 'Chicken rice bowl', 680, 48, 78, 14, '1 bowl'), entry('d3', 'snack', 'Protein bar', 210, 20, null, null, '1 bar')];
  return data;
}

async function open(page: Page, route: string, { width, height, theme, active = false }: { width: number; height: number; theme: 'light' | 'dark'; active?: boolean }) {
  await page.clock.install({ time: now });
  await page.setViewportSize({ width, height });
  await page.addInitScript(([data, mode]) => { localStorage.setItem('workout-tracker:data', data); localStorage.setItem('forge:theme', mode); }, [JSON.stringify(journal({ active })), theme] as const);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/#${route}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

const shot = { animations: 'disabled' as const, caret: 'hide' as const, fullPage: true };

test.describe('visual baselines', () => {
  test('today desktop light', async ({ page }) => {
    await open(page, 'today', { width: 1280, height: 900, theme: 'light' });
    await expect(page).toHaveScreenshot('today-desktop-light.png', shot);
  });

  test('today phone dark', async ({ page }) => {
    await open(page, 'today', { width: 390, height: 844, theme: 'dark' });
    await expect(page).toHaveScreenshot('today-phone-dark.png', shot);
  });

  test('program editor desktop light', async ({ page }) => {
    await open(page, 'programs', { width: 1280, height: 900, theme: 'light' });
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Save program' })).toBeVisible();
    await expect(page).toHaveScreenshot('program-editor-desktop-light.png', { ...shot, fullPage: false });
  });

  test('workout phone light', async ({ page }) => {
    await open(page, 'workout', { width: 390, height: 844, theme: 'light', active: true });
    await expect(page.getByRole('button', { name: 'Complete set' })).toBeVisible();
    await expect(page).toHaveScreenshot('workout-phone-light.png', { ...shot, mask: [page.locator('.elapsed strong')] });
  });

  test('history phone light', async ({ page }) => {
    await open(page, 'history', { width: 390, height: 844, theme: 'light' });
    await expect(page.getByText('November 2026')).toBeVisible();
    await expect(page).toHaveScreenshot('history-phone-light.png', shot);
  });

  test('progress desktop dark', async ({ page }) => {
    await open(page, 'progress', { width: 1280, height: 900, theme: 'dark' });
    await expect(page.locator('.recharts-line').first()).toBeVisible();
    await expect(page).toHaveScreenshot('progress-desktop-dark.png', shot);
  });

  test('body phone light', async ({ page }) => {
    await open(page, 'body', { width: 390, height: 844, theme: 'light' });
    await expect(page.locator('.recharts-line').first()).toBeVisible();
    await expect(page).toHaveScreenshot('body-phone-light.png', shot);
  });

  test('nutrition desktop light', async ({ page }) => {
    await open(page, 'nutrition', { width: 1280, height: 900, theme: 'light' });
    await expect(page).toHaveScreenshot('nutrition-desktop-light.png', shot);
  });

  test('settings phone dark', async ({ page }) => {
    await open(page, 'settings', { width: 390, height: 844, theme: 'dark' });
    await expect(page).toHaveScreenshot('settings-phone-dark.png', shot);
  });
});
