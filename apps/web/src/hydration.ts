export interface HydrationEntry {
  id: string;
  date: string;
  amountMl: number;
  createdAt: string;
}

export interface HydrationContext {
  reference: string;
  explanation: string;
}

export function hydrationContext(sex: 'female' | 'male' | 'intersex' | 'unspecified'): HydrationContext {
  const reference = sex === 'male'
    ? '3.7 L total-water reference'
    : sex === 'female'
      ? '2.7 L total-water reference'
      : '2.7–3.7 L total-water reference';

  return {
    reference,
    explanation: 'Food and all drinks count toward this general adult reference. Activity, heat, and illness can change individual needs.',
  };
}

export function isHydrationEntry(value: unknown): value is HydrationEntry {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<HydrationEntry>;
  return typeof candidate.id === 'string' && candidate.id.length > 0 && candidate.id.length <= 100
    && typeof candidate.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(candidate.date)
    && Number.isInteger(candidate.amountMl) && (candidate.amountMl ?? 0) >= 50 && (candidate.amountMl ?? 0) <= 2_000
    && typeof candidate.createdAt === 'string' && !Number.isNaN(Date.parse(candidate.createdAt));
}

export function hydrationTotal(entries: HydrationEntry[], date: string): number {
  return entries.filter((entry) => entry.date === date).reduce((total, entry) => total + entry.amountMl, 0);
}

export function addHydration(entries: HydrationEntry[], date: string, amountMl: number, createdAt: string): HydrationEntry[] {
  const entry: HydrationEntry = { id: `water-${createdAt}-${amountMl}`, date, amountMl, createdAt };
  return [...entries, entry].slice(-200);
}

export function undoLatestHydration(entries: HydrationEntry[], date: string): HydrationEntry[] {
  const index = entries.map((entry) => entry.date).lastIndexOf(date);
  return index < 0 ? entries : entries.filter((_, entryIndex) => entryIndex !== index);
}
