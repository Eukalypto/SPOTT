import { describe, expect, it } from 'vitest';

import { EN_TRANSLATIONS, ES_TRANSLATIONS, FR_TRANSLATIONS } from './translations.js';
import { t, tFormat } from './translate.js';
import { TRANSLATION_KEYS } from './types.js';

describe('i18n translate', () => {
  it('returns localized strings for English, French, and Spanish', () => {
    expect(t('navPlaySolo', 'en')).toBe('Play Solo');
    expect(t('navPlaySolo', 'fr')).toBe('Jouer seul');
    expect(t('navPlaySolo', 'es')).toBe('Jugar solo');
  });

  it('returns different copy for the same key across locales when localized', () => {
    expect(t('reviewGrids', 'en')).toBe('Review Grids');
    expect(t('reviewGrids', 'fr')).not.toBe(t('reviewGrids', 'en'));
    expect(t('reviewGrids', 'es')).not.toBe(t('reviewGrids', 'en'));
  });

  it('defines every translation key in English, French, and Spanish', () => {
    for (const key of TRANSLATION_KEYS) {
      expect(EN_TRANSLATIONS[key].length).toBeGreaterThan(0);
      expect(FR_TRANSLATIONS[key].length).toBeGreaterThan(0);
      expect(ES_TRANSLATIONS[key].length).toBeGreaterThan(0);
    }
  });

  it('falls back to English when a locale entry is missing', () => {
    expect(t('appTitle', 'fr')).toBe('Spott');
  });

  it('falls back to the key when neither locale nor English has a translation', () => {
    expect(t('nonexistentKey' as never, 'en')).toBe('nonexistentKey');
  });

  it('interpolates placeholder values', () => {
    expect(tFormat('unfinishedGrids', 'en', { count: 3 })).toBe('3 unfinished');
    expect(tFormat('errorMissingWordSet', 'fr', { language: 'Espagnol' })).toContain('Espagnol');
  });

  it('localizes required UI labels in all three languages', () => {
    for (const locale of ['en', 'fr', 'es'] as const) {
      expect(t('score', locale).length).toBeGreaterThan(0);
      expect(t('reviewGrids', locale).length).toBeGreaterThan(0);
      expect(t('roundGenerationFailed', locale).length).toBeGreaterThan(0);
      expect(t('tryAgain', locale).length).toBeGreaterThan(0);
    }
  });
});
