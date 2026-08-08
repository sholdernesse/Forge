export type ISODate = `${number}-${number}-${number}`;
export type ISODateTime = string;

export type Confidence = number;

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}
