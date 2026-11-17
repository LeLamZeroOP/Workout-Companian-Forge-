import { expect, test } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`starts, resumes, and finishes a workout without a program at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Workout', exact: true }).click();
    await page.getByRole('button', { name: 'Program', exact: true }).click();
    await page.getByRole('option', { name: /Starter Strength/ }).click();
    await page.getByRole('radio', { name: /^Push/ }).click();
    await page.getByRole('button', { name: 'Begin guided workout' }).click();
    // Seed an empty library from the app's persisted document, then use only UI controls.
    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('workout-tracker:data')!);
      data.programs = [];
      data.sessions = [];
      data.settings.lastSelectedProgramId = null;
      localStorage.setItem('workout-tracker:data', JSON.stringify(data));
    });
    await page.reload();
    await page.getByRole('button', { name: 'Custom workout', exact: true }).click();
    await page.getByLabel('Workout name', { exact: true }).fill('Lunch workout');
    await page.getByRole('button', { name: 'Exercise 1', exact: true }).click();
    await page.getByLabel('Search exercise 1').fill('Lat Pulldown');
    await page.getByRole('option', { name: 'Lat Pulldown cable', exact: true }).click();
    await page.getByLabel('Sets for exercise 1', { exact: true }).fill('1');
    await page.getByLabel('Rest seconds for exercise 1', { exact: true }).fill('0');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `output/playwright/custom-workout-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Start custom workout', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Lunch workout', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Lat Pulldown', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Lunch workout', exact: true })).toBeVisible();
    await page.getByLabel('Weight in kilograms').fill('20');
    await page.getByLabel('Repetitions').fill('10');
    await page.getByRole('button', { name: 'Complete set', exact: true }).click();
    await page.getByRole('button', { name: 'Finish workout', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Finished workout' })).toBeVisible();
    await page.getByRole('link', { name: 'View history' }).click();
    await expect(page.getByRole('button', { name: 'Open Lunch workout from Custom workout' })).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!));
    expect(saved.programs).toHaveLength(0);
    expect(saved.settings.lastSelectedProgramId).toBeNull();
    expect(saved.sessions[0]).toMatchObject({ programId: null, workoutTemplateId: null, workoutName: 'Lunch workout' });
    expect(saved.sessions[0].completedAt).toBeTruthy();
  });
}
