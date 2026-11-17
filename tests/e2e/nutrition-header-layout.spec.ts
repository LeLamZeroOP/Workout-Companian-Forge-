import { expect, test } from '@playwright/test';

test('keeps the diary date readable and controls inside the toolbar at intermediate widths', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-11T12:00:00') });
  await page.goto('/#nutrition');
  for (const [width, textSize] of [[320, 16], [768, 16], [1110, 16], [1280, 16], [1440, 16], [1110, 20], [1110, 32], [1280, 32], [320, 20]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, textSize);
    for (const theme of ['Light', 'Dark']) {
      await page.getByRole('button', { name: `${theme} theme`, exact: true }).click();
      const header = page.locator('.nutrition-toolbar h2');
      await expect(header).toHaveText('Sunday, October 11');
      const wordLines = await header.evaluate(element => {
        const text = element.firstChild!; const content = text.textContent!;
        return [...content.matchAll(/\S+/g)].map(match => {
          const range = document.createRange(); range.setStart(text, match.index!); range.setEnd(text, match.index! + match[0].length);
          return range.getClientRects().length;
        });
      });
      expect(wordLines, `${width}px ${textSize}px text ${theme}: date words must not split into letters`).toEqual([1, 1, 1]);
      const toolbar = await page.locator('.nutrition-toolbar').boundingBox();
      const heading = await header.boundingBox();
      const lineHeight = await header.evaluate(element => Number.parseFloat(getComputedStyle(element).lineHeight));
      expect(heading!.height).toBeLessThanOrEqual(lineHeight * 3 + 1);
      for (const control of await page.locator('.date-switcher button, .date-switcher input').all()) {
        const bounds = await control.boundingBox();
        expect(bounds!.x).toBeGreaterThanOrEqual(toolbar!.x - 1);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(toolbar!.x + toolbar!.width + 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 1110 && theme === 'Light') await page.screenshot({ path: `output/playwright/nutrition-header-1110-${textSize}px-light.png`, fullPage: true });
    }
  }
  await page.getByRole('button', { name: 'Next day' }).click();
  await expect(page.getByLabel('Diary date')).toHaveValue('2026-10-12');
  await page.getByRole('button', { name: 'Previous day' }).click();
  await expect(page.getByLabel('Diary date')).toHaveValue('2026-10-11');
});
