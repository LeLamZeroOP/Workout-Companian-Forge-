import { expect, test } from '@playwright/test';
import { createDefaultData } from '../../src/data/defaults';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(data => {
    localStorage.setItem('workout-tracker:data', data);
    localStorage.setItem('forge:theme', 'light');
  }, JSON.stringify(createDefaultData()));
});

for (const width of [320, 768, 1440]) {
  test(`all destinations fit the ${width}px viewport in both themes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['Light', 'Dark']) {
      for (const route of ['today', 'programs', 'workout', 'history', 'progress', 'body', 'nutrition', 'settings', 'more']) {
        await page.goto(`/#${route}`);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.getByRole('button', { name: `${theme} theme`, exact: true }).click();
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await expect(page.getByRole('navigation')).toBeVisible();
        if (route === 'today') {
          await page.locator('.motion-enter').evaluateAll(async elements => {
            await Promise.all(elements.flatMap(element => element.getAnimations()).map(animation => animation.finished.catch(() => undefined)));
          });
          await page.screenshot({ path: `output/playwright/ui-redesign-${width}-${theme.toLowerCase()}.png`, fullPage: true });
        }
      }
    }
  });
}

test('keyboard selects open immediately and restore focus', async ({ page }) => {
  await page.goto('/');
  const workout = page.getByRole('button', { name: 'Selected workout', exact: true });
  await workout.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('listbox')).toBeVisible();
  const popupMotion = await page.locator('.select-control-popup').evaluate(element => ({ animation: getComputedStyle(element).animationName, duration: getComputedStyle(element).transitionDuration }));
  expect(popupMotion).toEqual({ animation: 'none', duration: '0s' });
  await page.keyboard.press('Escape');
  await expect(workout).toBeFocused();
});

test('theme changes match browser chrome and pointer presses honor reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark theme', exact: true }).click();
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111114');
  const action = page.getByRole('button', { name: 'Start workout', exact: true });
  const box = await action.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  expect(await action.evaluate(element => getComputedStyle(element).transform)).toBe('none');
  await page.mouse.move(0, 0);
  await page.mouse.up();
});

test('dashboard survives large text and long program names', async ({ page }) => {
  const data = createDefaultData();
  data.programs[0]!.name = 'Strength and conditioning — การฝึกความแข็งแรง';
  await page.addInitScript(value => localStorage.setItem('workout-tracker:data', value), JSON.stringify(data));
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const start = page.getByRole('button', { name: 'Start workout', exact: true });
  await start.scrollIntoViewIfNeeded();
  const action = await start.boundingBox();
  const nav = await page.getByRole('navigation').boundingBox();
  expect(action!.y + action!.height).toBeLessThan(nav!.y);
});

test('navigation highlight follows rapid destination changes and mobile resizing', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const navigation = page.getByRole('navigation');
  await navigation.getByRole('button', { name: 'Programs', exact: true }).click();
  await navigation.getByRole('button', { name: 'Progress', exact: true }).click();
  await navigation.getByRole('button', { name: 'Today', exact: true }).click();
  const aligned = () => page.evaluate(() => {
    const selected = document.querySelector('nav [aria-current="page"]')!.getBoundingClientRect();
    const highlight = document.querySelector('.nav-highlight')!.getBoundingClientRect();
    return ['x', 'y', 'width', 'height'].every(key => Math.abs(selected[key as keyof DOMRect] as number - (highlight[key as keyof DOMRect] as number)) < 1);
  });
  await expect.poll(aligned).toBe(true);
  await page.setViewportSize({ width: 375, height: 812 });
  await navigation.getByRole('button', { name: 'More', exact: true }).click();
  await expect.poll(aligned).toBe(true);
  await page.getByRole('button', { name: 'Open Nutrition', exact: true }).click();
  await expect.poll(aligned).toBe(true);
  await expect(page.getByRole('heading', { level: 1, name: 'Nutrition' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('effects respect reduced motion and do not replay while choosing a workout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.locator('.motion-enter').evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none'))).toBe(true);
  expect(await page.locator('.today-exercises').evaluate(element => getComputedStyle(element, '::details-content').transitionDuration)).toBe('0s');
  const card = page.locator('.today-compact-card').first();
  await card.hover();
  await expect(card).toHaveCSS('transform', 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Selected workout', exact: true }).click();
  await page.getByRole('option', { name: /^Pull/ }).click();
  await expect(page.getByRole('button', { name: 'Selected workout', exact: true })).toContainText('Pull');
  // A value change should not restart the page entrance around the user's controls.
  expect(await page.locator('.session-panel').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.locator('.today-exercises summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.today-exercises')).toHaveAttribute('open', '');
  expect(await page.locator('.today-exercises').evaluate(element => getComputedStyle(element, '::details-content').transitionDuration)).toBe('0s');
  await page.getByRole('navigation').getByRole('button', { name: 'Programs', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Programs' })).toBeVisible();
  expect(await page.locator('.nav-highlight').evaluate(element => getComputedStyle(element).transitionDuration)).toBe('0s');
  expect(await page.locator('.motion-enter').evaluateAll(elements => elements.every(element => getComputedStyle(element).animationName === 'none'))).toBe(true);
});
