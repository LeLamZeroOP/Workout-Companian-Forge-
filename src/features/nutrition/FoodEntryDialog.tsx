import { useState } from 'react';
import { DialogSurface } from '../../components/DialogSurface';
import type { FoodDefinition, FoodLogEntry } from '../../domain/models';
import { createFoodLogEntry, formatMacro, scaleNutrients, storableNutrients } from '../../domain/nutrition';
import { isCalendarDate } from '../../domain/calendar';
import { FoodSearch } from './FoodSearch';
import { CustomFoodForm } from './CustomFoodForm';
import { ValidatedField } from '../../components/ValidatedField';

export function FoodEntryDialog({ foods, meal, localDate, onAdd, onClose, onSaveFood, recentFoodIds = [] }: { recentFoodIds?: string[]; foods: FoodDefinition[]; meal: FoodLogEntry['meal']; localDate: string; onAdd: (entry: FoodLogEntry) => boolean | void; onClose: () => void; onSaveFood?: (food: FoodDefinition) => boolean | void }) {
  const [selected, setSelected] = useState<FoodDefinition | null>(null);
  const [creating, setCreating] = useState(false);
  const [amount, setAmount] = useState('100');
  const numericAmount = Number(amount);
  const validAmount = Number.isFinite(numericAmount) && numericAmount >= 0.001 && numericAmount <= 100000;
  const preview = selected && validAmount ? scaleNutrients(selected.nutrientsPer100g ?? selected.portion!.nutrients, numericAmount * (selected.portion ? 100 : 1)) : null;
  const validSnapshot = preview !== null && storableNutrients(preview) && isCalendarDate(localDate);
  const mealLabel = meal[0]!.toUpperCase() + meal.slice(1);
  function select(food: FoodDefinition) { setSelected(food); setAmount(food.portion ? '1' : String(food.servings[0]?.grams ?? 100)); }
  return <DialogSurface title={creating ? 'My foods' : selected ? selected.name : 'Add food'} eyebrow={mealLabel} closeLabel="Close food dialog" onClose={onClose} className="food-dialog" focusKey={creating ? 'create' : selected?.id ?? 'search'}>
      {creating && onSaveFood ? <CustomFoodForm onSave={(food) => { if (onSaveFood(food) === false) return; setCreating(false); select(food); }} onCancel={() => setCreating(false)} /> : !selected ? <>{onSaveFood && <button className="secondary-action" type="button" onClick={() => setCreating(true)}>Create my food</button>}<FoodSearch recentFoodIds={recentFoodIds} foods={foods} onSelect={select} /></> : <div className="amount-step">
        <p className="muted">{selected.preparation} · {selected.source === 'custom' ? 'My foods' : 'USDA'}</p>
        {!selected.portion && <div className="serving-chips">{selected.servings.map((serving) => <button type="button" key={serving.name} className={numericAmount === serving.grams ? 'selected' : ''} aria-pressed={numericAmount === serving.grams} onClick={() => setAmount(String(serving.grams))}>{serving.name}<small>{serving.grams} g</small></button>)}</div>}
        <ValidatedField label={selected.portion ? `Number of portions (${selected.portion.name})` : 'Amount in grams'} error={!validAmount ? 'Enter an amount from 0.001 to 100,000.' : preview && !storableNutrients(preview) ? 'This amount exceeds the supported nutrient range. Use a smaller amount.' : undefined} type="number" inputMode="decimal" step="any" min="0.001" max="100000" value={amount} onChange={(event) => setAmount(event.target.value)} />
        {preview && <div className="amount-preview"><strong>{Math.round(preview.caloriesKcal)} kcal</strong><span>{formatMacro(preview.proteinG)} protein</span><span>{formatMacro(preview.carbsG)} carbs</span><span>{formatMacro(preview.fatG)} fat</span></div>}
        <div className="form-actions"><button className="primary-action" type="button" disabled={!validSnapshot} onClick={() => { if (onAdd(createFoodLogEntry(selected, numericAmount, meal, localDate)) !== false) onClose(); }}>Add to {meal}</button><button className="text-action" type="button" onClick={() => setSelected(null)}>Back to search</button></div>
      </div>}
  </DialogSurface>;
}
