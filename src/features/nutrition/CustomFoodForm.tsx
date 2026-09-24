import { useState, type FormEvent } from 'react';
import type { FoodDefinition } from '../../domain/models';
import { validateFood } from '../../domain/nutrition';

export function CustomFoodForm({ onSave, onCancel }: { onSave: (food: FoodDefinition) => void; onCancel: () => void }) {
  const [values, setValues] = useState({ name: '', brand: '', category: 'Other', preparation: 'As listed', servingName: '1 serving', servingGrams: '', calories: '', protein: '', carbs: '', fat: '', fiber: '', sodium: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const change = (key: keyof typeof values, value: string) => setValues((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const grams = Number(values.servingGrams);
    const factor = grams > 0 ? 100 / grams : 0;
    const optional = (value: string) => value === '' ? null : Number(value) * factor;
    const food: FoodDefinition = {
      id: `custom-${crypto.randomUUID()}`, name: values.name.trim(), brand: values.brand.trim() || null, category: values.category.trim(), preparation: values.preparation.trim(), source: 'custom', sourceId: null, dataVersion: 'user-entered-v1',
      nutrientsPer100g: { caloriesKcal: Number(values.calories) * factor, proteinG: Number(values.protein) * factor, carbsG: Number(values.carbs) * factor, fatG: Number(values.fat) * factor, fiberG: optional(values.fiber), sodiumMg: optional(values.sodium) },
      servings: grams > 0 ? [{ name: values.servingName.trim() || '1 serving', grams }] : [],
    };
    const result = validateFood(food);
    setErrors(result.errors); setWarnings(result.warnings);
    if (!result.errors.length) onSave(food);
  }

  return <form className="body-form analytics-card" onSubmit={submit} noValidate>
    <div><p className="eyebrow">Reusable food</p><h2>Create custom food</h2><p className="muted">Enter values exactly as shown on the package label.</p></div>
    <div className="body-form-grid">
      <label>Food name<input value={values.name} onChange={(e) => change('name', e.target.value)} /></label>
      <label>Brand, optional<input value={values.brand} onChange={(e) => change('brand', e.target.value)} /></label>
      <label>Category<input value={values.category} onChange={(e) => change('category', e.target.value)} /></label>
      <label>Preparation<input value={values.preparation} onChange={(e) => change('preparation', e.target.value)} /></label>
      <label>Serving name<input value={values.servingName} onChange={(e) => change('servingName', e.target.value)} /></label>
      <label>Serving weight in grams<input type="number" inputMode="decimal" value={values.servingGrams} onChange={(e) => change('servingGrams', e.target.value)} /></label>
      <label>Calories per serving<input type="number" inputMode="decimal" value={values.calories} onChange={(e) => change('calories', e.target.value)} /></label>
      <label>Protein per serving in grams<input type="number" inputMode="decimal" value={values.protein} onChange={(e) => change('protein', e.target.value)} /></label>
      <label>Carbs per serving in grams<input type="number" inputMode="decimal" value={values.carbs} onChange={(e) => change('carbs', e.target.value)} /></label>
      <label>Fat per serving in grams<input type="number" inputMode="decimal" value={values.fat} onChange={(e) => change('fat', e.target.value)} /></label>
      <label>Fiber per serving in grams, optional<input type="number" inputMode="decimal" value={values.fiber} onChange={(e) => change('fiber', e.target.value)} /></label>
      <label>Sodium per serving in milligrams, optional<input type="number" inputMode="decimal" value={values.sodium} onChange={(e) => change('sodium', e.target.value)} /></label>
    </div>
    {errors.map((error) => <p className="field-error" key={error}>{error}</p>)}
    {warnings.map((warning) => <p className="warning-note" key={warning}>{warning}</p>)}
    <div className="form-actions"><button className="primary-action" type="submit">Save custom food</button><button className="text-action" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
