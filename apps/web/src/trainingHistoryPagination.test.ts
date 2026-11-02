import { describe, expect, it } from 'vitest';
import { nextTrainingHistoryCount, TRAINING_HISTORY_PAGE_SIZE, visibleTrainingHistoryCount } from './trainingHistoryPagination.js';

describe('training history pagination', () => {
  it('starts at one page and never exceeds the available results', () => {
    expect(visibleTrainingHistoryCount(30, TRAINING_HISTORY_PAGE_SIZE)).toBe(12);
    expect(visibleTrainingHistoryCount(7, TRAINING_HISTORY_PAGE_SIZE)).toBe(7);
    expect(visibleTrainingHistoryCount(0, TRAINING_HISTORY_PAGE_SIZE)).toBe(0);
  });

  it('reveals one additional page at a time', () => {
    expect(nextTrainingHistoryCount(30, 12)).toBe(24);
    expect(nextTrainingHistoryCount(30, 24)).toBe(30);
  });

  it('normalizes invalid requested counts to a safe first page', () => {
    expect(visibleTrainingHistoryCount(30, -5)).toBe(12);
    expect(visibleTrainingHistoryCount(30, Number.NaN)).toBe(12);
  });
});
