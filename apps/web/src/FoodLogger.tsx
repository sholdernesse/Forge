import { useMemo, useState } from 'react';
import { Apple, Barcode, Heart, Minus, Plus, Search, Trash2, X } from 'lucide-react';
import { foodCatalog } from './foodCatalog.js';
import { createFoodEntry, lookupBarcode, mealEntries, scaleFood, searchFoods, type FoodEntry, type MealType, type SavedMeal } from './foodLog.js';
import { useAccessibleDialog } from './useAccessibleDialog.js';

interface Props { date: string; entries: FoodEntry[]; favoriteFoodIds: string[]; savedMeals: SavedMeal[]; onChange(entries: FoodEntry[]): void; onPreferencesChange(favorites: string[], meals: SavedMeal[]): void; onClose(): void; }
const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function FoodLogger({ date, entries, favoriteFoodIds, savedMeals, onChange, onPreferencesChange, onClose }: Props) {
  const dialogRef = useAccessibleDialog(onClose);
  const [meal, setMeal] = useState<MealType>('breakfast');
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [barcode, setBarcode] = useState('');
  const [barcodeMessage, setBarcodeMessage] = useState('');
  const [custom, setCustom] = useState({ name: '', caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const today = entries.filter((entry) => entry.date === date);
  const results = useMemo(() => searchFoods(foodCatalog, query).sort((a, b) => Number(favoriteFoodIds.includes(b.id)) - Number(favoriteFoodIds.includes(a.id))), [query, favoriteFoodIds]);

  function addCatalogFood(foodId: string) { const food = foodCatalog.find((candidate) => candidate.id === foodId); if (food) onChange([...entries, createFoodEntry(date, meal, scaleFood(food, quantity))]); }
  function addCustom() { if (!custom.name.trim() || custom.caloriesKcal <= 0) return; onChange([...entries, createFoodEntry(date, meal, { ...custom, name: custom.name.trim(), serving: 'Custom serving' })]); setCustom({ name: '', caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }); }
  function toggleFavorite(foodId: string) { onPreferencesChange(favoriteFoodIds.includes(foodId) ? favoriteFoodIds.filter((id) => id !== foodId) : [...favoriteFoodIds, foodId], savedMeals); }
  function addSavedMeal(savedMeal: SavedMeal) { onChange([...entries, ...mealEntries(savedMeal, foodCatalog, date, meal)]); }
  function saveCurrentMeal() {
    const items = today.filter((entry) => entry.meal === meal && entry.sourceFoodId).map((entry) => ({ foodId: entry.sourceFoodId!, quantity: entry.quantity ?? 1 }));
    if (!items.length) return;
    const name = `${meal[0]!.toUpperCase()}${meal.slice(1)} favorite`;
    onPreferencesChange(favoriteFoodIds, [...savedMeals.filter((item) => item.name !== name), { id: `${meal}-favorite`, name, items }]);
  }
  function findBarcode() { const food = lookupBarcode(foodCatalog, barcode); if (!food) { setBarcodeMessage('Not found locally. External provider connection comes next.'); return; } setQuery(food.name); setBarcodeMessage(`${food.name} found. Choose a serving and add it.`); }

  return <div className="workout-backdrop" onMouseDown={onClose}><section ref={dialogRef} className="food-logger" role="dialog" aria-modal="true" aria-labelledby="food-logger-title" tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
    <header className="food-header"><button className="icon-button" onClick={onClose} aria-label="Close food logger"><X size={20} /></button><div><span className="section-label">TODAY’S NUTRITION</span><h2 id="food-logger-title">Log food</h2></div><Apple size={22} /></header>
    <div className="meal-tabs">{meals.map((item) => <button className={meal === item ? 'active' : ''} onClick={() => setMeal(item)} key={item}>{item}</button>)}</div>
    <section className="food-search"><div className="search-box"><Search size={17} /><input placeholder="Search foods" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="serving-stepper"><button onClick={() => setQuantity(Math.max(.25, quantity - .25))}><Minus size={14} /></button><span>{quantity}× serving</span><button onClick={() => setQuantity(quantity + .25)}><Plus size={14} /></button></div></section>
    {savedMeals.length > 0 && <section className="saved-meals"><h3>Saved meals</h3><div>{savedMeals.map((savedMeal) => <button onClick={() => addSavedMeal(savedMeal)} key={savedMeal.id}><span><b>{savedMeal.name}</b><small>{savedMeal.items.length} foods</small></span><Plus size={16} /></button>)}</div></section>}
    <section className="quick-foods"><h3>{query ? 'Search results' : `Foods for ${meal}`}</h3><div>{results.map((food) => { const scaled = scaleFood(food, quantity); return <div className="food-result" key={food.id}><button className={`favorite ${favoriteFoodIds.includes(food.id) ? 'active' : ''}`} onClick={() => toggleFavorite(food.id)} aria-label={`Favorite ${food.name}`}><Heart size={15} /></button><button className="food-add" onClick={() => addCatalogFood(food.id)}><span><b>{food.name}</b><small>{scaled.serving} · {scaled.proteinG}g protein</small></span><strong>{scaled.caloriesKcal}</strong><Plus size={16} /></button></div>; })}</div></section>
    <section className="barcode-entry"><h3><Barcode size={17} /> Barcode-ready lookup</h3><div><input inputMode="numeric" placeholder="Enter barcode for prototype" value={barcode} onChange={(event) => setBarcode(event.target.value)} /><button onClick={findBarcode}>Lookup</button></div>{barcodeMessage && <small>{barcodeMessage}</small>}</section>
    <section className="custom-food"><h3>Custom food</h3><input placeholder="Food name" value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} /><div>{(['caloriesKcal', 'proteinG', 'carbsG', 'fatG'] as const).map((field) => <label key={field}><span>{field === 'caloriesKcal' ? 'Calories' : field.replace('G', '')}</span><input type="number" min="0" value={custom[field]} onChange={(event) => setCustom({ ...custom, [field]: Number(event.target.value) })} /></label>)}</div><button onClick={addCustom}><Plus size={17} /> Add custom food</button></section>
    <section className="meal-log"><div className="meal-log-heading"><h3>Logged today</h3><button onClick={saveCurrentMeal}>Save current {meal}</button></div>{meals.map((mealName) => { const mealEntriesToday = today.filter((entry) => entry.meal === mealName); return mealEntriesToday.length ? <div className="logged-meal" key={mealName}><span className="meal-name">{mealName}</span>{mealEntriesToday.map((entry) => <div key={entry.id}><span><b>{entry.name}</b><small>{entry.serving} · P {entry.proteinG} · C {entry.carbsG} · F {entry.fatG}</small></span><strong>{entry.caloriesKcal}</strong><button onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}><Trash2 size={15} /></button></div>)}</div> : null; })}</section>
  </section></div>;
}
