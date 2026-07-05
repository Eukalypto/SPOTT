import { describe, expect, it } from 'vitest';
import { validateLanguageWordSet } from '../word-set-validation/validate-language-word-set.js';
import {
  ENGLISH_SAMPLE_THEMES,
  ENGLISH_SAMPLE_WORD_SET,
  SAMPLE_WORD_SETS,
  getSampleWordSet,
} from './index.js';
import { GAME_CONFIG } from '../config/index.js';

describe('English sample word set', () => {
  it('passes LanguageWordSet validation', () => {
    const result = validateLanguageWordSet(ENGLISH_SAMPLE_WORD_SET);
    expect(result.errors).toEqual([]);
    expect(result.isValid).toBe(true);
  });

  it('has no bare-minimum warnings because themes include spare words', () => {
    const result = validateLanguageWordSet(ENGLISH_SAMPLE_WORD_SET);
    expect(result.warnings).toEqual([]);
  });

  it('covers Classic difficulty tier requirements', () => {
    const byTier = Object.groupBy(
      ENGLISH_SAMPLE_THEMES,
      (theme) => theme.difficultyTier,
    );

    expect(byTier.A).toHaveLength(2);
    expect(byTier.B).toHaveLength(2);
    expect(byTier.C).toHaveLength(1);
    expect(byTier.D).toHaveLength(1);
    expect(byTier.E).toHaveLength(1);
  });

  it('provides at least the minimum word counts per length in every theme', () => {
    for (const theme of ENGLISH_SAMPLE_THEMES) {
      for (const { length, count } of GAME_CONFIG.wordLengthComposition) {
        expect(theme.wordsByLength[length].length).toBeGreaterThanOrEqual(count);
      }
    }
  });

  it('is registered in SAMPLE_WORD_SETS', () => {
    expect(SAMPLE_WORD_SETS.en).toBe(ENGLISH_SAMPLE_WORD_SET);
    expect(getSampleWordSet('en')).toBe(ENGLISH_SAMPLE_WORD_SET);
    expect(getSampleWordSet('fr')).toBeUndefined();
    expect(getSampleWordSet('es')).toBeUndefined();
  });
});
