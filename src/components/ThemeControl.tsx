import { Monitor, Moon, Sun } from 'lucide-react';
import { setThemePreference, useThemePreference } from '../app/theme';

const options = [
  { value: 'system', label: 'System theme', text: 'System', Icon: Monitor },
  { value: 'light', label: 'Light theme', text: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark theme', text: 'Dark', Icon: Moon },
] as const;

export function ThemeControl() {
  const theme = useThemePreference();
  return <div className="theme-control" role="group" aria-label="Color theme">{options.map(({ value, label, text, Icon }) => <button type="button" key={value} aria-label={label} aria-pressed={theme === value} onClick={() => setThemePreference(value)}><Icon size={18} aria-hidden="true" /><span aria-hidden="true">{text}</span></button>)}</div>;
}

export function AppearanceSettings() {
  return <section className="analytics-card appearance-settings" aria-labelledby="appearance-title">
    <p className="eyebrow">Appearance</p><h2 id="appearance-title">Theme</h2>
    <p className="field-help">System follows your device's light or dark setting. Your choice is saved on this device.</p>
    <ThemeControl />
  </section>;
}
