import type { LanguageCode } from '@spott/engine';

import { DEFAULT_PRACTICE_LANGUAGE } from '../constants.js';

export const SELECTED_LANGUAGE_STORAGE_KEY = 'spott.selectedLanguage';

const VALID_LANGUAGE_CODES = new Set<LanguageCode>(['en', 'fr', 'es']);

export interface LanguageStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export function isValidLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && VALID_LANGUAGE_CODES.has(value as LanguageCode);
}

function getDefaultStorage(): LanguageStorage | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}

/** Read the saved language, or {@link DEFAULT_PRACTICE_LANGUAGE} when missing or invalid. */
export function loadPersistedLanguage(
  storage: LanguageStorage | null = getDefaultStorage(),
  defaultLanguage: LanguageCode = DEFAULT_PRACTICE_LANGUAGE,
): LanguageCode {
  if (!storage) {
    return defaultLanguage;
  }

  const saved = storage.getItem(SELECTED_LANGUAGE_STORAGE_KEY);
  return isValidLanguageCode(saved) ? saved : defaultLanguage;
}

/** Persist the player's language choice for the next app load. */
export function savePersistedLanguage(
  language: LanguageCode,
  storage: LanguageStorage | null = getDefaultStorage(),
): void {
  if (!storage || !isValidLanguageCode(language)) {
    return;
  }

  storage.setItem(SELECTED_LANGUAGE_STORAGE_KEY, language);
}

/** Remove the saved language so the app falls back to the default on next load. */
export function resetPersistedLanguage(
  storage: LanguageStorage | null = getDefaultStorage(),
): void {
  if (!storage) {
    return;
  }

  if (storage.removeItem) {
    storage.removeItem(SELECTED_LANGUAGE_STORAGE_KEY);
    return;
  }

  storage.setItem(SELECTED_LANGUAGE_STORAGE_KEY, DEFAULT_PRACTICE_LANGUAGE);
}
