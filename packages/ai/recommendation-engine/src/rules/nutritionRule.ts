import type { DigitalTwin, Recommendation } from '@forge/digital-twin';

const PROTEIN_G_PER_KG = 1.8;

export function nutritionRule(twin: DigitalTwin, now: string): Recommendation | undefined {
  const weightKg = twin.profile.weightKg;
  const proteinAverage = twin.nutrition.proteinAverage7d;

  if (weightKg == null || proteinAverage == null || twin.nutrition.proteinAdherenceDays7d < 3) {
    return undefined;
  }

  const targetProtein = Math.round(weightKg * PROTEIN_G_PER_KG);
  const gap = targetProtein - proteinAverage;

  if (gap <= 15) {
    return undefined;
  }

  return {
    id: `rec_nutrition_protein_${twin.profile.id}_${now.slice(0, 10)}`,
    category: 'nutrition',
    title: 'Bring protein up today',
    action: `Aim for about ${targetProtein} g of protein today.`,
    reason: `Your 7-day protein average is about ${proteinAverage} g, which is below the current bodyweight-based target.`,
    confidence: Math.min(95, 70 + twin.nutrition.proteinAdherenceDays7d * 3),
    evidence: [
      { key: 'weightKg', label: 'Current weight', value: weightKg },
      { key: 'proteinAverage7d', label: '7-day protein average', value: proteinAverage },
      { key: 'proteinTargetG', label: 'Protein target', value: targetProtein },
      { key: 'proteinAdherenceDays7d', label: 'Logged protein days', value: twin.nutrition.proteinAdherenceDays7d },
    ],
    createdAt: now,
  };
}
