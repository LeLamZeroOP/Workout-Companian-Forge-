import { OverlayPresence } from '../../components/OverlayPresence';
import { EditDiaryEntry } from './EditDiaryEntry';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Utensils } from 'lucide-react';
import type { FoodDefinition, FoodLogEntry, NutritionTarget } from '../../domain/models';
import { entriesForDate, getDiaryTotal, getEffectiveTarget, groupEntriesByMeal, mealOrder } from '../../domain/foodDiary';
import { formatMacro, incompleteMacros } from '../../domain/nutrition';
import { CustomFoodForm } from './CustomFoodForm';
import { FoodEntryDialog } from './FoodEntryDialog';
import { MacroSummary } from './MacroSummary';
import { ManualTargetForm } from './ManualTargetForm';
import { isCalendarDate, localDateString } from '../../domain/calendar';
import { canonical } from '../../domain/canonical';
import { CsvExportButton } from '../../components/CsvExportButton';
import { foodDiaryCsv } from '../../domain/recordExports';
import { MyFoods } from './MyFoods';

const localIsoDate = localDateString;
const shiftDate = (value: string, days: number) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + days); const shifted = localIsoDate(date); return isCalendarDate(shifted) ? shifted : value; };

export interface NutritionPageProps { foods: FoodDefinition[]; entries: FoodLogEntry[]; targets: NutritionTarget[]; onCopyEntries?: (entries: FoodLogEntry[]) => boolean | void; onAddEntry: (entry: FoodLogEntry) => boolean | void; onDeleteEntry: (id: string) => boolean | void; onSaveCustomFood: (food: FoodDefinition) => boolean | void; onSaveNutritionTarget?: (target: NutritionTarget) => boolean | void; date?: string }

export function NutritionPage({ foods, entries, targets, onAddEntry, onCopyEntries, onDeleteEntry, onSaveCustomFood, onSaveNutritionTarget, date }: NutritionPageProps) {
  const [selectedDate, setSelectedDate] = useState(date ?? localIsoDate(new Date()));
  const [addingMeal, setAddingMeal] = useState<FoodLogEntry['meal'] | null>(null);
  const [creatingFood, setCreatingFood] = useState(false); const [editingFood, setEditingFood] = useState<FoodDefinition | undefined>(); const [myFoods, setMyFoods] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodLogEntry | null>(null);
  const [copySource, setCopySource] = useState<FoodLogEntry[] | null>(null);
  const [copyDate, setCopyDate] = useState('');
  const [copyPreview, setCopyPreview] = useState<FoodLogEntry[] | null>(null);
  const [notice, setNotice] = useState('');
  const [deletedEntry, setDeletedEntry] = useState<FoodLogEntry | null>(null);
  const recentFoodIds = [...new Set([...entries].reverse().sort((a,b) => b.localDate.localeCompare(a.localDate)).map(entry => entry.foodId).filter((id): id is string => Boolean(id)))].slice(0, 12);
  const dayEntries = entriesForDate(entries, selectedDate);
  const grouped = groupEntriesByMeal(dayEntries);
  const total = getDiaryTotal(dayEntries);
  const target = getEffectiveTarget(targets, selectedDate);
  const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const entryConflict = editingEntry !== null && canonical(entries.find(item => item.id === editingEntry.id) ?? null) !== canonical(editingEntry);
  const foodConflict = editingFood !== undefined && canonical(foods.find(item => item.id === editingFood.id) ?? null) !== canonical(editingFood);
  if (editingEntry) return <>{entryConflict && <p className="error-banner" role="alert">This entry changed elsewhere. Your draft is still open. Cancel and reopen it before editing.</p>}<EditDiaryEntry saveDisabled={entryConflict} entry={editingEntry} onSave={entry => { if (!entryConflict && onAddEntry(entry) !== false) setEditingEntry(null); }} onCancel={() => setEditingEntry(null)} /></>;
  if (creatingFood) return <>{foodConflict && <p className="error-banner" role="alert">This food changed elsewhere. Your draft is still open. Cancel and reopen it before editing.</p>}<CustomFoodForm saveDisabled={foodConflict} initial={editingFood} onSave={(food) => { if (foodConflict) return; if (onSaveCustomFood(food) === false) return; setCreatingFood(false); setEditingFood(undefined); }} onCancel={() => { setCreatingFood(false); setEditingFood(undefined); }} /></>;
  if (editingTarget && onSaveNutritionTarget) return <ManualTargetForm effectiveFrom={selectedDate} activeTarget={target} onSave={(next) => { if (onSaveNutritionTarget(next) !== false) setEditingTarget(false); }} onCancel={() => setEditingTarget(false)} />;
  return <section className="analytics-stack nutrition-page">
    <div className="nutrition-toolbar"><div><p className="eyebrow">Daily diary</p><h2>{dateLabel}</h2></div><div className="date-switcher"><button className="icon-button" type="button" aria-label="Previous day" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}><ChevronLeft size={17} /></button><label className="diary-date-picker" title="Choose a date"><span className="sr-only">Diary date</span><CalendarDays size={18} aria-hidden="true" /><input type="date" value={selectedDate} onClick={event => { try { event.currentTarget.showPicker?.(); } catch { /* Typing the date still works. */ } }} onChange={(event) => { if (isCalendarDate(event.target.value)) setSelectedDate(event.target.value); }} /></label><button className="icon-button" type="button" aria-label="Next day" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}><ChevronRight size={17} /></button><button className="secondary-action" type="button" onClick={() => setSelectedDate(localIsoDate(new Date()))}>Today</button><button className="secondary-action" type="button" onClick={() => setCreatingFood(true)}>Create food</button><button className="secondary-action" type="button" aria-pressed={myFoods} onClick={() => setMyFoods(!myFoods)}>My foods</button></div></div>
    {myFoods && <MyFoods foods={foods} onSave={onSaveCustomFood} onCreate={() => setCreatingFood(true)} onEdit={food => { setEditingFood(food); setCreatingFood(true); }} />}
    {notice && <p role="status">{notice}</p>}
    {deletedEntry && !entries.some(entry => entry.id === deletedEntry.id) && <div className="diary-undo" role="status"><span>Removed {deletedEntry.foodName} from {deletedEntry.localDate}.</span><button type="button" className="secondary-action" onClick={() => { if (onAddEntry(deletedEntry) !== false) setDeletedEntry(null); }}>Undo deletion</button><button type="button" className="text-action" onClick={() => setDeletedEntry(null)}>Dismiss</button></div>}
    <MacroSummary total={total} target={target} incomplete={incompleteMacros(dayEntries)}>
      {!target && <p className="nutrition-hint">No nutrition target is active for this date. Your food totals still work.</p>}{onSaveNutritionTarget && <button className="secondary-action" type="button" onClick={() => setEditingTarget(true)}>{target ? 'Edit target' : 'Set manual target'}</button>}
    </MacroSummary>
    <div className="section-heading diary-day-heading"><h3>Meals<small>{dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}</small></h3>{dayEntries.length > 0 && <div className="card-actions">{onCopyEntries && <button type="button" className="secondary-action" onClick={() => { setCopySource(structuredClone(dayEntries)); setCopyDate(shiftDate(selectedDate,1)); }}>Copy day</button>}<CsvExportButton label="Export day CSV" fileName={`forge-diary-${selectedDate}.csv`} buildCsv={() => foodDiaryCsv(dayEntries)} /></div>}</div>
    {copySource && <form className="analytics-card copy-panel" onSubmit={event => { event.preventDefault(); if (isCalendarDate(copyDate)) setCopyPreview(copySource.map(entry => ({ ...entry, id: crypto.randomUUID(), localDate: copyDate }))); }}><h3>Copy {copySource.length} food entries</h3><p>{copySource.map(entry => entry.foodName).join(', ')} · {Math.round(getDiaryTotal(copySource).caloriesKcal)} kcal</p><label>Copy to date<input type="date" required value={copyDate} onChange={event => setCopyDate(event.target.value)} /></label><p>Meals and saved nutrition stay the same. Existing destination entries are kept.</p><div className="form-actions"><button className="primary-action" disabled={!isCalendarDate(copyDate)}>Review copy</button><button type="button" className="secondary-action" onClick={() => setCopySource(null)}>Cancel copy</button></div></form>}
    <OverlayPresence>{copyPreview && <ConfirmDialog confirmTone="primary" title="Add copied entries?" message={`Add ${copyPreview.length} entries to ${copyDate}. ${entriesForDate(entries,copyDate).length} entries already exist on that date. This adds another copy; it does not replace them.`} confirmLabel="Confirm copy" onCancel={() => setCopyPreview(null)} onConfirm={() => { if (onCopyEntries?.(copyPreview) === false) return; setNotice(`${copyPreview.length} copied entries submitted for ${copyDate}. Check save status above.`); setCopyPreview(null); setCopySource(null); }} />}</OverlayPresence>
    <div className="meal-grid">{mealOrder.map((meal) => <section className="meal-card" key={meal}><div className="section-heading"><div><h3>{meal[0]!.toUpperCase() + meal.slice(1)}</h3></div><button className="text-action" type="button" aria-label={`Add ${meal}`} onClick={() => setAddingMeal(meal)}><Plus size={16} />Add</button></div>
      {onCopyEntries && grouped[meal].length > 0 && <button className="text-action" type="button" onClick={() => { setCopySource(structuredClone(grouped[meal])); setCopyDate(shiftDate(selectedDate,1)); }}>Copy {meal}</button>}<div className="meal-entries">{grouped[meal].map((entry) => <div className="food-row" key={entry.id}><div><strong>{entry.foodName}</strong><span>{entry.servingDescription} · {formatMacro(entry.nutrients.proteinG)} protein</span></div><span>{Math.round(entry.nutrients.caloriesKcal)} kcal</span><button className="text-action" type="button" aria-label={`Edit entry ${entry.foodName}`} onClick={() => setEditingEntry(entry)}>Edit</button><button className="icon-button danger-icon" type="button" aria-label={`Delete ${entry.foodName}`} onClick={() => { setDeletedEntry(structuredClone(entry)); onDeleteEntry(entry.id); }}><Trash2 size={15} /></button></div>)}
      {!grouped[meal].length && <button className="empty-meal" type="button" aria-label={`Log first ${meal} food`} onClick={() => setAddingMeal(meal)}><Utensils size={18} aria-hidden="true" /><span>Add your first food</span></button>}</div></section>)}</div>
    <p className="source-note">Common food nutrition: USDA FoodData Central, values per 100 g. Custom foods use the label values you enter.</p>
    <OverlayPresence>{addingMeal && <FoodEntryDialog recentFoodIds={recentFoodIds} onSaveFood={onSaveCustomFood} foods={foods} meal={addingMeal} localDate={selectedDate} onAdd={onAddEntry} onClose={() => setAddingMeal(null)} />}</OverlayPresence>
  </section>;
}
