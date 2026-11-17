import { useState } from 'react';
import type { WorkoutPreferences } from '../../domain/models';

function values(settings: WorkoutPreferences): WorkoutPreferences {
  return { restAlertSound: settings.restAlertSound, restAlertVibration: settings.restAlertVibration, keepScreenAwake: settings.keepScreenAwake };
}

const options: Array<{ key: keyof WorkoutPreferences; label: string; description: string }> = [
  { key: 'restAlertSound', label: 'Sound when rest ends', description: 'A short chime while the Workout page is open. Device volume and browser playback rules apply.' },
  { key: 'restAlertVibration', label: 'Vibrate when rest ends', description: 'A brief vibration on devices and browsers that support it.' },
  { key: 'keepScreenAwake', label: 'Keep the screen awake', description: 'Request screen wake lock while an active workout is visible. Your device may release it to save battery.' },
];

/**
 * Each switch saves as soon as it changes. The switches always show the saved settings, so a rejected
 * save leaves the previous value in place, and a change made in another tab appears immediately.
 */
export function WorkoutPreferencesForm({ settings, onSave }: { settings: WorkoutPreferences; onSave: (preferences: WorkoutPreferences) => boolean | void }) {
  const [error, setError] = useState('');
  const saved = values(settings);
  function change(key: keyof WorkoutPreferences, checked: boolean, label: string) {
    setError('');
    // Build from the saved values so only this switch changes.
    if (onSave({ ...saved, [key]: checked }) === false) setError(`${label} could not be saved. Your previous setting is kept; please retry.`);
  }
  return <section className="analytics-card workout-preferences" aria-labelledby="workout-preferences-title">
    <p className="eyebrow">During your workout</p><h2 id="workout-preferences-title">Workout preferences</h2>
    <p className="field-help">Changes save as soon as you switch them.</p>
    {options.map(option => <label className="preference-row" key={option.key}><input type="checkbox" role="switch" checked={saved[option.key]} onChange={event => change(option.key, event.target.checked, option.label)} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}
    {error && <p className="field-error" role="alert">{error}</p>}
    <p className="field-help">A suspended browser cannot guarantee a rest alert. Rest timing still uses the saved end time.</p>
  </section>;
}
