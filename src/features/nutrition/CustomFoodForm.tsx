import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { ValidatedField } from '../../components/ValidatedField';
import { useValidationFocus } from '../../hooks/useValidationFocus';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import { useState, type FormEvent } from 'react';
import type { FoodDefinition, Nutrients } from '../../domain/models';
import { scaleNutrients, validateFood } from '../../domain/nutrition';

export function CustomFoodForm({ initial, onSave, onCancel, saveDisabled = false }: { saveDisabled?: boolean; initial?: FoodDefinition; onSave: (food: FoodDefinition) => void; onCancel: () => void }) {
  const initialGrams = initial?.servings[0]?.grams ?? 100;
  const initialValues = initial?.portion?.nutrients ?? (initial?.nutrientsPer100g ? scaleNutrients(initial.nutrientsPer100g, initialGrams) : null);
  const [basis, setBasis] = useState<'grams' | '100g' | 'portion'>(initial?.portion ? 'portion' : 'grams');
  const [values, setValues] = useState({ name: initial?.name ?? '', brand: initial?.brand ?? '', category: initial?.category ?? 'Other', preparation: initial?.preparation ?? 'As entered', servingName: initial?.portion?.name ?? initial?.servings[0]?.name ?? '1 serving', servingGrams: initial ? String(initialGrams) : '', calories: initialValues ? String(initialValues.caloriesKcal) : '', protein: initialValues?.proteinG == null ? '' : String(initialValues.proteinG), carbs: initialValues?.carbsG == null ? '' : String(initialValues.carbsG), fat: initialValues?.fatG == null ? '' : String(initialValues.fatG), fiber: initialValues?.fiberG == null ? '' : String(initialValues.fiberG), sodium: initialValues?.sodiumMg == null ? '' : String(initialValues.sodiumMg) });
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useValidationFocus(fieldErrors);
  useUnsavedForm([basis, values], formRef);
  const [reviewedWarning, setReviewedWarning] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const change = (key: keyof typeof values, value: string) => { setValues((current) => ({ ...current, [key]: value })); setReviewedWarning(false); };

  function submit(event: FormEvent) {
    event.preventDefault(); if (saveDisabled) return;
    const grams = basis === '100g' ? 100 : Number(values.servingGrams);
    const optional = (value: string) => value.trim() === '' ? null : Number(value);
    const entered: Nutrients = { caloriesKcal: values.calories.trim() === '' ? NaN : Number(values.calories), proteinG: optional(values.protein), carbsG: optional(values.carbs), fatG: optional(values.fat), fiberG: optional(values.fiber), sodiumMg: optional(values.sodium) };
    const normalized = Object.fromEntries(Object.entries(entered).map(([key, value]) => [key, value === null ? null : value * (grams > 0 ? 100 / grams : 0)])) as unknown as Nutrients;
    const food: FoodDefinition = {
      ...initial, id: initial?.id ?? `custom-${crypto.randomUUID()}`, name: values.name.trim(), brand: values.brand.trim() || null, category: values.category.trim(), preparation: values.preparation.trim(), source: 'custom', sourceId: null, dataVersion: 'user-entered-v2',
      nutrientsPer100g: basis === 'portion' ? null : normalized,
      ...(basis === 'portion' ? { portion: { name: values.servingName.trim(), nutrients: entered } } : { portion: undefined }),
      servings: basis === 'portion' ? [] : grams > 0 ? [{ name: basis === '100g' ? '100 g' : values.servingName.trim() || '1 serving', grams }] : [],
    };
    const result = validateFood(food);
    if (!Number.isFinite(entered.caloriesKcal)) result.errors.push('Enter calories for this portion.');
    // Validate the original values too: a zero conversion factor must not hide negatives.
    if (Object.values(entered).some((value) => value !== null && (!Number.isFinite(value) || value < 0))) result.errors.push('Enter finite, non-negative nutrient values.');
    const nextErrors: Record<string, string> = {};
    if (!food.name) nextErrors.name = 'Enter a food name.';
    if (!food.category) nextErrors.category = 'Enter a category.';
    if (basis === 'grams' && (!Number.isFinite(grams) || grams < .001 || grams > 100000)) nextErrors.servingGrams = 'Serving weight must be greater than zero (0.001–100,000 g).';
    if (basis === 'portion' && !values.servingName.trim()) nextErrors.servingName = 'Enter a portion name.';
    const nutrientKeys = { calories: 'caloriesKcal', protein: 'proteinG', carbs: 'carbsG', fat: 'fatG', fiber: 'fiberG', sodium: 'sodiumMg' } as const;
    for (const [field, key] of Object.entries(nutrientKeys)) {
      const amount = entered[key as keyof Nutrients];
      const stored = basis === 'portion' ? amount : normalized[key as keyof Nutrients];
      if (amount !== null && (!Number.isFinite(amount) || amount < 0 || stored !== null && (!Number.isFinite(stored) || stored > 1_000_000))) nextErrors[field] = field === 'calories' && !values.calories.trim() ? 'Enter calories for this portion.' : 'Use a finite, non-negative value within the supported nutrient range.';
    }
    setFieldErrors(nextErrors);
    setErrors(Object.keys(nextErrors).length ? [] : result.errors); setWarnings(result.warnings);
    if (result.errors.length) return;
    if (result.warnings.length && !reviewedWarning) { setReviewedWarning(true); return; }
    onSave(food);
  }

  return <form ref={formRef} className="body-form analytics-card" onSubmit={submit} noValidate>
    <div><p className="eyebrow">My foods</p><h2>{initial ? 'Edit my food' : 'Create my food'}</h2><p className="muted">Save your own meal or label. Leave unknown macros blank; calories stay exactly as entered.</p></div>
    <ChoiceGroup label="Nutrition basis" value={basis} onChange={value => { setBasis(value as typeof basis); setReviewedWarning(false); }} options={[{ value: 'grams', label: 'Weighed serving', description: 'You know the gram weight' }, { value: '100g', label: 'Per 100 g', description: 'Copy a nutrition label' }, { value: 'portion', label: 'Named portion', description: 'A slice, bowl or whole meal' }]} />
    <div className="body-form-grid">
      <ValidatedField label="Food name" error={fieldErrors.name} autoFocus maxLength={200} value={values.name} onChange={(e) => change('name', e.target.value)}  />
      <ValidatedField label="Brand, optional" error={fieldErrors.brand} maxLength={200} value={values.brand} onChange={(e) => change('brand', e.target.value)}  />
      <ValidatedField label="Category" error={fieldErrors.category} maxLength={100} value={values.category} onChange={(e) => change('category', e.target.value)}  />
      <ValidatedField label="Preparation" error={fieldErrors.preparation} maxLength={200} value={values.preparation} onChange={(e) => change('preparation', e.target.value)}  />
      {basis !== '100g' && <ValidatedField label="Serving name" error={fieldErrors.servingName} maxLength={100} value={values.servingName} onChange={(e) => change('servingName', e.target.value)}  />}
      {basis === 'grams' && <ValidatedField label="Serving weight in grams" error={fieldErrors.servingGrams} type="number" inputMode="decimal" step="any" min="0.001" value={values.servingGrams} onChange={(e) => change('servingGrams', e.target.value)}  />}
      <ValidatedField label={`Calories ${basis === '100g' ? 'per 100 g' : 'per serving'}`} error={fieldErrors.calories} type="number" inputMode="decimal" step="any" min="0" value={values.calories} onChange={(e) => change('calories', e.target.value)}  />
      {(['protein', 'carbs', 'fat', 'fiber', 'sodium'] as const).map((key) => <ValidatedField key={key} label={`${key[0]!.toUpperCase() + key.slice(1)} ${basis === '100g' ? 'per 100 g' : 'per serving'} in ${key === 'sodium' ? 'milligrams' : 'grams'}, optional`} error={fieldErrors[key]} type="number" inputMode="decimal" step="any" min="0" value={values[key]} onChange={(e) => change(key, e.target.value)}  />)}
    </div>
    {errors.map((error) => <p className="field-error" role="alert" key={error}>{error}</p>)}
    {warnings.map((warning) => <p className="warning-note" key={warning}>{warning} Your entered calories will be preserved.</p>)}
    <div className="form-actions"><button className="primary-action" type="submit" disabled={saveDisabled}>{reviewedWarning ? 'Save entered values' : 'Save custom food'}</button><button className="text-action" type="button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
