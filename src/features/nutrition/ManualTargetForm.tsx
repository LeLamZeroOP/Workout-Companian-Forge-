import { useState, type FormEvent } from 'react';
import type { NutritionTarget } from '../../domain/models';

interface ManualTargetFormProps {
  effectiveFrom: string;
  activeTarget: NutritionTarget | null;
  onSave: (target: NutritionTarget) => void;
  onCancel: () => void;
}

export function ManualTargetForm({ effectiveFrom, activeTarget, onSave, onCancel }: ManualTargetFormProps) {
  const [calories, setCalories] = useState(activeTarget ? String(activeTarget.caloriesKcal) : '');
  const [protein, setProtein] = useState(activeTarget ? String(activeTarget.proteinG) : '');
  const [carbs, setCarbs] = useState(activeTarget ? String(activeTarget.carbsG) : '');
  const [fat, setFat] = useState(activeTarget ? String(activeTarget.fatG) : '');
  const [error, setError] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = [calories, protein, carbs, fat];
    const numbers = values.map(Number);
    if (values.some((value) => value.trim() === '') || numbers.some((value) => !Number.isFinite(value) || value < 0) || numbers[0]! <= 0) {
      setError(true);
      return;
    }
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

  return <form className="body-form analytics-card" onSubmit={submit} noValidate>
    <div><p className="eyebrow">Nutrition</p><h2>Daily target</h2><p className="muted">Set your own target starting {effectiveFrom}. It stays active until you save another one.</p></div>
    <div className="body-form-grid">
      <label>Calories per day<input type="number" inputMode="decimal" min="1" value={calories} onChange={(event) => setCalories(event.target.value)} /></label>
      <label>Protein in grams<input type="number" inputMode="decimal" min="0" value={protein} onChange={(event) => setProtein(event.target.value)} /></label>
      <label>Carbs in grams<input type="number" inputMode="decimal" min="0" value={carbs} onChange={(event) => setCarbs(event.target.value)} /></label>
      <label>Fat in grams<input type="number" inputMode="decimal" min="0" value={fat} onChange={(event) => setFat(event.target.value)} /></label>
    </div>
    {error && <p className="field-error" role="alert">Enter valid calories and macro grams.</p>}
    <div className="form-actions"><button className="primary-action" type="submit">Save target</button><button className="text-action" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
