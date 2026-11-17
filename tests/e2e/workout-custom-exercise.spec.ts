import { expect, test } from '@playwright/test';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

for (const width of [320, 1024]) {
  test(`creates custom exercises for adding and replacement during a workout at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    const data = createDefaultData();
    data.sessions = [createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString())];
    await page.addInitScript(value => { if (!localStorage.getItem('workout-tracker:data')) localStorage.setItem('workout-tracker:data', value); }, JSON.stringify(data));
    await page.goto('/#workout');
    await page.getByLabel('Weight in kilograms').fill('25');
    await page.getByLabel('Repetitions').fill('10');
    await page.getByRole('button', { name: 'Complete set', exact: true }).click();
    const rest = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!).sessions[0].guide.restTimer);
    const controls = page.getByRole('group', { name: 'Workout exercise controls' });
    for (const replacing of [false, true]) {
      await controls.getByRole('button', { name: replacing ? 'Replace current exercise' : 'Add exercise', exact: true }).click();
      await page.getByRole('button', { name: 'Create custom exercise', exact: true }).click();
      await page.getByLabel('Exercise name').fill(replacing ? 'My custom cable press' : 'My custom cable row');
      await page.getByRole('button', { name: 'Equipment', exact: true }).click();
      await page.getByRole('option', { name: 'Cable', exact: true }).click();
      await page.getByRole('button', { name: 'Primary muscle', exact: true }).click();
      await page.getByRole('option', { name: replacing ? 'Chest' : 'Upper back', exact: true }).click();
      await expect(page.locator('.select-control-popup')).toHaveCount(0);
      await page.getByLabel('Setup notes').fill('Use my preferred handle');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (replacing) await page.screenshot({ path: `output/playwright/workout-custom-exercise-${width}.png` });
      await page.getByRole('button', { name: replacing ? 'Create and replace' : 'Create and add', exact: true }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      if (!replacing) {
        expect(await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!).sessions[0].guide.restTimer)).toEqual(rest);
      }
    }
    await expect(page.getByRole('heading', { name: 'My custom cable press', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'My custom cable press', exact: true })).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!));
    expect(saved.exercises.filter((item: { name: string }) => item.name.startsWith('My custom'))).toHaveLength(2);
    expect(saved.sessions[0].exercises[0]).toMatchObject({ exerciseName: 'Dumbbell Chest Press', sets: [{ completed: true, weightKg: 25, reps: 10, id: expect.any(String), kind: 'working' }] });
    expect(saved.sessions[0].exercises[1].exerciseName).toBe('My custom cable press');
    expect(saved.sessions[0].exercises[2].exerciseName).toBe('My custom cable row');
    expect(saved.programs).toEqual(data.programs);
    await controls.getByRole('button', { name: 'Add exercise', exact: true }).click();
    await page.getByRole('button', { name: 'Exercise to add', exact: true }).click();
    await page.getByLabel('Search exercise to add').fill('My custom cable row');
    await expect(page.getByRole('option', { name: /My custom cable row cable · My exercise/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    try {
      await page.reload();
      await expect(page.getByRole('heading', { name: 'My custom cable press', exact: true })).toBeVisible();
    } finally { await context.setOffline(false); }
  });
}
