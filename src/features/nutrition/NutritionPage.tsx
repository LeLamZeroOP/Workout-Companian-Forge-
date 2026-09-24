import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Utensils } from 'lucide-react';
import type { FoodDefinition, FoodLogEntry, NutritionTarget } from '../../domain/models';
import { entriesForDate, getDiaryTotal, getEffectiveTarget, groupEntriesByMeal, mealOrder } from '../../domain/foodDiary';
import { CustomFoodForm } from './CustomFoodForm';
import { FoodEntryDialog } from './FoodEntryDialog';
import { MacroSummary } from './MacroSummary';

const localIsoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const shiftDate = (value: string, days: number) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + days); return localIsoDate(date); };

export interface NutritionPageProps { foods: FoodDefinition[]; entries: FoodLogEntry[]; targets: NutritionTarget[]; onAddEntry: (entry: FoodLogEntry) => void; onDeleteEntry: (id: string) => void; onSaveCustomFood: (food: FoodDefinition) => void; date?: string }

export function NutritionPage({ foods, entries, targets, onAddEntry, onDeleteEntry, onSaveCustomFood, date }: NutritionPageProps) {
  const [selectedDate, setSelectedDate] = useState(date ?? localIsoDate(new Date()));
  const [addingMeal, setAddingMeal] = useState<FoodLogEntry['meal'] | null>(null);
  const [creatingFood, setCreatingFood] = useState(false);
  const dayEntries = entriesForDate(entries, selectedDate);
  const grouped = groupEntriesByMeal(dayEntries);
  const total = getDiaryTotal(dayEntries);
  const target = getEffectiveTarget(targets, selectedDate);
  const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  if (creatingFood) return <CustomFoodForm onSave={(food) => { onSaveCustomFood(food); setCreatingFood(false); }} onCancel={() => setCreatingFood(false)} />;
  return <section className="analytics-stack nutrition-page">
    <div className="nutrition-toolbar"><div><p className="eyebrow">Daily diary</p><h2>{dateLabel}</h2></div><div className="date-switcher"><button className="icon-button" type="button" aria-label="Previous day" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}><ChevronLeft size={17} /></button><label><span className="sr-only">Diary date</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></label><button className="icon-button" type="button" aria-label="Next day" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}><ChevronRight size={17} /></button><button className="secondary-action" type="button" onClick={() => setCreatingFood(true)}>Create food</button></div></div>
    <MacroSummary total={total} target={target} />
    {!target && <p className="nutrition-hint">No nutrition target is active for this date. Your food totals still work; set a target from your body estimate in a later step.</p>}
    <div className="meal-grid">{mealOrder.map((meal) => <section className="meal-card" key={meal}><div className="section-heading"><div><p className="eyebrow">Meal</p><h3>{meal[0]!.toUpperCase() + meal.slice(1)}</h3></div><button className="text-action" type="button" aria-label={`Add ${meal}`} onClick={() => setAddingMeal(meal)}><Plus size={16} />Add</button></div>
      <div className="meal-entries">{grouped[meal].map((entry) => <div className="food-row" key={entry.id}><div><strong>{entry.foodName}</strong><span>{entry.servingDescription} · {Math.round(entry.nutrients.proteinG)}g protein</span></div><span>{Math.round(entry.nutrients.caloriesKcal)} kcal</span><button className="icon-button danger-icon" type="button" aria-label={`Delete ${entry.foodName}`} onClick={() => onDeleteEntry(entry.id)}><Trash2 size={15} /></button></div>)}
      {!grouped[meal].length && <button className="empty-meal" type="button" aria-label={`Log first ${meal} food`} onClick={() => setAddingMeal(meal)}><Utensils size={18} aria-hidden="true" /><span>Add your first food</span></button>}</div></section>)}</div>
    <p className="source-note">Common food nutrition: USDA FoodData Central, values per 100 g. Custom foods use the label values you enter.</p>
    {addingMeal && <FoodEntryDialog foods={foods} meal={addingMeal} localDate={selectedDate} onAdd={onAddEntry} onClose={() => setAddingMeal(null)} />}
  </section>;
}
