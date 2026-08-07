import { describe, expect, it } from 'vitest';

import {
  CATEGORY_HISTORY_STORAGE_KEY,
  loadCategoryHistory,
  MAX_CATEGORY_HISTORY,
  recordPlayedCategories,
  type CategoryHistoryStorage,
} from './category-history.js';

function createMemoryStorage(initial: Record<string, string> = {}): CategoryHistoryStorage {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe('category history (fb#13)', () => {
  it('is empty when nothing is saved', () => {
    expect(loadCategoryHistory(createMemoryStorage())).toEqual([]);
  });

  it('records a round\'s theme ids', () => {
    const storage = createMemoryStorage();
    recordPlayedCategories(['en-a-anatomy', 'en-b-flowers'], storage);

    expect(loadCategoryHistory(storage)).toEqual(['en-a-anatomy', 'en-b-flowers']);
  });

  it('appends across multiple rounds', () => {
    const storage = createMemoryStorage();
    recordPlayedCategories(['en-a-anatomy'], storage);
    recordPlayedCategories(['en-a-animals'], storage);

    expect(loadCategoryHistory(storage)).toEqual(['en-a-anatomy', 'en-a-animals']);
  });

  it('caps history length, dropping the oldest entries first', () => {
    const storage = createMemoryStorage();
    const overflow = Array.from({ length: MAX_CATEGORY_HISTORY + 5 }, (_, i) => `theme-${i}`);
    recordPlayedCategories(overflow, storage);

    const history = loadCategoryHistory(storage);
    expect(history).toHaveLength(MAX_CATEGORY_HISTORY);
    expect(history[0]).toBe(`theme-5`);
    expect(history[history.length - 1]).toBe(`theme-${overflow.length - 1}`);
  });

  it('ignores corrupted stored data instead of throwing', () => {
    const storage = createMemoryStorage({ [CATEGORY_HISTORY_STORAGE_KEY]: '{not json' });
    expect(loadCategoryHistory(storage)).toEqual([]);
  });

  it('ignores a non-array stored value', () => {
    const storage = createMemoryStorage({ [CATEGORY_HISTORY_STORAGE_KEY]: '{"foo":"bar"}' });
    expect(loadCategoryHistory(storage)).toEqual([]);
  });

  it('does nothing when given no theme ids', () => {
    const storage = createMemoryStorage();
    recordPlayedCategories([], storage);
    expect(storage.getItem(CATEGORY_HISTORY_STORAGE_KEY)).toBeNull();
  });
});
