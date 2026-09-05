import type { DailySnapshot, Goals, UserProfile } from '@forge/digital-twin';

export const demoProfile: UserProfile = {
  id: 'shane-demo',
  age: 53,
  sex: 'male',
  heightCm: 173,
  weightKg: 75.8,
  bodyFatPct: 19.2,
};

export const demoGoals: Goals = {
  primary: 'recomposition',
  targetWeightKg: 70.3,
  weeklyTrainingTarget: 5,
};

export const demoHistory: DailySnapshot[] = [
  { date: '2026-08-06', weightKg: 76.4, sleepScore: 71, sleepHours: 6.5, soreness: 4, stress: 4, steps: 8230, caloriesKcal: 2210, proteinG: 142, trainingMinutes: 52, trainingRpe: 7 },
  { date: '2026-08-07', weightKg: 76.2, sleepScore: 78, sleepHours: 7.1, soreness: 3, stress: 3, steps: 9140, caloriesKcal: 2140, proteinG: 151, trainingMinutes: 48, trainingRpe: 7 },
  { date: '2026-08-08', weightKg: 76.1, sleepScore: 66, sleepHours: 6.0, soreness: 5, stress: 5, steps: 7380, caloriesKcal: 2280, proteinG: 136, mindScore: 6, bodyScore: 5, soulScore: 7, reflectionNote: 'A quieter day helped me reset.', reflectedAt: '2026-08-08T21:15:00.000Z' },
  { date: '2026-08-09', weightKg: 75.9, sleepScore: 82, sleepHours: 7.4, soreness: 3, stress: 3, steps: 10620, caloriesKcal: 2185, proteinG: 148, trainingMinutes: 64, trainingRpe: 8, mindScore: 8, bodyScore: 8, soulScore: 8, reflectionNote: 'Training and time with family felt balanced.', reflectedAt: '2026-08-09T21:10:00.000Z' },
  { date: '2026-08-10', weightKg: 75.8, sleepScore: 74, sleepHours: 6.8, soreness: 4, stress: 4, steps: 8890, caloriesKcal: 2160, proteinG: 145, trainingMinutes: 55, trainingRpe: 7, mindScore: 7, bodyScore: 7, soulScore: 8, reflectedAt: '2026-08-10T21:05:00.000Z' },
  { date: '2026-08-11', weightKg: 75.7, sleepScore: 69, sleepHours: 6.3, soreness: 5, stress: 5, steps: 7960, caloriesKcal: 2240, proteinG: 139, mindScore: 7, bodyScore: 6, soulScore: 7, reflectionNote: 'Energy dipped, but I stayed consistent.', reflectedAt: '2026-08-11T21:20:00.000Z' },
  { date: '2026-08-12', weightKg: 75.8, sleepScore: 77, sleepHours: 7.0, soreness: 4, stress: 3, steps: 1840, caloriesKcal: 620, proteinG: 42 },
];
