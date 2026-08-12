export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  date: string;
  meal: MealType;
  name: string;
  serving: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const quickFoods: Omit<FoodEntry, 'id' | 'date' | 'meal'>[] = [
  { name: 'Eggs + egg white', serving: '2 eggs + 1 white', caloriesKcal: 178, proteinG: 19, carbsG: 1, fatG: 10 },
  { name: 'Protein oats', serving: '1 bowl', caloriesKcal: 360, proteinG: 30, carbsG: 45, fatG: 7 },
  { name: 'Chicken breast', serving: '6 oz cooked', caloriesKcal: 280, proteinG: 53, carbsG: 0, fatG: 6 },
  { name: 'Jasmine rice', serving: '1 cup cooked', caloriesKcal: 205, proteinG: 4, carbsG: 45, fatG: 0 },
  { name: 'Sirloin steak', serving: '7 oz cooked', caloriesKcal: 410, proteinG: 52, carbsG: 0, fatG: 21 },
  { name: 'Protein shake', serving: '1 scoop', caloriesKcal: 140, proteinG: 25, carbsG: 5, fatG: 2 },
];

export const demoFoodEntries: FoodEntry[] = [
  { id: 'demo-breakfast-1', date: '2026-08-12', meal: 'breakfast', name: 'Eggs, toast + avocado', serving: '1 plate', caloriesKcal: 410, proteinG: 24, carbsG: 34, fatG: 20 },
  { id: 'demo-snack-1', date: '2026-08-12', meal: 'snack', name: 'Protein shake + banana', serving: '1 serving', caloriesKcal: 210, proteinG: 18, carbsG: 29, fatG: 2 },
];

export function foodTotals(entries: FoodEntry[], date: string) {
  return entries.filter((entry) => entry.date === date).reduce((totals, entry) => ({
    caloriesKcal: totals.caloriesKcal + entry.caloriesKcal,
    proteinG: totals.proteinG + entry.proteinG,
    carbsG: totals.carbsG + entry.carbsG,
    fatG: totals.fatG + entry.fatG,
  }), { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
}

export function createFoodEntry(date: string, meal: MealType, food: Omit<FoodEntry, 'id' | 'date' | 'meal'>, id = `${date}-${Date.now()}`): FoodEntry {
  return { id, date, meal, ...food };
}
