import { describe, expect, it } from 'vitest';
import { barcodeLookupFailureMessage } from './FoodLogger.js';
import { FoodDataError } from './foodDataClient.js';

describe('barcode lookup feedback', () => {
  it('distinguishes provider, authorization, and local-service failures', () => {
    expect(barcodeLookupFailureMessage(new FoodDataError(503))).toContain('Open Food Facts');
    expect(barcodeLookupFailureMessage(new FoodDataError(401))).toContain('rejected');
    expect(barcodeLookupFailureMessage(new TypeError('fetch failed'))).toContain('corepack pnpm dev:https');
  });
});
