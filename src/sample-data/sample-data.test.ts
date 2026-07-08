import { describe, expect, it } from 'vitest';
import { generateRound } from '../round-generation/generate-round.js';
import { normalizeWord } from '../normalization/normalize-word.js';
import { validateLanguageWordSet } from '../word-set-validation/validate-language-word-set.js';
import {
  ENGLISH_SAMPLE_THEMES,
  ENGLISH_SAMPLE_WORD_SET,
  FRENCH_SAMPLE_THEMES,
  FRENCH_SAMPLE_WORD_SET,
  SAMPLE_WORD_SETS,
  SPANISH_SAMPLE_THEMES,
  SPANISH_SAMPLE_WORD_SET,
  getSampleWordSet,
} from './index.js';
import { GAME_CONFIG } from '../config/index.js';

function expectValidWordSet(
  wordSet: typeof ENGLISH_SAMPLE_WORD_SET,
  themes: readonly typeof ENGLISH_SAMPLE_THEMES,
): void {
  const result = validateLanguageWordSet(wordSet);
  expect(result.errors).toEqual([]);
  expect(result.isValid).toBe(true);
  expect(result.warnings).toEqual([]);

  const byTier = Object.groupBy(themes, (theme) => theme.difficultyTier);
  expect(byTier.A).toHaveLength(2);
  expect(byTier.B).toHaveLength(2);
  expect(byTier.C).toHaveLength(1);
  expect(byTier.D).toHaveLength(1);
  expect(byTier.E).toHaveLength(1);

  for (const theme of themes) {
    for (const { length, count } of GAME_CONFIG.wordLengthComposition) {
      expect(theme.wordsByLength[length].length).toBeGreaterThanOrEqual(count);
    }
  }
}

describe('English sample word set', () => {
  it('passes LanguageWordSet validation', () => {
    expectValidWordSet(ENGLISH_SAMPLE_WORD_SET, ENGLISH_SAMPLE_THEMES);
  });
});

describe('French sample word set', () => {
  it('passes LanguageWordSet validation', () => {
    expectValidWordSet(FRENCH_SAMPLE_WORD_SET, FRENCH_SAMPLE_THEMES);
  });
});

describe('Spanish sample word set', () => {
  it('passes LanguageWordSet validation', () => {
    expectValidWordSet(SPANISH_SAMPLE_WORD_SET, SPANISH_SAMPLE_THEMES);
  });

  it('preserves ñ as distinct from n after normalization', () => {
    expect(normalizeWord('niño', 'es')).toBe('niño');
    expect(normalizeWord('nino', 'es')).toBe('nino');
    expect(normalizeWord('niño', 'es')).not.toBe(normalizeWord('nino', 'es'));
    expect(normalizeWord('caña', 'es')).toContain('ñ');
    expect(normalizeWord('montaña', 'es')).toContain('ñ');
  });
});

describe('SAMPLE_WORD_SETS registry', () => {
  it('registers English, French, and Spanish word sets', () => {
    expect(SAMPLE_WORD_SETS.en).toBe(ENGLISH_SAMPLE_WORD_SET);
    expect(SAMPLE_WORD_SETS.fr).toBe(FRENCH_SAMPLE_WORD_SET);
    expect(SAMPLE_WORD_SETS.es).toBe(SPANISH_SAMPLE_WORD_SET);
    expect(getSampleWordSet('en')).toBe(ENGLISH_SAMPLE_WORD_SET);
    expect(getSampleWordSet('fr')).toBe(FRENCH_SAMPLE_WORD_SET);
    expect(getSampleWordSet('es')).toBe(SPANISH_SAMPLE_WORD_SET);
  });
});

describe('generateRound with sample word sets', () => {
  it.each(['en', 'fr', 'es'] as const)('generates a Classic round for %s', (language) => {
    const result = generateRound({ id: `sample-${language}`, language });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.round.language).toBe(language);
    expect(result.round.grids).toHaveLength(GAME_CONFIG.gridsPerRound);
  });
});
