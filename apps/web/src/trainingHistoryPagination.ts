export const TRAINING_HISTORY_PAGE_SIZE = 12;

export function visibleTrainingHistoryCount(total: number, requested: number) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  if (!Number.isFinite(requested)) return Math.min(total, TRAINING_HISTORY_PAGE_SIZE);
  return Math.min(total, Math.max(TRAINING_HISTORY_PAGE_SIZE, Math.floor(requested)));
}

export function nextTrainingHistoryCount(total: number, visible: number) {
  return visibleTrainingHistoryCount(total, visible + TRAINING_HISTORY_PAGE_SIZE);
}
