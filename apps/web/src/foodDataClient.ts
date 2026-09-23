import type { FoodDefinition } from './foodLog.js';

interface FoodDataConfig {
  baseUrl: string;
  accessToken(): Promise<string>;
  diagnostics?: boolean;
}

export class FoodDataError extends Error {
  constructor(readonly status: number) {
    super(`Food lookup failed (${status})`);
    this.name = 'FoodDataError';
  }
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
  potassiumMg?: unknown;
  calciumMg?: unknown;
  ironMg?: unknown;
  vitaminDMcg?: unknown;
  barcode?: unknown;
  nutritionBasis?: unknown;
  servingGrams?: unknown;
}

export interface MealPhotoItem {
  name: string;
  portionDescription: string;
  estimatedGrams: number;
  confidence: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  nutritionSource: 'usda' | 'ai-estimate';
  referenceFoodId?: string;
  referenceFoodName?: string;
}

export interface MealPhotoAnalysis {
  items: MealPhotoItem[];
  assumptions: string[];
  warnings: string[];
}

function nonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
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
    ...(nonnegative(value.fiberG) ? { fiberG: value.fiberG } : {}),
    ...(nonnegative(value.sodiumMg) ? { sodiumMg: value.sodiumMg } : {}),
    ...(nonnegative(value.potassiumMg) ? { potassiumMg: value.potassiumMg } : {}),
    ...(nonnegative(value.calciumMg) ? { calciumMg: value.calciumMg } : {}),
    ...(nonnegative(value.ironMg) ? { ironMg: value.ironMg } : {}),
    ...(nonnegative(value.vitaminDMcg) ? { vitaminDMcg: value.vitaminDMcg } : {}),
    ...(typeof value.barcode === 'string' ? { barcode: value.barcode } : {}),
    ...(typeof value.servingGrams === 'number' && Number.isFinite(value.servingGrams) && value.servingGrams > 0 ? { servingGrams: value.servingGrams } : {}),
  };
}

function normalizeMealPhotoAnalysis(value: unknown): MealPhotoAnalysis | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const payload = value as Record<string, unknown>;
  if (!Array.isArray(payload.items) || !Array.isArray(payload.assumptions) || !Array.isArray(payload.warnings)) return undefined;
  const finite = (candidate: unknown) => typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0;
  const items = payload.items.flatMap((candidate): MealPhotoItem[] => {
    if (!candidate || typeof candidate !== 'object') return [];
    const item = candidate as Record<string, unknown>;
    if (typeof item.name !== 'string' || typeof item.portionDescription !== 'string' || !finite(item.estimatedGrams) || !finite(item.confidence) || !finite(item.caloriesKcal) || !finite(item.proteinG) || !finite(item.carbsG) || !finite(item.fatG) || !['usda', 'ai-estimate'].includes(String(item.nutritionSource))) return [];
    return [{
      name: item.name,
      portionDescription: item.portionDescription,
      estimatedGrams: item.estimatedGrams as number,
      confidence: item.confidence as number,
      caloriesKcal: item.caloriesKcal as number,
      proteinG: item.proteinG as number,
      carbsG: item.carbsG as number,
      fatG: item.fatG as number,
      nutritionSource: item.nutritionSource as 'usda' | 'ai-estimate',
      ...(typeof item.referenceFoodId === 'string' ? { referenceFoodId: item.referenceFoodId } : {}),
      ...(typeof item.referenceFoodName === 'string' ? { referenceFoodName: item.referenceFoodName } : {}),
    }];
  });
  if (!items.length || items.length !== payload.items.length || payload.assumptions.some((item) => typeof item !== 'string') || payload.warnings.some((item) => typeof item !== 'string')) return undefined;
  return { items, assumptions: payload.assumptions as string[], warnings: payload.warnings as string[] };
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

  async analyzeMealPhoto(imageDataUrl: string): Promise<MealPhotoAnalysis> {
    const payload = await this.post('/v1/foods/photo-analysis', { imageDataUrl }) as { analysis?: unknown };
    const analysis = normalizeMealPhotoAnalysis(payload.analysis);
    if (!analysis) throw new FoodDataError(502);
    return analysis;
  }

  async connectionDiagnostic(): Promise<string | undefined> {
    if (!this.config.diagnostics) return undefined;
    const route = `${this.config.baseUrl}/health`;
    try {
      const response = await this.request(route);
      return `Route ${this.config.baseUrl}; health ${response.status}.`;
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown error';
      return `Route ${this.config.baseUrl}; health unreachable (${reason}).`;
    }
  }

  private async get(path: string, allowMissing = false): Promise<unknown> {
    const token = await this.config.accessToken();
    const response = await this.request(`${this.config.baseUrl}${path}`, { headers: { authorization: `Bearer ${token}` } });
    if (allowMissing && response.status === 404) return undefined;
    if (!response.ok) throw new FoodDataError(response.status);
    return response.json();
  }


  private async post(path: string, body: unknown): Promise<unknown> {
    const token = await this.config.accessToken();
    const response = await this.request(`${this.config.baseUrl}${path}`, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new FoodDataError(response.status);
    return response.json();
  }
}

export function foodDataConfig(environment: Record<string, unknown>, accessToken?: () => Promise<string>): FoodDataConfig | null {
  if (environment.DEV === true && accessToken) return { baseUrl: '/api', accessToken, diagnostics: true };
  const baseUrl = environment.VITE_FORGE_SYNC_URL;
  if (typeof baseUrl !== 'string' || !baseUrl.trim() || !accessToken) return null;
  return { baseUrl: baseUrl.replace(/\/$/, ''), accessToken };
}
