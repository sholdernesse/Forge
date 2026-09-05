export interface FoodSearchResult {
  id: string;
  source: 'usda' | 'open-food-facts';
  verification: 'government' | 'community';
  name: string;
  brand?: string;
  serving: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sodiumMg?: number;
  barcode?: string;
  nutritionBasis: 'per-100g' | 'per-serving';
  servingGrams?: number;
}

export interface FoodProvider {
  search(query: string): Promise<FoodSearchResult[]>;
  barcode(code: string): Promise<FoodSearchResult | undefined>;
}

type Request = typeof fetch;

function finite(value: unknown): number | undefined {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function rounded(value: number | undefined): number {
  return Math.round((value ?? 0) * 10) / 10;
}

function nutrient(nutrients: unknown, names: string[]): number | undefined {
  if (!Array.isArray(nutrients)) return undefined;
  const match = nutrients.find((item) => {
    if (!item || typeof item !== 'object') return false;
    const row = item as Record<string, unknown>;
    const name = String(row.nutrientName ?? (row.nutrient as Record<string, unknown> | undefined)?.name ?? '').toLowerCase();
    return names.includes(name);
  }) as Record<string, unknown> | undefined;
  return finite(match?.value ?? match?.amount);
}

function usdaFood(value: unknown): FoodSearchResult | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const item = value as Record<string, unknown>;
  const id = finite(item.fdcId);
  const name = typeof item.description === 'string' ? item.description.trim() : '';
  if (!id || !name) return undefined;
  const nutrients = item.foodNutrients;
  return {
    id: `usda-${id}`,
    source: 'usda',
    verification: 'government',
    name,
    ...(typeof item.brandName === 'string' || typeof item.brandOwner === 'string' ? { brand: String(item.brandName ?? item.brandOwner) } : {}),
    serving: '100 g reference',
    nutritionBasis: 'per-100g',
    servingGrams: 100,
    caloriesKcal: Math.round(nutrient(nutrients, ['energy']) ?? 0),
    proteinG: rounded(nutrient(nutrients, ['protein'])),
    carbsG: rounded(nutrient(nutrients, ['carbohydrate, by difference', 'carbohydrate'])) ,
    fatG: rounded(nutrient(nutrients, ['total lipid (fat)', 'total fat'])),
    ...(nutrient(nutrients, ['fiber, total dietary', 'dietary fiber']) !== undefined ? { fiberG: rounded(nutrient(nutrients, ['fiber, total dietary', 'dietary fiber'])) } : {}),
    ...(nutrient(nutrients, ['sodium, na', 'sodium']) !== undefined ? { sodiumMg: rounded(nutrient(nutrients, ['sodium, na', 'sodium'])) } : {}),
    ...(typeof item.gtinUpc === 'string' ? { barcode: item.gtinUpc } : {}),
  };
}

function offFood(code: string, value: unknown): FoodSearchResult | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const payload = value as Record<string, unknown>;
  if (payload.status !== 1 || !payload.product || typeof payload.product !== 'object') return undefined;
  const product = payload.product as Record<string, unknown>;
  const name = typeof product.product_name === 'string' ? product.product_name.trim() : '';
  const values = product.nutriments && typeof product.nutriments === 'object' ? product.nutriments as Record<string, unknown> : {};
  if (!name) return undefined;
  const servingLabel = typeof product.serving_size === 'string' && product.serving_size.trim() ? product.serving_size.trim() : undefined;
  const servingGrams = servingLabel ? finite(servingLabel.match(/([\d.]+)\s*g/i)?.[1]) : undefined;
  const hasServing = finite(values['energy-kcal_serving']) !== undefined;
  const pick = (serving: string, per100: string) => hasServing ? finite(values[serving]) : finite(values[per100]);
  return {
    id: `off-${code}`,
    source: 'open-food-facts',
    verification: 'community',
    name,
    ...(typeof product.brands === 'string' && product.brands.trim() ? { brand: product.brands.trim() } : {}),
    serving: hasServing && servingLabel ? servingLabel : '100 g reference',
    nutritionBasis: hasServing ? 'per-serving' : 'per-100g',
    ...(hasServing && servingGrams ? { servingGrams } : !hasServing ? { servingGrams: 100 } : {}),
    caloriesKcal: Math.round(pick('energy-kcal_serving', 'energy-kcal_100g') ?? 0),
    proteinG: rounded(pick('proteins_serving', 'proteins_100g')),
    carbsG: rounded(pick('carbohydrates_serving', 'carbohydrates_100g')),
    fatG: rounded(pick('fat_serving', 'fat_100g')),
    ...(pick('fiber_serving', 'fiber_100g') !== undefined ? { fiberG: rounded(pick('fiber_serving', 'fiber_100g')) } : {}),
    ...(pick('sodium_serving', 'sodium_100g') !== undefined ? { sodiumMg: rounded((pick('sodium_serving', 'sodium_100g') ?? 0) * 1_000) } : {}),
    barcode: code,
  };
}

export class HybridFoodProvider implements FoodProvider {
  constructor(private readonly usdaApiKey: string | undefined, private readonly request: Request = fetch) {}

  async search(query: string): Promise<FoodSearchResult[]> {
    if (!this.usdaApiKey) return [];
    const response = await this.request(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(this.usdaApiKey)}&query=${encodeURIComponent(query)}&pageSize=20`);
    if (!response.ok) throw new Error(`USDA food search failed with ${response.status}`);
    const payload = await response.json() as { foods?: unknown[] };
    return (payload.foods ?? []).map(usdaFood).filter((food): food is FoodSearchResult => food !== undefined);
  }

  async barcode(code: string): Promise<FoodSearchResult | undefined> {
    const fields = 'product_name,brands,serving_size,nutriments';
    const response = await this.request(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}?fields=${fields}`, { headers: { 'user-agent': 'Forge/0.1 (food lookup)' } });
    if (response.ok) {
      const food = offFood(code, await response.json());
      if (food) return food;
    } else if (response.status !== 404 && !this.usdaApiKey) {
      throw new Error(`Open Food Facts lookup failed with ${response.status}`);
    }

    if (!this.usdaApiKey) return undefined;
    const usdaResponse = await this.request(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(this.usdaApiKey)}&query=${encodeURIComponent(code)}&pageSize=20&dataType=Branded`);
    if (!usdaResponse.ok) throw new Error(`USDA barcode lookup failed with ${usdaResponse.status}`);
    const payload = await usdaResponse.json() as { foods?: unknown[] };
    const exact = (payload.foods ?? []).find((item) => {
      if (!item || typeof item !== 'object') return false;
      return String((item as Record<string, unknown>).gtinUpc ?? '').replace(/\D/g, '') === code;
    });
    return exact ? usdaFood(exact) : undefined;
  }
}
