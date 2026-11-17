import { useMemo, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
import type { FoodDefinition } from '../../domain/models';
import { searchFoods } from '../../domain/nutrition';

export function FoodSearch({ foods, onSelect, recentFoodIds = [] }: { recentFoodIds?: string[]; foods: FoodDefinition[]; onSelect: (food: FoodDefinition) => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => foods.filter(food => filter === 'recent' ? recentFoodIds.includes(food.id) : filter === 'mine' ? food.source === 'custom' : filter === 'favorites' ? food.favorite : true), [foods, filter, recentFoodIds]);
  const matches = useMemo(() => {
    const results = searchFoods(filtered, query);
    if (filter === 'recent') results.sort((a, b) => recentFoodIds.indexOf(a.id) - recentFoodIds.indexOf(b.id));
    return results.slice(0, 24);
  }, [filtered, query, filter, recentFoodIds]);
  return <div className="food-search">
    <label className="search-field"><span className="sr-only">Search foods</span><Search size={18} aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chicken, rice, yogurt…" /></label>
    <div className="food-filters" aria-label="Food library filters">{[{ id: 'all', label: 'All foods' }, { id: 'recent', label: 'Recent' }, { id: 'mine', label: 'My foods' }, { id: 'favorites', label: 'Favorites' }].map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
    <ul className="food-results">
      {matches.map((food) => <li key={food.id}><button type="button" onClick={() => onSelect(food)}>
        <span><strong>{food.favorite ? '★ ' : ''}{food.name}</strong><small>{food.source === 'custom' ? 'My foods' : 'USDA'} · {food.preparation} · {food.category}</small></span>
        <span className="food-kcal">{Math.round((food.nutrientsPer100g ?? food.portion!.nutrients).caloriesKcal)} kcal<small>{food.portion ? `per ${food.portion.name}` : 'per 100 g'}</small></span>
        <ArrowUpRight size={18} aria-hidden="true" />
      </button></li>)}
      {!matches.length && <li className="food-empty">{query ? `No foods match “${query}”.` : filter === 'favorites' ? 'Star a food in My foods to keep it close.' : 'Create your first food to build your own library.'}</li>}
    </ul>
  </div>;
}
