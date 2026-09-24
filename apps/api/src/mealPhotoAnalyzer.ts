import type { FoodProvider, FoodSearchResult } from './foodProvider.js';

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

export interface MealPhotoAnalyzer {
  analyze(imageDataUrl: string): Promise<MealPhotoAnalysis>;
}

export type MealPhotoFailureReason =
  | 'provider_authentication_failed'
  | 'provider_access_denied'
  | 'provider_model_unavailable'
  | 'provider_quota_or_rate_limit'
  | 'provider_request_rejected'
  | 'provider_timeout'
  | 'provider_unreachable'
  | 'provider_unavailable'
  | 'provider_invalid_response';

export class MealPhotoAnalysisError extends Error {
  constructor(readonly reason: MealPhotoFailureReason, readonly providerStatus?: number) {
    super(`Meal photo analysis failed: ${reason}`);
    this.name = 'MealPhotoAnalysisError';
  }
}

export function mealPhotoFailureReason(error: unknown): MealPhotoFailureReason {
  return error instanceof MealPhotoAnalysisError ? error.reason : 'provider_unavailable';
}

interface DetectedItem {
  name: string;
  portionDescription: string;
  estimatedGrams: number;
  confidence: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface DetectedMeal {
  items: DetectedItem[];
  assumptions: string[];
  warnings: string[];
}

interface OpenAiMealPhotoOptions {
  apiKey: string;
  model: string;
  foodProvider?: FoodProvider;
  endpoint?: string;
  request?: typeof fetch;
}

const mealSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      maxItems: 8,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          portionDescription: { type: 'string' },
          estimatedGrams: { type: 'number' },
          confidence: { type: 'number' },
          caloriesKcal: { type: 'number' },
          proteinG: { type: 'number' },
          carbsG: { type: 'number' },
          fatG: { type: 'number' },
        },
        required: ['name', 'portionDescription', 'estimatedGrams', 'confidence', 'caloriesKcal', 'proteinG', 'carbsG', 'fatG'],
        additionalProperties: false,
      },
    },
    assumptions: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    warnings: { type: 'array', items: { type: 'string' }, maxItems: 8 },
  },
  required: ['items', 'assumptions', 'warnings'],
  additionalProperties: false,
};

const instructions = `Analyze only the food and drink visible in this meal photo. Identify at most eight distinct edible items. Estimate each visible portion in grams and provide a conservative calorie and macronutrient estimate. Confidence is a number from 0 to 1. Do not identify people or infer health conditions. Separate foods when practical, but keep a mixed dish together when its ingredients cannot be seen reliably. State important uncertainty about cooking oil, sauces, hidden ingredients, occlusion, and portion size in assumptions or warnings. This is an assisted estimate that a user must review, not a medical measurement.`;

function boundedNumber(value: unknown, maximum: number): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= maximum ? value : undefined;
}

function shortStrings(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length > 8 || value.some((item) => typeof item !== 'string' || !item.trim() || item.length > 240)) return undefined;
  return value.map((item) => String(item).trim());
}

export function parseDetectedMeal(value: unknown): DetectedMeal {
  if (!value || typeof value !== 'object') throw new Error('Invalid meal analysis payload');
  const payload = value as Record<string, unknown>;
  if (!Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > 8) throw new Error('Meal analysis must contain one to eight items');
  const items = payload.items.map((candidate) => {
    if (!candidate || typeof candidate !== 'object') throw new Error('Invalid meal item');
    const item = candidate as Record<string, unknown>;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const portionDescription = typeof item.portionDescription === 'string' ? item.portionDescription.trim() : '';
    const estimatedGrams = boundedNumber(item.estimatedGrams, 2_000);
    const confidence = boundedNumber(item.confidence, 1);
    const caloriesKcal = boundedNumber(item.caloriesKcal, 4_000);
    const proteinG = boundedNumber(item.proteinG, 500);
    const carbsG = boundedNumber(item.carbsG, 800);
    const fatG = boundedNumber(item.fatG, 500);
    if (!name || name.length > 120 || !portionDescription || portionDescription.length > 160 || estimatedGrams === undefined || estimatedGrams < 1 || confidence === undefined || caloriesKcal === undefined || proteinG === undefined || carbsG === undefined || fatG === undefined) throw new Error('Invalid meal item fields');
    return { name, portionDescription, estimatedGrams: Math.round(estimatedGrams), confidence: Math.round(confidence * 100) / 100, caloriesKcal: Math.round(caloriesKcal), proteinG: Math.round(proteinG * 10) / 10, carbsG: Math.round(carbsG * 10) / 10, fatG: Math.round(fatG * 10) / 10 };
  });
  const assumptions = shortStrings(payload.assumptions);
  const warnings = shortStrings(payload.warnings);
  if (!assumptions || !warnings) throw new Error('Invalid meal analysis notes');
  return { items, assumptions, warnings };
}

function responseText(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === 'string') return record.output_text;
  if (!Array.isArray(record.output)) return undefined;
  for (const output of record.output) {
    if (!output || typeof output !== 'object' || !Array.isArray((output as Record<string, unknown>).content)) continue;
    for (const content of (output as { content: unknown[] }).content) {
      if (content && typeof content === 'object' && (content as Record<string, unknown>).type === 'output_text' && typeof (content as Record<string, unknown>).text === 'string') return (content as Record<string, string>).text;
    }
  }
  return undefined;
}

function scaledNutrition(food: FoodSearchResult, grams: number) {
  const referenceGrams = food.nutritionBasis === 'per-100g' ? 100 : food.servingGrams;
  if (!referenceGrams || referenceGrams <= 0) return undefined;
  const factor = grams / referenceGrams;
  return {
    caloriesKcal: Math.round(food.caloriesKcal * factor),
    proteinG: Math.round(food.proteinG * factor * 10) / 10,
    carbsG: Math.round(food.carbsG * factor * 10) / 10,
    fatG: Math.round(food.fatG * factor * 10) / 10,
  };
}

export class OpenAiMealPhotoAnalyzer implements MealPhotoAnalyzer {
  private readonly request: typeof fetch;
  private readonly endpoint: string;

  constructor(private readonly options: OpenAiMealPhotoOptions) {
    this.request = options.request ?? fetch;
    this.endpoint = options.endpoint ?? 'https://api.openai.com/v1/responses';
  }

  async analyze(imageDataUrl: string): Promise<MealPhotoAnalysis> {
    let response: Response;
    try {
      response = await this.request(this.endpoint, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.options.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          model: this.options.model,
          store: false,
          input: [
            { role: 'system', content: instructions },
            { role: 'user', content: [{ type: 'input_text', text: 'Identify the foods and estimate the visible portions in this meal.' }, { type: 'input_image', image_url: imageDataUrl, detail: 'high' }] },
          ],
          text: { format: { type: 'json_schema', name: 'forge_meal_photo_analysis', strict: true, schema: mealSchema } },
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (error) {
      const errorName = error instanceof Error ? error.name : '';
      throw new MealPhotoAnalysisError(errorName === 'AbortError' || errorName === 'TimeoutError' ? 'provider_timeout' : 'provider_unreachable');
    }
    if (!response.ok) {
      const reason: MealPhotoFailureReason = response.status === 401
        ? 'provider_authentication_failed'
        : response.status === 403
          ? 'provider_access_denied'
          : response.status === 404
            ? 'provider_model_unavailable'
            : response.status === 429
              ? 'provider_quota_or_rate_limit'
              : response.status >= 500
                ? 'provider_unavailable'
                : 'provider_request_rejected';
      throw new MealPhotoAnalysisError(reason, response.status);
    }
    let detected: DetectedMeal;
    try {
      const text = responseText(await response.json());
      if (!text) throw new Error('Missing structured output');
      detected = parseDetectedMeal(JSON.parse(text));
    } catch {
      throw new MealPhotoAnalysisError('provider_invalid_response');
    }
    const enriched = await Promise.all(detected.items.map(async (item): Promise<MealPhotoItem> => {
      if (!this.options.foodProvider) return { ...item, nutritionSource: 'ai-estimate' };
      try {
        const match = (await this.options.foodProvider.search(item.name))[0];
        const nutrition = match ? scaledNutrition(match, item.estimatedGrams) : undefined;
        return match && nutrition ? { ...item, ...nutrition, nutritionSource: 'usda', referenceFoodId: match.id, referenceFoodName: match.name } : { ...item, nutritionSource: 'ai-estimate' };
      } catch {
        return { ...item, nutritionSource: 'ai-estimate' };
      }
    }));
    return { items: enriched, assumptions: detected.assumptions, warnings: detected.warnings };
  }
}

export function mealPhotoAnalyzerFromEnvironment(environment: NodeJS.ProcessEnv, foodProvider?: FoodProvider): MealPhotoAnalyzer | undefined {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  const model = environment.OPENAI_VISION_MODEL?.trim();
  if (!apiKey || !model) return undefined;
  return new OpenAiMealPhotoAnalyzer({ apiKey, model, ...(foodProvider ? { foodProvider } : {}) });
}
