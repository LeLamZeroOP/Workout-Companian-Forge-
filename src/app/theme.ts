import { useEffect, useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const storageKey = 'forge:theme';
const listeners = new Set<() => void>();
// Keeps the choice when storage is unavailable; storage stays authoritative when it works.
let memory: ThemePreference | null = null;

export function getThemePreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function setThemePreference(theme: ThemePreference) {
  try { localStorage.setItem(storageKey, theme); } catch { /* The choice still applies for this visit. */ }
  memory = theme;
  listeners.forEach(listener => listener());
}

function snapshot(): ThemePreference {
  try {
    if (localStorage.getItem(storageKey) !== null) return getThemePreference();
  } catch { /* Fall back to the in-memory choice. */ }
  return memory ?? getThemePreference();
}

function onStorage(event: StorageEvent) {
  // Another Forge tab (or window) changed the theme.
  if (event.key === storageKey || event.key === null) listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener('storage', onStorage);
  };
}

export function useThemePreference() {
  return useSyncExternalStore(subscribe, snapshot, () => 'system' as const);
}

/** Applies the saved theme to the document and browser chrome, following the system when asked. */
export function useAppliedTheme() {
  const theme = useThemePreference();
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? media?.matches ? 'dark' : 'light' : theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#111114' : '#f5f5f7');
    };
    apply();
    media?.addEventListener('change', apply);
    return () => media?.removeEventListener('change', apply);
  }, [theme]);
}
