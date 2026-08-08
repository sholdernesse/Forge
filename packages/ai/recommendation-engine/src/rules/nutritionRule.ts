import type { DigitalTwin, Recommendation } from '@forge/digital-twin';

const PROTEIN_G_PER_KG = 1.8;

export function nutritionRule(twin: DigitalTwin, now: string): Recommendation | undefined {
  const weightKg = twin.profile.weightKg;
  const proteinAverage = twin.nutrition.proteinAverage7d;

  if (weightKg == null || proteinAverage == null || twin.nutrition.adherenceDays7d < 3) {
    return undefined;
  }

  const targetProtein = Math.round(weightKg * PROTEIN_G_PER_KG);
  const gap = targetProtein - proteinAverage;

  if (gap <= 15) {
    return undefined;
  }

  return {
    id: `nutrition-protein-${now}`,
    category: 'nutrition',
    title: 'Bring protein up today',
    action: `Aim for about ${targetProtein} g of protein today.`,
    reason: `Your 7-day protein average is about ${proteinAverage} g, which is below the current bodyweight-based target.`,
    confidence: Math.min(95, 70 + twin.nutrition.adherenceDays7d * 3),
    evidence: [
      { key: 'weightKg', label: 'Current weight', value: weightKg },
      { key: 'proteinAverage7d', label: '7-day protein average', value: proteinAverage },
      { key: 'proteinTargetG', label: 'Protein target', value: targetProtein },
      { key: 'nutritionAdherenceDays7d', label: 'Logged nutrition days', value: twin.nutrition.adherenceDays7d },
    ],
    createdAt: now,
  };
}
