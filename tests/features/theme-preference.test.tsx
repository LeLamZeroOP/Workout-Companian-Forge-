import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppearanceSettings } from '../../src/components/ThemeControl';
import { useAppliedTheme } from '../../src/app/theme';

function Root() {
  useAppliedTheme();
  return <AppearanceSettings />;
}

describe('theme preference', () => {
  beforeEach(() => { localStorage.clear(); delete document.documentElement.dataset.theme; });
  afterEach(() => { localStorage.clear(); });

  it('applies and saves the choice from Settings → Appearance', () => {
    render(<Root />);
    expect(screen.getByRole('button', { name: 'System theme' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('forge:theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('starts from the saved theme and follows a change made in another tab', () => {
    localStorage.setItem('forge:theme', 'light');
    render(<Root />);
    expect(document.documentElement.dataset.theme).toBe('light');
    act(() => {
      localStorage.setItem('forge:theme', 'dark');
      window.dispatchEvent(new StorageEvent('storage', { key: 'forge:theme', newValue: 'dark' }));
    });
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true');
  });
});
