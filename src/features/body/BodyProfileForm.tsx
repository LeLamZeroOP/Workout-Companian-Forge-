import { useState, type FormEvent } from 'react';
import { SelectControl } from '../../components/SelectControl';
import type { BodyProfile } from '../../domain/models';

export function BodyProfileForm({ initial, onSave, onCancel }: { initial: BodyProfile | null; onSave: (profile: BodyProfile) => void; onCancel: () => void }) {
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? '');
  const [height, setHeight] = useState(initial ? String(initial.heightCm) : '');
  const [equationSex, setEquationSex] = useState<BodyProfile['equationSex']>(initial?.equationSex ?? 'female');
  const [activityLevel, setActivityLevel] = useState<BodyProfile['activityLevel']>(initial?.activityLevel ?? 'light');
  const [goal, setGoal] = useState<BodyProfile['goal']>(initial?.goal ?? 'maintain');
  const [targetMode, setTargetMode] = useState<BodyProfile['targetMode']>(initial?.targetMode ?? 'calculated');
  const [eligible, setEligible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!birthDate || Number.isNaN(new Date(birthDate).getTime())) nextErrors.birthDate = 'Enter your birth date.';
    if (!Number.isFinite(Number(height)) || Number(height) < 100 || Number(height) > 250) nextErrors.heightCm = 'Height must be from 100 to 250 cm.';
    if (targetMode === 'calculated' && !eligible) nextErrors.eligible = 'Confirm eligibility or choose manual targets.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ birthDate, heightCm: Number(height), equationSex, activityLevel, goal, targetMode });
  }

  return <form className="body-form analytics-card" onSubmit={submit} noValidate>
    <div><p className="eyebrow">Personal inputs</p><h2>Body profile</h2><p className="muted">Used only on this device to estimate energy needs. Estimates are not medical advice.</p></div>
    <div className="body-form-grid">
      <label>Birth date<input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />{errors.birthDate && <span className="field-error">{errors.birthDate}</span>}</label>
      <label>Height in centimeters<input type="number" inputMode="decimal" value={height} onChange={(event) => setHeight(event.target.value)} />{errors.heightCm && <span className="field-error">{errors.heightCm}</span>}</label>
      <SelectControl label="Equation sex" value={equationSex} onChange={(value) => setEquationSex(value as BodyProfile['equationSex'])} options={[{ value: 'female', label: 'Female equation' }, { value: 'male', label: 'Male equation' }]} help="Required by the selected energy equation, not an identity field." />
      <SelectControl label="Activity level" value={activityLevel} onChange={(value) => setActivityLevel(value as BodyProfile['activityLevel'])} options={[{ value: 'sedentary', label: 'Sedentary' }, { value: 'light', label: 'Lightly active' }, { value: 'moderate', label: 'Moderately active' }, { value: 'veryActive', label: 'Very active' }]} />
      <SelectControl label="Goal" value={goal} onChange={(value) => setGoal(value as BodyProfile['goal'])} options={[{ value: 'lose', label: 'Gradual loss' }, { value: 'maintain', label: 'Maintain' }, { value: 'gain', label: 'Gradual gain' }]} />
      <SelectControl label="Target method" value={targetMode} onChange={(value) => setTargetMode(value as BodyProfile['targetMode'])} options={[{ value: 'calculated', label: 'Show an estimate' }, { value: 'manual', label: 'Manual targets only' }]} />
    </div>
    {targetMode === 'calculated' && <label className="eligibility-check"><input type="checkbox" checked={eligible} onChange={(event) => setEligible(event.target.checked)} />I confirm I am an eligible adult: age 18 or older, not pregnant or breastfeeding, and not following a clinician-directed diet.<span className="sr-only">Eligible adult</span></label>}
    {errors.eligible && <p className="field-error">{errors.eligible}</p>}
    <div className="form-actions"><button className="primary-action" type="submit">Save profile</button><button className="text-action" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
