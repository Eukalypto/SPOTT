import { describe, expect, it } from 'vitest';
import { createSeededRandom } from './seeded-random.js';

describe('createSeededRandom', () => {
  it('returns values between 0 and 1', () => {
    const random = createSeededRandom(123);
    for (let index = 0; index < 100; index += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = createSeededRandom(7);
    const second = createSeededRandom(7);

    const firstSequence = Array.from({ length: 10 }, () => first());
    const secondSequence = Array.from({ length: 10 }, () => second());

    expect(firstSequence).toEqual(secondSequence);
  });

  it('produces different sequences for different seeds', () => {
    const randomA = createSeededRandom(1);
    const randomB = createSeededRandom(2);
    const first = Array.from({ length: 10 }, () => randomA());
    const second = Array.from({ length: 10 }, () => randomB());

    expect(first).not.toEqual(second);
  });
});
