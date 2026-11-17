import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { ValidatedField } from '../../components/ValidatedField';
import { useValidationFocus } from '../../hooks/useValidationFocus';
import { useState, type FormEvent } from 'react';
import type { NutritionTarget } from '../../domain/models';
import { isCalendarDate } from '../../domain/calendar';
import { canonical } from '../../domain/canonical';

interface ManualTargetFormProps {
  effectiveFrom: string;
  activeTarget: NutritionTarget | null;
  onSave: (target: NutritionTarget) => void;
  onCancel: () => void;
}

export function ManualTargetForm({ effectiveFrom, activeTarget, onSave, onCancel }: ManualTargetFormProps) {
  const [baseline] = useState(() => canonical([effectiveFrom, activeTarget]));
  const conflict = baseline !== canonical([effectiveFrom, activeTarget]);
  const [calories, setCalories] = useState(activeTarget ? String(activeTarget.caloriesKcal) : '');
  const [protein, setProtein] = useState(activeTarget ? String(activeTarget.proteinG) : '');
  const [carbs, setCarbs] = useState(activeTarget ? String(activeTarget.carbsG) : '');
  const [fat, setFat] = useState(activeTarget ? String(activeTarget.fatG) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useValidationFocus(errors);
  useUnsavedForm([calories, protein, carbs, fat], formRef);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (conflict) return;
    const values = [calories, protein, carbs, fat];
    const numbers = values.map(Number);
    if (!isCalendarDate(effectiveFrom) || values.some((value) => value.trim() === '') || numbers.some((value) => !Number.isFinite(value) || value < 0 || value > 1_000_000) || numbers[0]! < 0.001) {
      const nextErrors: Record<string, string> = {};
      const fields = ['calories', 'protein', 'carbs', 'fat'];
      numbers.forEach((value, index) => { if (!values[index]!.trim() || !Number.isFinite(value) || value < (index === 0 ? 0.001 : 0) || value > 1_000_000) nextErrors[fields[index]!] = index === 0 ? 'Enter calories from 0.001 to 1,000,000.' : 'Enter macro grams from 0 to 1,000,000.'; });
      if (!isCalendarDate(effectiveFrom)) nextErrors.date = 'Choose a valid effective date.';
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onSave({
      id: activeTarget?.effectiveFrom === effectiveFrom ? activeTarget.id : crypto.randomUUID(),
      effectiveFrom,
      mode: 'manual',
      caloriesKcal: numbers[0]!,
      proteinG: numbers[1]!,
      carbsG: numbers[2]!,
      fatG: numbers[3]!,
      formulaVersion: null,
    });
  }

  return <form ref={formRef} className="body-form analytics-card" onSubmit={submit} noValidate>
    <div><p className="eyebrow">Nutrition</p><h2>Daily target</h2><p className="muted">Set your own target starting {effectiveFrom}. It stays active until you save another one.</p></div>
    {conflict && <p className="error-banner" role="alert">This target changed elsewhere. Your draft is still open. Cancel and reopen it before editing.</p>}
    <div className="body-form-grid">
      <ValidatedField label="Calories per day" error={errors.calories} type="number" inputMode="decimal" min="0.001" value={calories} onChange={event => setCalories(event.target.value)} />
      <ValidatedField label="Protein in grams" error={errors.protein} type="number" inputMode="decimal" min="0" value={protein} onChange={event => setProtein(event.target.value)} />
      <ValidatedField label="Carbs in grams" error={errors.carbs} type="number" inputMode="decimal" min="0" value={carbs} onChange={event => setCarbs(event.target.value)} />
      <ValidatedField label="Fat in grams" error={errors.fat} type="number" inputMode="decimal" min="0" value={fat} onChange={event => setFat(event.target.value)} />
    </div>
    {errors.date && <p className="field-error" role="alert">{errors.date}</p>}
    <div className="form-actions"><button className="primary-action" type="submit" disabled={conflict}>Save target</button><button className="text-action" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
