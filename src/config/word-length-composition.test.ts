import { describe, expect, it } from 'vitest';

import { computeWordLengthComposition } from './word-length-composition.js';

function toMap(composition: readonly { length: number; count: number }[] | null) {
  if (!composition) return null;
  return Object.fromEntries(composition.map(({ length, count }) => [length, count]));
}

describe('computeWordLengthComposition (fb#3e)', () => {
  it('passes through the standard composition when a theme has ample words of every length', () => {
    const result = computeWordLengthComposition({ 4: 10, 5: 10, 6: 10, 7: 10 });

    expect(toMap(result)).toEqual({ 4: 2, 5: 2, 6: 1, 7: 1 });
  });

  it('e1: redistributes a zero-count length to lengths with surplus (Dog Breeds: 0×4)', () => {
    // Dog Breeds-shaped pool: 0 four-letter words, plenty of 5/6/7.
    const result = computeWordLengthComposition({ 4: 0, 5: 10, 6: 10, 7: 10 });

    expect(result).not.toBeNull();
    const byLength = toMap(result)!;
    expect(byLength[4] ?? 0).toBe(0);
    const total = Object.values(byLength).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(6);
  });

  it('e2: merges an exactly-at-minimum length away for variety (Sports: 2×5 -> merge up)', () => {
    // Only 2 five-letter words (RUGBY, DARTS) — using them every time has zero
    // variety, so the slot should move to a length with real surplus.
    const result = computeWordLengthComposition({ 4: 10, 5: 2, 6: 10, 7: 10 });

    expect(result).not.toBeNull();
    const byLength = toMap(result)!;
    expect(byLength[5] ?? 0).toBe(0);
    const total = Object.values(byLength).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(6);
  });

  it('never asks for more words of a length than are available', () => {
    const available = { 4: 0, 5: 1, 6: 10, 7: 5 };
    const result = computeWordLengthComposition(available);

    expect(result).not.toBeNull();
    for (const { length, count } of result!) {
      expect(count).toBeLessThanOrEqual(available[length as keyof typeof available]);
    }
  });

  it('never exceeds the empirically-safe per-length placement cap', () => {
    // Huge surplus everywhere except one deficient length — without a cap,
    // redistribution could pile every spare slot onto a single length.
    const result = computeWordLengthComposition({ 4: 0, 5: 100, 6: 1, 7: 1 });

    expect(result).not.toBeNull();
    const byLength = toMap(result)!;
    expect(byLength[5] ?? 0).toBeLessThanOrEqual(4);
  });

  it('e3: returns the best-effort shape for a very small category', () => {
    const result = computeWordLengthComposition({ 4: 3, 5: 2, 6: 1, 7: 0 });

    expect(result).not.toBeNull();
    const total = result!.reduce((sum, entry) => sum + entry.count, 0);
    expect(total).toBe(6);
  });

  it('returns null when the theme cannot possibly supply six words', () => {
    const result = computeWordLengthComposition({ 4: 1, 5: 1, 6: 1, 7: 1 });

    expect(result).toBeNull();
  });

  it('returns null for a theme with no words at all', () => {
    const result = computeWordLengthComposition({ 4: 0, 5: 0, 6: 0, 7: 0 });

    expect(result).toBeNull();
  });

  it('never drops an available length to zero when it could keep a slot', () => {
    // Every length has at least the baseline count, with a single spare
    // 6-letter word pushing that one bucket into surplus. The redistribution
    // path used to fully satisfy the deficit from the first couple of
    // restorable lengths in a fixed order, leaving a later, equally-available
    // length (7) at zero for no reason.
    const result = computeWordLengthComposition({ 4: 2, 5: 2, 6: 2, 7: 1 });

    expect(result).not.toBeNull();
    const byLength = toMap(result)!;
    expect(byLength[7] ?? 0).toBeGreaterThan(0);
    const total = Object.values(byLength).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(6);
  });

  it('every returned composition entry has a positive count', () => {
    const result = computeWordLengthComposition({ 4: 0, 5: 10, 6: 10, 7: 10 });

    for (const entry of result!) {
      expect(entry.count).toBeGreaterThan(0);
    }
  });
});
