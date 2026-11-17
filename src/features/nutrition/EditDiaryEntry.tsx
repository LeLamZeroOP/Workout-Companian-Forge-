import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { useState } from 'react';
import { ValidatedField } from '../../components/ValidatedField';
import type { FoodLogEntry } from '../../domain/models';
import { resizeFoodEntry } from '../../domain/nutrition';
import { mealOrder } from '../../domain/foodDiary';
import { SelectControl } from '../../components/SelectControl';
import { isCalendarDate } from '../../domain/calendar';

export function EditDiaryEntry({ entry, onSave, onCancel, saveDisabled = false }: { saveDisabled?: boolean; entry: FoodLogEntry; onSave: (entry: FoodLogEntry) => void; onCancel: () => void }) {
  const [amount, setAmount] = useState(String(entry.grams ?? entry.portionQuantity ?? 1));
  const [date, setDate] = useState(entry.localDate);
  const [meal, setMeal] = useState(entry.meal);
  const resizable = Boolean(entry.grams ?? entry.portionQuantity);
  const valid = isCalendarDate(date) && Number.isFinite(Number(amount)) && Number(amount) >= 0.001 && Number(amount) <= 100000;
  let next: FoodLogEntry | null = null;
  let error = '';
  if (valid) {
    try { next = { ...(resizable ? resizeFoodEntry(entry, Number(amount)) : entry), localDate: date, meal }; }
    catch (reason) { error = reason instanceof Error ? reason.message : 'This amount could not be saved.'; }
  }
  const formRef = useUnsavedForm([amount, date, meal]);
  return <form ref={formRef} noValidate className="editor-form" onSubmit={event => { event.preventDefault(); if (next && !saveDisabled) onSave(next); }}><p className="eyebrow">Edit diary entry</p><h2>{entry.foodName}</h2><p>Nutrition is scaled from the values saved with this meal. Later catalog changes do not affect it.</p><ValidatedField label={entry.grams !== null ? 'Amount in grams' : 'Number of portions'} error={resizable && (!Number.isFinite(Number(amount)) || Number(amount) < .001 || Number(amount) > 100000) ? 'Enter an amount from 0.001 to 100,000.' : error || undefined} type="number" inputMode="decimal" step="any" min="0.001" max="100000" disabled={!resizable} value={amount} onChange={event => setAmount(event.target.value)} />{!resizable && <p>This older entry has no portion quantity. Its recorded nutrients are kept unchanged.</p>}<ValidatedField label="Entry date" error={!isCalendarDate(date) ? 'Choose a valid date.' : undefined} type="date" required value={date} onChange={event => setDate(event.target.value)} /><SelectControl label="Meal" value={meal} onChange={value => setMeal(value as FoodLogEntry['meal'])} options={mealOrder.map(value => ({ value, label: value }))} />{next && <p aria-live="polite">Preview: {Math.round(next.nutrients.caloriesKcal)} kcal · {next.servingDescription}</p>}<div className="form-actions"><button className="primary-action" disabled={!next || saveDisabled}>Save entry</button><button type="button" className="secondary-action" onClick={onCancel}>Cancel</button></div></form>;
}
