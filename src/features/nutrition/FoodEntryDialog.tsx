import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { FoodDefinition, FoodLogEntry } from '../../domain/models';
import { createFoodLogEntry, scaleNutrients } from '../../domain/nutrition';
import { FoodSearch } from './FoodSearch';

export function FoodEntryDialog({ foods, meal, localDate, onAdd, onClose }: { foods: FoodDefinition[]; meal: FoodLogEntry['meal']; localDate: string; onAdd: (entry: FoodLogEntry) => void; onClose: () => void }) {
  const [selected, setSelected] = useState<FoodDefinition | null>(null);
  const [grams, setGrams] = useState('100');
  const dialogRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const preview = selected ? scaleNutrients(selected.nutrientsPer100g, Number(grams) || 0) : null;
  const mealLabel = meal[0]!.toUpperCase() + meal.slice(1);
  useEffect(() => {
    const returnFocus = returnFocusRef.current;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('keydown', closeOnEscape); returnFocus?.focus(); };
  }, [onClose]);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className="food-dialog" role="dialog" aria-modal="true" aria-labelledby="food-dialog-title" onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className="dialog-heading"><div><p className="eyebrow">{mealLabel}</p><h2 id="food-dialog-title">{selected ? selected.name : 'Add food'}</h2></div><button className="icon-button" type="button" aria-label="Close food dialog" onClick={onClose}><X size={17} aria-hidden="true" /></button></div>
      {!selected ? <FoodSearch foods={foods} onSelect={(food) => { setSelected(food); setGrams(String(food.servings[0]?.grams ?? 100)); }} /> : <div className="amount-step">
        <p className="muted">{selected.preparation} · nutrition is scaled from USDA or your saved label.</p>
        <div className="serving-chips">{selected.servings.map((serving) => { const isSelected = Number(grams) === serving.grams; return <button type="button" key={serving.name} className={isSelected ? 'selected' : ''} aria-pressed={isSelected} onClick={() => setGrams(String(serving.grams))}>{serving.name}<small>{serving.grams} g</small></button>; })}</div>
        <label>Amount in grams<input type="number" inputMode="decimal" min="0.1" value={grams} onChange={(event) => setGrams(event.target.value)} /></label>
        {preview && <div className="amount-preview"><strong>{Math.round(preview.caloriesKcal)} kcal</strong><span>{Math.round(preview.proteinG)}g protein</span><span>{Math.round(preview.carbsG)}g carbs</span><span>{Math.round(preview.fatG)}g fat</span></div>}
        <div className="form-actions"><button className="primary-action" type="button" disabled={!Number.isFinite(Number(grams)) || Number(grams) <= 0} onClick={() => { onAdd(createFoodLogEntry(selected, Number(grams), meal, localDate)); onClose(); }}>Add to {meal}</button><button className="text-action" type="button" onClick={() => setSelected(null)}>Back to search</button></div>
      </div>}
    </section>
  </div>;
}
