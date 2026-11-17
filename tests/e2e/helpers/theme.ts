import { expect, type Page } from '@playwright/test';

/**
 * Switches the colour theme without leaving the current screen, the same way a change made in another
 * Forge tab arrives: the saved preference plus a storage event. The visible switch is in Settings → Appearance.
 */
export async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate(value => {
    localStorage.setItem('forge:theme', value);
    window.dispatchEvent(new StorageEvent('storage', { key: 'forge:theme', newValue: value }));
  }, theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}
