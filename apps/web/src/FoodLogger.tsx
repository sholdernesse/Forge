import { useState } from 'react';
import { Apple, Plus, Trash2, X } from 'lucide-react';
import { createFoodEntry, quickFoods, type FoodEntry, type MealType } from './foodLog.js';

interface Props { date: string; entries: FoodEntry[]; onChange(entries: FoodEntry[]): void; onClose(): void; }
const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function FoodLogger({ date, entries, onChange, onClose }: Props) {
  const [meal, setMeal] = useState<MealType>('breakfast');
  const [custom, setCustom] = useState({ name: '', caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const today = entries.filter((entry) => entry.date === date);

  function addFood(food: Omit<FoodEntry, 'id' | 'date' | 'meal'>) { onChange([...entries, createFoodEntry(date, meal, food)]); }
  function addCustom() {
    if (!custom.name.trim() || custom.caloriesKcal <= 0) return;
    addFood({ ...custom, name: custom.name.trim(), serving: 'Custom serving' });
    setCustom({ name: '', caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  }

  return <div className="workout-backdrop"><section className="food-logger">
    <header className="food-header"><button className="icon-button" onClick={onClose}><X size={20} /></button><div><span className="section-label">TODAY’S NUTRITION</span><h2>Log food</h2></div><Apple size={22} /></header>
    <div className="meal-tabs">{meals.map((item) => <button className={meal === item ? 'active' : ''} onClick={() => setMeal(item)} key={item}>{item}</button>)}</div>
    <section className="quick-foods"><h3>Quick add to {meal}</h3><div>{quickFoods.map((food) => <button onClick={() => addFood(food)} key={food.name}><span><b>{food.name}</b><small>{food.serving} · {food.proteinG}g protein</small></span><strong>{food.caloriesKcal}</strong><Plus size={16} /></button>)}</div></section>
    <section className="custom-food"><h3>Custom food</h3><input placeholder="Food name" value={custom.name} onChange={(event) => setCustom({ ...custom, name: event.target.value })} /><div>{(['caloriesKcal', 'proteinG', 'carbsG', 'fatG'] as const).map((field) => <label key={field}><span>{field === 'caloriesKcal' ? 'Calories' : field.replace('G', '')}</span><input type="number" min="0" value={custom[field]} onChange={(event) => setCustom({ ...custom, [field]: Number(event.target.value) })} /></label>)}</div><button onClick={addCustom}><Plus size={17} /> Add custom food</button></section>
    <section className="meal-log"><h3>Logged today</h3>{meals.map((mealName) => { const mealEntries = today.filter((entry) => entry.meal === mealName); return mealEntries.length ? <div className="logged-meal" key={mealName}><span className="meal-name">{mealName}</span>{mealEntries.map((entry) => <div key={entry.id}><span><b>{entry.name}</b><small>{entry.serving} · P {entry.proteinG} · C {entry.carbsG} · F {entry.fatG}</small></span><strong>{entry.caloriesKcal}</strong><button onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}><Trash2 size={15} /></button></div>)}</div> : null; })}</section>
  </section></div>;
}
