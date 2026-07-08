import { GAME_CONFIG, getSampleWordSet } from '@spott/engine';
import { describe, expect, it } from 'vitest';

import { getPlayableLanguages } from './constants.js';
import { EN_TRANSLATIONS, ES_TRANSLATIONS, FR_TRANSLATIONS } from './i18n/translations.js';
import { t, tFormat } from './i18n/translate.js';
import { TRANSLATION_KEYS } from './i18n/types.js';
import {
  loadPersistedLanguage,
  savePersistedLanguage,
  SELECTED_LANGUAGE_STORAGE_KEY,
  type LanguageStorage,
} from './utils/language-persistence.js';
import { formatRoundStartError, startPracticeRoundState } from './utils/round-setup.js';
import type { RoundStartFailureReason } from './utils/round-start-error.js';

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

describe('Phase 3: multilingual Classic Practice', () => {
  describe('sample word sets', () => {
    it('exposes French and Spanish sample word sets for Practice mode', () => {
      expect(getSampleWordSet('fr')).toBeDefined();
      expect(getSampleWordSet('fr')?.language).toBe('fr');
      expect(getSampleWordSet('fr')?.themes.length).toBeGreaterThanOrEqual(7);

      expect(getSampleWordSet('es')).toBeDefined();
      expect(getSampleWordSet('es')?.language).toBe('es');
      expect(getSampleWordSet('es')?.themes.length).toBeGreaterThanOrEqual(7);
    });

    it('registers sample word sets for every playable language', () => {
      expect(getPlayableLanguages()).toEqual(['en', 'fr', 'es']);

      for (const language of getPlayableLanguages()) {
        expect(getSampleWordSet(language)?.language).toBe(language);
      }
    });
  });

  describe('round generation', () => {
    it('generates playable rounds for English, French, and Spanish', () => {
      for (const language of ['en', 'fr', 'es'] as const) {
        const result = startPracticeRoundState({
          roundId: `phase-3-${language}`,
          language,
          uiLocale: language,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.roundState.round.language).toBe(language);
          expect(result.roundState.round.grids).toHaveLength(GAME_CONFIG.gridsPerRound);
        }
      }
    });
  });

  describe('translation helper', () => {
    it('returns localized strings for supported locales', () => {
      expect(t('startPracticeRound', 'en')).toBe('Start Practice Round');
      expect(t('startPracticeRound', 'fr')).toContain('entraînement');
      expect(t('startPracticeRound', 'es')).toContain('práctica');
      expect(tFormat('unfinishedGrids', 'es', { count: 2 })).toContain('2');
    });

    it('falls back to English for missing keys and keeps dictionaries in sync', () => {
      expect(t('nonexistentKey' as never, 'en')).toBe('nonexistentKey');
      expect(t('appTitle', 'fr')).toBe(EN_TRANSLATIONS.appTitle);

      for (const key of TRANSLATION_KEYS) {
        expect(FR_TRANSLATIONS[key]).toBeTruthy();
        expect(ES_TRANSLATIONS[key]).toBeTruthy();
      }
    });
  });

  describe('language persistence', () => {
    it('saves, restores, and rejects invalid language codes', () => {
      const storage = createMemoryStorage();

      savePersistedLanguage('fr', storage);
      expect(storage.getItem(SELECTED_LANGUAGE_STORAGE_KEY)).toBe('fr');
      expect(loadPersistedLanguage(storage)).toBe('fr');

      savePersistedLanguage('de' as 'en', storage);
      expect(storage.getItem(SELECTED_LANGUAGE_STORAGE_KEY)).toBe('fr');

      expect(loadPersistedLanguage(createMemoryStorage({ [SELECTED_LANGUAGE_STORAGE_KEY]: 'xx' }))).toBe(
        'en',
      );
    });
  });

  describe('round generation error mapping', () => {
    it.each([
      'missing-word-set',
      'theme-selection-failed',
      'grid-generation-failed',
      'unknown',
    ] as const satisfies readonly RoundStartFailureReason[])(
      'returns localized copy for %s without raw engine codes',
      (reason) => {
        for (const locale of ['en', 'fr', 'es'] as const) {
          const message = formatRoundStartError(reason, locale, locale);
          expect(message).not.toContain(reason);
          expect(message.length).toBeGreaterThan(10);
        }
      },
    );
  });
});
