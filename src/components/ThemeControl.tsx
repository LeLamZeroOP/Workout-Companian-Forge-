import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
type Theme = 'system' | 'light' | 'dark';
export function ThemeControl() {
  const [theme, setTheme] = useState<Theme>(() => { try { const saved = localStorage.getItem('forge:theme'); return saved === 'dark' || saved === 'light' ? saved : 'system'; } catch { return 'system'; } });
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? media?.matches ? 'dark' : 'light' : theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#111114' : '#f5f5f7');
    };
    apply(); media?.addEventListener('change', apply);
    try { localStorage.setItem('forge:theme', theme); } catch { /* Theme remains available for this visit. */ }
    return () => media?.removeEventListener('change', apply);
  }, [theme]);
  return <div className="theme-control" role="group" aria-label="Color theme">{([{ value: 'system', label: 'System theme', Icon: Monitor }, { value: 'light', label: 'Light theme', Icon: Sun }, { value: 'dark', label: 'Dark theme', Icon: Moon }] as const).map(({ value, label, Icon }) => <button type="button" key={value} aria-label={label} title={label} aria-pressed={theme === value} onClick={() => setTheme(value)}><Icon size={16} aria-hidden="true" /></button>)}</div>;
}
