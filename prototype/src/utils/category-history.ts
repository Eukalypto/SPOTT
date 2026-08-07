/**
 * Tracks recently played categories (theme ids) per player, even as a guest, so
 * Solo rounds can favor categories the player hasn't seen in a while (fb#13).
 * Storage is a flat, capped list — lightweight, no server round-trip needed.
 */

export const CATEGORY_HISTORY_STORAGE_KEY = 'spott.recentCategoryHistory';

/** How many recently played theme ids to remember before the oldest roll off. */
export const MAX_CATEGORY_HISTORY = 40;

export interface CategoryHistoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getDefaultStorage(): CategoryHistoryStorage | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

/** Most-recently-played theme ids last; empty when nothing is saved yet or storage is unavailable. */
export function loadCategoryHistory(
  storage: CategoryHistoryStorage | null = getDefaultStorage(),
): string[] {
  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(CATEGORY_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Append a round's theme ids to the history, capped to {@link MAX_CATEGORY_HISTORY}. */
export function recordPlayedCategories(
  themeIds: readonly string[],
  storage: CategoryHistoryStorage | null = getDefaultStorage(),
): void {
  if (!storage || themeIds.length === 0) {
    return;
  }

  const updated = [...loadCategoryHistory(storage), ...themeIds].slice(-MAX_CATEGORY_HISTORY);

  try {
    storage.setItem(CATEGORY_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full or unavailable — variety is a nice-to-have, never block play over it.
  }
}
