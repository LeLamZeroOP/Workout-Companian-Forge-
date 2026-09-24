import { useState, type FormEvent } from 'react';
import type { BodyMeasurement } from '../../domain/models';
import { validateBodyMeasurement } from '../../domain/bodyMeasurements';

const optionalFields = [
  ['bodyFatPercent', 'Body fat percentage'], ['waistCm', 'Waist in centimeters'], ['chestCm', 'Chest in centimeters'],
  ['hipsCm', 'Hips in centimeters'], ['upperArmCm', 'Upper arm in centimeters'], ['thighCm', 'Thigh in centimeters'],
] as const;

function newId() { return `measurement-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`; }
function numberOrNull(value: string) { return value === '' ? null : Number(value); }

export function MeasurementForm({ initial, now, onSave, onCancel }: { initial?: BodyMeasurement; now: Date; onSave: (entry: BodyMeasurement) => void; onCancel: () => void }) {
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : '');
  const [date, setDate] = useState((initial?.recordedAt ?? now.toISOString()).slice(0, 10));
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(optionalFields.map(([field]) => [field, initial?.[field] === null || initial?.[field] === undefined ? '' : String(initial[field])])));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const entry: BodyMeasurement = {
      id: initial?.id ?? newId(), recordedAt: new Date(`${date}T12:00:00`).toISOString(), weightKg: Number(weight), notes,
      bodyFatPercent: numberOrNull(values.bodyFatPercent ?? ''), waistCm: numberOrNull(values.waistCm ?? ''), chestCm: numberOrNull(values.chestCm ?? ''),
      hipsCm: numberOrNull(values.hipsCm ?? ''), upperArmCm: numberOrNull(values.upperArmCm ?? ''), thighCm: numberOrNull(values.thighCm ?? ''),
    };
    const nextErrors = validateBodyMeasurement(entry);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave(entry);
  }

  return <form className="body-form analytics-card" onSubmit={submit} noValidate>
    <div className="section-heading"><div><p className="eyebrow">Body log</p><h2>{initial ? 'Edit measurement' : 'Log measurement'}</h2></div></div>
    <div className="body-form-grid">
      <label>Weight in kilograms<input type="number" inputMode="decimal" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} aria-describedby={errors.weightKg ? 'weight-error' : undefined} /></label>
      <label>Recorded date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
    </div>
    {errors.weightKg && <p className="field-error" id="weight-error">{errors.weightKg}</p>}
    <details className="advanced-fields"><summary>Additional measurements</summary><div className="body-form-grid">{optionalFields.map(([field, label]) => <label key={field}>{label}<input type="number" inputMode="decimal" step="0.1" value={values[field] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} />{errors[field] && <span className="field-error">{errors[field]}</span>}</label>)}</div><label className="field">Private note<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label></details>
    <div className="form-actions"><button className="primary-action" type="submit">Save measurement</button><button className="text-action" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
