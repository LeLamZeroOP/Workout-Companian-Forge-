import { expect, test } from '@playwright/test';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

for (const width of [320, 1024]) {
  test(`adds and replaces library exercises from the workout controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const data = createDefaultData();
    const program = data.programs[0]!;
    data.sessions = [createSession(program, program.workouts[0]!, data.exercises, new Date().toISOString())];
    await page.addInitScript(value => { if (!localStorage.getItem('workout-tracker:data')) localStorage.setItem('workout-tracker:data', value); }, JSON.stringify(data));
    await page.goto('/#workout');
    await page.getByLabel('Weight in kilograms').fill('25');
    await page.getByLabel('Repetitions').fill('10');
    const controls = page.getByRole('group', { name: 'Workout exercise controls' });
    await controls.getByRole('button', { name: 'Add exercise', exact: true }).click();
    await page.getByRole('button', { name: 'Exercise to add', exact: true }).click();
    await page.getByLabel('Search exercise to add').fill('front squat');
    await page.getByRole('option', { name: /^Barbell Front Squat barbell/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Add exercise', exact: true }).click();
    await expect(page.getByLabel('Weight in kilograms')).toHaveValue('25');
    await expect(page.getByLabel('Repetitions')).toHaveValue('10');
    await page.getByRole('button', { name: 'Complete set', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Rest timer' })).toBeVisible();
    await controls.getByRole('button', { name: 'Replace current exercise' }).click();
    await expect(page.getByRole('dialog', { name: 'Replace exercise' })).toBeVisible();
    await page.getByRole('button', { name: 'Replacement exercise', exact: true }).click();
    await page.getByLabel('Search replacement exercise').fill('Smith Machine Incline');
    await page.getByRole('option', { name: /^Smith Machine Incline Press machine/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Replace exercise', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Smith Machine Incline Press', exact: true })).toBeVisible();
    await expect(page.getByLabel('Weight in kilograms')).toHaveValue('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `output/playwright/workout-exercise-controls-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Smith Machine Incline Press', exact: true })).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!));
    expect(saved.sessions[0].exercises).toEqual([
      expect.objectContaining({ exerciseName: 'Dumbbell Chest Press', sets: [expect.objectContaining({ completed: true, weightKg: 25, reps: 10 })] }),
      expect.objectContaining({ exerciseName: 'Smith Machine Incline Press', sets: expect.any(Array) }),
      expect.objectContaining({ exerciseName: 'Barbell Front Squat', sets: expect.any(Array) }),
    ]);
    expect(saved.sessions[0].exercises[1].sets).toHaveLength(2);
    expect(saved.sessions[0].exercises[2].sets).toHaveLength(3);
    expect(saved.programs).toEqual(data.programs);
  });
}
