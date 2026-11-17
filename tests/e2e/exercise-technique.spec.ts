import { expect, test } from '@playwright/test';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

for (const width of [320, 768, 1024, 1440]) {
  test(`opens technique videos without changing workout progress at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 740 : 1000 });
    const data = createDefaultData();
    const program = data.programs[0]!;
    data.sessions = [createSession(program, program.workouts[0]!, data.exercises, new Date().toISOString())];
    await page.addInitScript(value => localStorage.setItem('workout-tracker:data', value), JSON.stringify(data));
    // Verify our player contract without depending on YouTube network availability.
    await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ contentType: 'text/html', body: '<html><body style="background:#18181b;color:white;font-family:sans-serif;display:grid;place-items:center;height:90vh"><p>YouTube technique player</p></body></html>' }));
    await page.goto('/#workout');
    await page.getByLabel('Weight in kilograms').fill('25');
    const trigger = page.getByRole('button', { name: 'Watch technique for Dumbbell Chest Press' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Dumbbell Chest Press' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('iframe')).toHaveAttribute('src', /youtube-nocookie.com\/embed\/t1iaVBMItPo/);
    const playerBox = await dialog.locator('iframe').boundingBox();
    expect(playerBox!.width).toBeGreaterThanOrEqual(200);
    expect(playerBox!.height).toBeGreaterThanOrEqual(200);
    await expect(dialog.getByRole('link', { name: /Open on YouTube/ })).toBeFocused();
    await page.screenshot({ path: `output/playwright/technique-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = await dialog.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByLabel('Weight in kilograms')).toHaveValue('25');
    await expect(page.getByRole('progressbar', { name: 'Workout completion' })).toHaveAttribute('value', '0');
  });
}

test('opens a library video independently of the exercise editor', async ({ page }) => {
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ body: '' }));
  await page.goto('/#programs');
  await page.getByLabel('Search exercises').fill('Lat Pulldown');
  await page.getByRole('button', { name: 'Watch technique for Lat Pulldown', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Lat Pulldown' })).toBeVisible();
  await expect(page.getByLabel('Exercise name', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Close technique video' }).click();
  await page.getByRole('button', { name: /^Lat Pulldown cable/ }).click();
  await expect(page.getByLabel('Exercise name', { exact: true })).toHaveValue('Lat Pulldown');
});

test('keeps technique labels and icons inside the exercise card at every layout width', async ({ page }) => {
  await page.goto('/#programs');
  const more = page.getByRole('button', { name: 'Show more exercises' });
  while (await more.isVisible()) await more.click();
  for (const width of [320, 640, 768, 818, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.locator('.catalog-row > .exercise-technique-trigger').evaluateAll(controls => controls.map(control => {
      const card = control.closest('.catalog-list')!.getBoundingClientRect();
      const button = control.getBoundingClientRect();
      const label = control.querySelector('span')!;
      const range = document.createRange();
      range.selectNodeContents(label);
      const text = range.getBoundingClientRect();
      const icon = control.querySelector('svg')!.getBoundingClientRect();
      return { name: control.getAttribute('aria-label'), cardLeft: card.left, cardRight: card.right, buttonLeft: button.left, buttonRight: button.right, textLeft: text.left, textRight: text.right, iconRight: icon.right };
    }));
    expect(bounds).toHaveLength(200);
    for (const box of bounds) {
      const message = `${box.name} at ${width}px`;
      expect(box.buttonLeft, message).toBeGreaterThanOrEqual(box.cardLeft);
      expect(box.buttonRight, message).toBeLessThanOrEqual(box.cardRight);
      expect(box.textRight, message).toBeLessThanOrEqual(box.buttonRight);
      expect(box.textLeft, message).toBeGreaterThanOrEqual(box.iconRight);
    }
  }
  await page.getByLabel('Search exercises').fill('front squat');
  await page.screenshot({ path: 'output/playwright/technique-library-contained.png' });
});

test('exposes new exercises and videos to an existing account and saves a workout addition', async ({ page }) => {
  const data = createDefaultData();
  data.exercises = data.exercises.slice(0, 3);
  const program = data.programs[0]!;
  data.sessions = [createSession(program, program.workouts[0]!, data.exercises, new Date().toISOString())];
  await page.addInitScript(value => { if (!localStorage.getItem('workout-tracker:data')) localStorage.setItem('workout-tracker:data', value); }, JSON.stringify(data));
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ body: '' }));
  await page.goto('/#programs');
  await expect(page.getByText('200 exercises.', { exact: false })).toBeVisible();
  await expect(page.locator('.catalog-row')).toHaveCount(24);
  await page.getByLabel('Search exercises').fill('front squat');
  await page.getByRole('button', { name: 'Watch technique for Barbell Front Squat', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Barbell Front Squat' }).locator('iframe')).toHaveAttribute('src', /youtube-nocookie.com\/embed\/[\w-]{11}/);
  await page.getByRole('button', { name: 'Close technique video' }).click();
  await page.goto('/#workout');
  await page.getByRole('button', { name: 'Add exercise', exact: true }).click();
  await page.getByRole('button', { name: 'Exercise to add', exact: true }).click();
  await page.getByLabel('Search exercise to add').fill('Dead Bug');
  await page.getByRole('option', { name: /^Dead Bug bodyweight/ }).click();
  await page.getByRole('dialog', { name: 'Add exercise' }).getByRole('button', { name: 'Add exercise', exact: true }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!));
  expect(stored.sessions[0].exercises[1]).toMatchObject({ exerciseId: 'dead-bug', sets: [{ completed: false }, { completed: false }, { completed: false }] });
  expect(stored.exercises).toEqual(data.exercises);
  expect(stored.programs).toEqual(data.programs);
  await page.reload();
  const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('workout-tracker:data')!));
  expect(restored.sessions).toEqual(stored.sessions);
});
