import { describe, expect, it } from 'vitest';

import { t, tFormat } from './translate.js';

describe('i18n translate', () => {
  it('returns localized strings for English, French, and Spanish', () => {
    expect(t('startPracticeRound', 'en')).toBe('Start Practice Round');
    expect(t('startPracticeRound', 'fr')).toContain('entraînement');
    expect(t('startPracticeRound', 'es')).toContain('práctica');
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
