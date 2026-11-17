import { useState } from 'react';
import { ArchiveRestore, Star } from 'lucide-react';
import type { FoodDefinition } from '../../domain/models';

export function MyFoods({ foods, onSave, onEdit, onCreate }: { foods: FoodDefinition[]; onSave: (food: FoodDefinition) => void; onEdit: (food: FoodDefinition) => void; onCreate: () => void }) {
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState('');
  const mine = foods.filter(food => food.source === 'custom');
  const visible = mine.filter(food => Boolean(food.archived) === archived);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = visible.filter(food => {
    const text = [food.name, food.brand, food.category, food.preparation].filter(Boolean).join(' ').toLowerCase();
    return terms.every(term => text.includes(term));
  }).sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || a.name.localeCompare(b.name));

  return <section className="analytics-card foods-library" aria-labelledby="my-foods-heading">
    <div className="section-heading"><h2 id="my-foods-heading">My foods</h2><button className="secondary-action" type="button" onClick={onCreate}>Create my food</button></div>
    <p>Your reusable foods. Editing or archiving a food leaves previous meals unchanged.</p>
    <div className="food-filters" aria-label="My foods filters">
      <button type="button" aria-pressed={!archived} onClick={() => setArchived(false)}>Available foods ({mine.filter(food => !food.archived).length})</button>
      <button type="button" aria-pressed={archived} onClick={() => setArchived(true)}>Archived foods ({mine.filter(food => food.archived).length})</button>
    </div>
    <label className="field">Search my foods<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, brand or category" /></label>
    <div className="my-foods-list">{matches.map(food => <div className="food-row" key={food.id}>
      <div><strong>{food.name}</strong><span>{[food.brand, food.preparation, food.category].filter(Boolean).join(' · ')}</span></div>
      <div className="form-actions">
        {archived ? <button className="secondary-action" type="button" aria-label={`Restore ${food.name}`} onClick={() => onSave({ ...food, archived: false })}><ArchiveRestore size={16} aria-hidden="true" />Restore</button> : <>
          <button className="text-action" type="button" aria-label={`Edit ${food.name}`} onClick={() => onEdit(food)}>Edit</button>
          <button className="text-action" type="button" aria-label={`Favorite ${food.name}`} aria-pressed={Boolean(food.favorite)} onClick={() => onSave({ ...food, favorite: !food.favorite })}><Star size={16} fill={food.favorite ? 'currentColor' : 'none'} aria-hidden="true" />Favorite</button>
          <button className="text-action" type="button" aria-label={`Archive ${food.name}`} onClick={() => onSave({ ...food, archived: true })}>Archive</button>
        </>}
      </div>
    </div>)}</div>
    {!matches.length && <p role="status" className="muted">{query.trim() ? 'No foods match this search.' : archived ? 'No archived foods. Archived items can be restored here.' : 'No custom foods yet. Create a food from its label or a named portion.'}</p>}
  </section>;
}
