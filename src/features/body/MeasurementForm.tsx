import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { ValidatedField } from '../../components/ValidatedField';
import { useValidationFocus } from '../../hooks/useValidationFocus';
import { useState, type FormEvent } from 'react';
import type { BodyMeasurement } from '../../domain/models';
import { localDateKey, validateBodyMeasurement } from '../../domain/bodyMeasurements';
import { isCalendarDate } from '../../domain/calendar';

const optionalFields = [
  ['bodyFatPercent', 'Body fat percentage'], ['waistCm', 'Waist in centimeters'], ['chestCm', 'Chest in centimeters'],
  ['hipsCm', 'Hips in centimeters'], ['upperArmCm', 'Upper arm in centimeters'], ['thighCm', 'Thigh in centimeters'],
] as const;

function newId() { return `measurement-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`; }
function numberOrNull(value: string) { return value === '' ? null : Number(value); }

export function MeasurementForm({ initial, now, entryOrder, onSave, onCancel, saveDisabled = false }: { saveDisabled?: boolean; initial?: BodyMeasurement; now: Date; entryOrder?: number; onSave: (entry: BodyMeasurement) => void; onCancel: () => void }) {
  const [weight, setWeight] = useState(initial ? String(initial.weightKg) : '');
  const [date, setDate] = useState(initial?.localDate ?? localDateKey(initial?.recordedAt ?? now.toISOString()));
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(optionalFields.map(([field]) => [field, initial?.[field] === null || initial?.[field] === undefined ? '' : String(initial[field])])));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formRef = useValidationFocus(errors);
  useUnsavedForm([weight, date, values, notes], formRef);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (saveDisabled) return;
    if (!isCalendarDate(date)) {
      setErrors({ recordedAt: 'Choose a valid date.' }); return;
    }
    const entry: BodyMeasurement = {
      id: initial?.id ?? newId(),
      recordedAt: initial && date === (initial.localDate ?? localDateKey(initial.recordedAt)) ? initial.recordedAt : new Date(`${date}T12:00:00Z`).toISOString(),
      localDate: date, entryOrder: initial?.entryOrder ?? entryOrder ?? Date.now(), weightKg: Number(weight), notes,
      bodyFatPercent: numberOrNull(values.bodyFatPercent ?? ''), waistCm: numberOrNull(values.waistCm ?? ''), chestCm: numberOrNull(values.chestCm ?? ''),
      hipsCm: numberOrNull(values.hipsCm ?? ''), upperArmCm: numberOrNull(values.upperArmCm ?? ''), thighCm: numberOrNull(values.thighCm ?? ''),
    };
    const nextErrors = validateBodyMeasurement(entry);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave(entry);
  }

  return <form ref={formRef} className="body-form analytics-card" onSubmit={submit} noValidate>
    <div className="section-heading"><div><p className="eyebrow">Body log</p><h2>{initial ? 'Edit measurement' : 'Log measurement'}</h2></div></div>
    <div className="body-form-grid">
      <ValidatedField label="Weight in kilograms" error={errors.weightKg} type="number" inputMode="decimal" step="0.1" value={weight} onChange={event => setWeight(event.target.value)} />
      <ValidatedField label="Recorded date" error={errors.recordedAt} type="date" value={date} onChange={event => setDate(event.target.value)} />
    </div>
    <details className="advanced-fields"><summary>Additional measurements{optionalFields.some(([field]) => errors[field]) ? ' · Needs attention' : ''}</summary><div className="body-form-grid">{optionalFields.map(([field, label]) => <ValidatedField key={field} label={label} error={errors[field]} type="number" inputMode="decimal" step="0.1" value={values[field] ?? ''} onChange={event => setValues(current => ({ ...current, [field]: event.target.value }))} />)}</div><label className="field">Private note<textarea rows={3} maxLength={4096} value={notes} onChange={(event) => setNotes(event.target.value)} /></label></details>
    <div className="form-actions"><button className="primary-action" type="submit" disabled={saveDisabled}>Save measurement</button><button className="text-action" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
