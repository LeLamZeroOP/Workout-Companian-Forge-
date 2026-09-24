import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { FoodDefinition } from '../../domain/models';
import { searchFoods } from '../../domain/nutrition';

export function FoodSearch({ foods, onSelect }: { foods: FoodDefinition[]; onSelect: (food: FoodDefinition) => void }) {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => searchFoods(foods, query).slice(0, 24), [foods, query]);
  return <div className="food-search">
    <label className="search-field"><span className="sr-only">Search foods</span><Search size={18} aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chicken, rice, yogurt…" /></label>
    <div className="food-results" role="list">
      {matches.map((food) => <button type="button" key={food.id} onClick={() => onSelect(food)}>
        <span><strong>{food.name}</strong><small>{food.preparation} · {food.category}</small></span>
        <span className="food-kcal">{Math.round(food.nutrientsPer100g.caloriesKcal)} kcal<small>per 100 g</small></span>
      </button>)}
      {!matches.length && <p className="muted">No foods match “{query}”.</p>}
    </div>
  </div>;
}
