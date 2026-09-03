import type { FoodDefinition } from './foodLog.js';

interface FoodDataConfig {
  baseUrl: string;
  accessToken(): Promise<string>;
}

interface ProviderFood {
  id?: unknown;
  source?: unknown;
  verification?: unknown;
  name?: unknown;
  brand?: unknown;
  serving?: unknown;
  caloriesKcal?: unknown;
  proteinG?: unknown;
  carbsG?: unknown;
  fatG?: unknown;
  fiberG?: unknown;
  sodiumMg?: unknown;
  barcode?: unknown;
  nutritionBasis?: unknown;
  servingGrams?: unknown;
}

function normalizeFood(value: ProviderFood): FoodDefinition | undefined {
  if (typeof value.id !== 'string' || typeof value.name !== 'string' || typeof value.serving !== 'string') return undefined;
  if (!['usda', 'open-food-facts'].includes(String(value.source)) || !['government', 'community'].includes(String(value.verification)) || !['per-100g', 'per-serving'].includes(String(value.nutritionBasis))) return undefined;
  const required = [value.caloriesKcal, value.proteinG, value.carbsG, value.fatG];
  if (!required.every((item) => typeof item === 'number' && Number.isFinite(item) && item >= 0)) return undefined;
  return {
    id: value.id,
    name: value.name,
    serving: value.serving,
    caloriesKcal: value.caloriesKcal as number,
    proteinG: value.proteinG as number,
    carbsG: value.carbsG as number,
    fatG: value.fatG as number,
    category: 'other',
    dataSource: value.source as 'usda' | 'open-food-facts',
    verification: value.verification as 'government' | 'community',
    nutritionBasis: value.nutritionBasis as 'per-100g' | 'per-serving',
    ...(typeof value.brand === 'string' ? { brand: value.brand } : {}),
    ...(typeof value.fiberG === 'number' ? { fiberG: value.fiberG } : {}),
    ...(typeof value.sodiumMg === 'number' ? { sodiumMg: value.sodiumMg } : {}),
    ...(typeof value.barcode === 'string' ? { barcode: value.barcode } : {}),
    ...(typeof value.servingGrams === 'number' && Number.isFinite(value.servingGrams) && value.servingGrams > 0 ? { servingGrams: value.servingGrams } : {}),
  };
}

export class FoodDataClient {
  constructor(private readonly config: FoodDataConfig, private readonly request: typeof fetch = fetch) {}

  async search(query: string): Promise<FoodDefinition[]> {
    const payload = await this.get(`/v1/foods/search?q=${encodeURIComponent(query)}`) as { foods?: unknown };
    return Array.isArray(payload.foods) ? payload.foods.map((food) => normalizeFood(food as ProviderFood)).filter((food): food is FoodDefinition => food !== undefined) : [];
  }

  async barcode(code: string): Promise<FoodDefinition | undefined> {
    const payload = await this.get(`/v1/foods/barcode/${encodeURIComponent(code)}`, true) as { food?: unknown } | undefined;
    return payload?.food ? normalizeFood(payload.food as ProviderFood) : undefined;
  }

  private async get(path: string, allowMissing = false): Promise<unknown> {
    const token = await this.config.accessToken();
    const response = await this.request(`${this.config.baseUrl}${path}`, { headers: { authorization: `Bearer ${token}` } });
    if (allowMissing && response.status === 404) return undefined;
    if (!response.ok) throw new Error(`Food lookup failed (${response.status})`);
    return response.json();
  }
}

export function foodDataConfig(environment: Record<string, unknown>, accessToken?: () => Promise<string>): FoodDataConfig | null {
  const baseUrl = environment.VITE_FORGE_SYNC_URL;
  if (typeof baseUrl !== 'string' || !baseUrl.trim() || !accessToken) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), accessToken };
}
