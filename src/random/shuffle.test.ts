import { describe, expect, it } from 'vitest';
import { createSeededRandom } from './seeded-random.js';
import { shuffleCopy } from './shuffle.js';

describe('shuffleCopy', () => {
  it('returns a new array with the same elements', () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffleCopy(items, createSeededRandom(7));

    expect(shuffled).not.toBe(items);
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for the same seed', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    const first = shuffleCopy(items, createSeededRandom(123));
    const second = shuffleCopy(items, createSeededRandom(123));

    expect(first).toEqual(second);
  });
});
