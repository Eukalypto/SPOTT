import { describe, expect, it } from 'vitest';

import {
  isValidLanguageCode,
  loadPersistedLanguage,
  savePersistedLanguage,
  SELECTED_LANGUAGE_STORAGE_KEY,
  type LanguageStorage,
} from './language-persistence.js';

function createMemoryStorage(initial: Record<string, string> = {}): LanguageStorage {
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

describe('language persistence', () => {
  it('defaults to English when nothing is saved', () => {
    expect(loadPersistedLanguage(createMemoryStorage())).toBe('en');
  });

  it('restores a previously saved language', () => {
    const storage = createMemoryStorage({ [SELECTED_LANGUAGE_STORAGE_KEY]: 'fr' });
    expect(loadPersistedLanguage(storage)).toBe('fr');
  });

  it('ignores invalid saved values and defaults to English', () => {
    expect(loadPersistedLanguage(createMemoryStorage({ [SELECTED_LANGUAGE_STORAGE_KEY]: 'de' }))).toBe(
      'en',
    );
    expect(loadPersistedLanguage(createMemoryStorage({ [SELECTED_LANGUAGE_STORAGE_KEY]: 'EN' }))).toBe(
      'en',
    );
    expect(loadPersistedLanguage(createMemoryStorage({ [SELECTED_LANGUAGE_STORAGE_KEY]: '' }))).toBe(
      'en',
    );
  });

  it('persists valid language codes', () => {
    const storage = createMemoryStorage();
    savePersistedLanguage('es', storage);
    expect(storage.getItem(SELECTED_LANGUAGE_STORAGE_KEY)).toBe('es');
    expect(loadPersistedLanguage(storage)).toBe('es');
  });

  it('does not persist invalid language codes', () => {
    const storage = createMemoryStorage();
    savePersistedLanguage('de' as 'en', storage);
    expect(storage.getItem(SELECTED_LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  it('validates supported language codes', () => {
    expect(isValidLanguageCode('en')).toBe(true);
    expect(isValidLanguageCode('fr')).toBe(true);
    expect(isValidLanguageCode('es')).toBe(true);
    expect(isValidLanguageCode('de')).toBe(false);
    expect(isValidLanguageCode(null)).toBe(false);
  });
});
