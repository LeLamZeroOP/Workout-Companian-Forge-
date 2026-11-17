import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { useEffect, useState } from 'react';
import type { WorkoutPreferences } from '../../domain/models';

function values(settings: WorkoutPreferences): WorkoutPreferences {
  return { restAlertSound: settings.restAlertSound, restAlertVibration: settings.restAlertVibration, keepScreenAwake: settings.keepScreenAwake };
}

export function WorkoutPreferencesForm({ settings, onSave }: { settings: WorkoutPreferences; onSave: (preferences: WorkoutPreferences) => void }) {
  const [draft, setDraft] = useState(() => values(settings));
  const current = JSON.stringify(values(settings));
  const drafted = JSON.stringify(draft);
  const [baseline, setBaseline] = useState(current);
  useEffect(() => {
    if (current === drafted) setBaseline(current);
    else if (drafted === baseline) {
      setDraft(JSON.parse(current) as WorkoutPreferences);
      setBaseline(current);
    }
  }, [current, drafted, baseline]);
  const conflict = current !== baseline && current !== drafted;
  const options: Array<{ key: keyof WorkoutPreferences; label: string; description: string }> = [
    { key: 'restAlertSound', label: 'Sound when rest ends', description: 'A short chime while the Workout page is open. Device volume and browser playback rules apply.' },
    { key: 'restAlertVibration', label: 'Vibrate when rest ends', description: 'A brief vibration on devices and browsers that support it.' },
    { key: 'keepScreenAwake', label: 'Keep the screen awake', description: 'Request screen wake lock while an active workout is visible. Your device may release it to save battery.' },
  ];
  const formRef = useUnsavedForm(draft, undefined, drafted !== current);
  return <form ref={formRef} className="analytics-card workout-preferences" onSubmit={event => { event.preventDefault(); if (!conflict && drafted !== current) onSave(draft); }}>
    <p className="eyebrow">During your workout</p><h2>Workout preferences</h2>
    {options.map(option => <label className="preference-row" key={option.key}><input type="checkbox" checked={draft[option.key]} onChange={event => setDraft(previous => ({ ...previous, [option.key]: event.target.checked }))} /><span><strong>{option.label}</strong><small>{option.description}</small></span></label>)}
    <p className="field-help">A suspended browser cannot guarantee a rest alert. Rest timing still uses the saved end time.</p>
    {conflict && <p role="alert">These preferences changed elsewhere. Load the latest settings before saving.</p>}
    <div className="form-actions"><button className="primary-action" type="submit" disabled={drafted === current || conflict}>Save workout preferences</button>{(drafted !== current || conflict) && <button className="secondary-action" type="button" onClick={() => { setDraft(values(settings)); setBaseline(current); }}>Load saved preferences</button>}</div>
  </form>;
}
