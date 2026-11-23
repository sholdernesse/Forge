import type { FoodDefinition, SavedMeal } from './foodLog.js';

export const foodCatalog: FoodDefinition[] = [
  { id: 'eggs-whites', name: 'Eggs + egg white', serving: '2 eggs + 1 white', caloriesKcal: 178, proteinG: 19, carbsG: 1, fatG: 10, category: 'protein', barcode: '000000000001' },
  { id: 'protein-oats', name: 'Protein oats', serving: '1 bowl', caloriesKcal: 360, proteinG: 30, carbsG: 45, fatG: 7, category: 'meal' },
  { id: 'chicken-breast', name: 'Chicken breast', serving: '6 oz cooked', caloriesKcal: 280, proteinG: 53, carbsG: 0, fatG: 6, category: 'protein' },
  { id: 'jasmine-rice', name: 'Jasmine rice', serving: '1 cup cooked', caloriesKcal: 205, proteinG: 4, carbsG: 45, fatG: 0, category: 'carb' },
  { id: 'sirloin-steak', name: 'Sirloin steak', serving: '7 oz cooked', caloriesKcal: 410, proteinG: 52, carbsG: 0, fatG: 21, category: 'protein' },
  { id: 'protein-shake', name: 'Protein shake', serving: '1 scoop', caloriesKcal: 140, proteinG: 25, carbsG: 5, fatG: 2, category: 'supplement', barcode: '000000000002' },
  { id: 'banana', name: 'Banana', serving: '1 medium', caloriesKcal: 105, proteinG: 1, carbsG: 27, fatG: 0, category: 'produce', barcode: '4011' },
  { id: 'avocado', name: 'Avocado', serving: '1/2 fruit', caloriesKcal: 120, proteinG: 2, carbsG: 6, fatG: 11, category: 'produce' },
  { id: 'cottage-cheese', name: 'Low-fat cottage cheese', serving: '1 cup', caloriesKcal: 180, proteinG: 26, carbsG: 10, fatG: 5, category: 'protein' },
];

export const demoSavedMeals: SavedMeal[] = [
  { id: 'post-workout-breakfast', name: 'Post-workout breakfast', items: [{ foodId: 'eggs-whites', quantity: 1 }, { foodId: 'protein-oats', quantity: 1 }] },
  { id: 'chicken-rice-lunch', name: 'Chicken + rice lunch', items: [{ foodId: 'chicken-breast', quantity: 1 }, { foodId: 'jasmine-rice', quantity: 1 }] },
];
