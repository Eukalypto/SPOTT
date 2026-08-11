import { describe, expect, it, vi } from 'vitest';
import { DIFFICULTY_SEQUENCE, GAME_CONFIG, GRID_MASKING_POLICIES } from '../config/index.js';
import * as gridGeneration from '../grid-generation/index.js';
import { createSeededRandom } from '../random/index.js';
import * as sampleData from '../sample-data/index.js';
import { ENGLISH_SAMPLE_WORD_SET } from '../sample-data/index.js';
import { ENGLISH_SAMPLE_THEMES } from '../sample-data/english/themes.js';
import { toLanguageWordSet } from '../sample-data/types.js';
import type { DifficultyTier } from '../types/difficulty.js';
import type { MaskType } from '../types/masking.js';
import type { LanguageWordSet, PlacedWord, ThemeWordSet } from '../types/word.js';
import {
  expectedMaskCountsForGrid,
  generateRound,
  selectThemesForRound,
} from './generate-round.js';

function maskCounts(words: readonly PlacedWord[]): Record<MaskType, number> {
  return words.reduce<Record<MaskType, number>>(
    (counts, word) => {
      counts[word.maskType] = (counts[word.maskType] ?? 0) + 1;
      return counts;
    },
    { none: 0, partial: 0, full: 0 },
  );
}

function generateEnglishRound(id = 'round-test') {
  const result = generateRound({ id, language: 'en' });
  if (!result.success) {
    throw new Error(`Round generation failed: ${result.reason}`);
  }
  return result.round;
}

describe('generateRound', () => {
  it('returns a round with exactly seven grids', () => {
    const round = generateEnglishRound();
    expect(round.grids).toHaveLength(7);
    expect(round.themeIds).toHaveLength(7);
  });

  it('assigns the Classic difficulty sequence to each grid', () => {
    const round = generateEnglishRound();

    round.grids.forEach((grid, index) => {
      expect(grid.index).toBe(index);
      expect(grid.difficulty).toBe(DIFFICULTY_SEQUENCE[index]);
    });
  });

  it('uses unique themes with no repeats inside the round', () => {
    const round = generateEnglishRound();
    const uniqueThemeIds = new Set(round.themeIds);

    expect(uniqueThemeIds.size).toBe(7);

    round.grids.forEach((grid, index) => {
      expect(grid.themeId).toBe(round.themeIds[index]);
      expect(new Set(round.grids.map((entry) => entry.themeId)).size).toBe(7);
    });
  });

  it('places six words on every grid', () => {
    const round = generateEnglishRound();

    for (const grid of round.grids) {
      expect(grid.placedWords).toHaveLength(GAME_CONFIG.wordsPerGrid);
      expect(grid.size).toBe(GAME_CONFIG.gridSize);
    }
  });

  it('applies masking according to each grid number', () => {
    const round = generateEnglishRound();

    round.grids.forEach((grid, index) => {
      expect(grid.maskingPolicy).toEqual(GRID_MASKING_POLICIES[index]);

      const counts = maskCounts(grid.placedWords);
      const expected = expectedMaskCountsForGrid(index);

      expect(counts.full).toBe(expected.full);
      expect(counts.partial).toBe(expected.partial);
      expect(counts.none).toBe(expected.none);
    });
  });

  it('defaults to English and stays language-aware', () => {
    const round = generateRound({ id: 'round-en-default' });
    expect(round.success).toBe(true);
    if (round.success) {
      expect(round.round.language).toBe('en');
    }
  });

  it('accepts an explicit language word set', () => {
    const wordSet = toLanguageWordSet('en', ENGLISH_SAMPLE_THEMES);
    const result = generateRound({
      id: 'round-custom-word-set',
      language: 'en',
      wordSet,
    });

    expect(result.success).toBe(true);
  });

  it('returns missing-word-set when no word set exists for a language', () => {
    vi.spyOn(sampleData, 'getSampleWordSet').mockReturnValue(undefined);

    expect(generateRound({ id: 'round-en', language: 'en' })).toEqual({
      success: false,
      reason: 'missing-word-set',
    });

    vi.restoreAllMocks();
  });

  it('generates a round for French and Spanish sample word sets', () => {
    const french = generateRound({ id: 'round-fr', language: 'fr' });
    expect(french.success).toBe(true);

    const spanish = generateRound({ id: 'round-es', language: 'es' });
    expect(spanish.success).toBe(true);
  });

  it('returns missing-word-set when the word set language does not match', () => {
    const frenchSet: LanguageWordSet = {
      language: 'fr',
      themes: [],
    };

    expect(
      generateRound({
        id: 'round-lang-mismatch',
        language: 'en',
        wordSet: frenchSet,
      }),
    ).toEqual({
      success: false,
      reason: 'missing-word-set',
    });
  });

  it('returns theme-selection-failed when a difficulty tier lacks a second theme', () => {
    const wordSet: LanguageWordSet = {
      language: 'en',
      themes: [
        theme('theme-a1', 'A1', 'A'),
        theme('theme-b1', 'B1', 'B'),
        theme('theme-c', 'C', 'C'),
        theme('theme-d', 'D', 'D'),
        theme('theme-e', 'E', 'E'),
        theme('theme-a2', 'A2', 'A'),
        theme('theme-extra', 'Extra', 'C'),
      ],
    };

    expect(generateRound({ id: 'round-theme-fail', language: 'en', wordSet })).toEqual({
      success: false,
      reason: 'theme-selection-failed',
    });
  });

  it('returns grid-generation-failed when a grid cannot be built', () => {
    const spy = vi.spyOn(gridGeneration, 'generateGrid').mockReturnValue({
      success: false,
      reason: 'placement-impossible',
    });

    const result = generateRound({ id: 'round-grid-fail', language: 'en' });

    spy.mockRestore();
    expect(result).toEqual({ success: false, reason: 'grid-generation-failed' });
  });

  it('produces deterministic rounds with a seeded random function', () => {
    const options = {
      id: 'round-seeded',
      language: 'en' as const,
      random: createSeededRandom(2024),
    };
    const first = generateRound(options);
    const second = generateRound({ ...options, random: createSeededRandom(2024) });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    if (!first.success || !second.success) {
      return;
    }

    expect(first.round.themeIds).toEqual(second.round.themeIds);
    expect(first.round.grids.map((grid) => grid.cells)).toEqual(
      second.round.grids.map((grid) => grid.cells),
    );
  });
});

describe('selectThemesForRound', () => {
  it('selects themes matching the difficulty sequence without reuse', () => {
    const themes = selectThemesForRound(ENGLISH_SAMPLE_WORD_SET);
    expect(themes).not.toBeNull();

    themes?.forEach((theme, index) => {
      expect(theme.difficultyTier).toBe(DIFFICULTY_SEQUENCE[index]);
    });

    const themeIds = themes?.map((theme) => theme.themeId) ?? [];
    expect(new Set(themeIds).size).toBe(themeIds.length);
  });

  it('returns null when the second B-tier theme is unavailable', () => {
    const wordSet: LanguageWordSet = {
      language: 'en',
      themes: [
        theme('theme-a1', 'A1', 'A'),
        theme('theme-b1', 'B1', 'B'),
        theme('theme-c', 'C', 'C'),
        theme('theme-d', 'D', 'D'),
        theme('theme-e', 'E', 'E'),
        theme('theme-a2', 'A2', 'A'),
      ],
    };

    expect(selectThemesForRound(wordSet)).toBeNull();
  });

  it('never reuses a theme within the same round', () => {
    const themes = selectThemesForRound(ENGLISH_SAMPLE_WORD_SET);
    expect(themes).not.toBeNull();
    if (!themes) {
      return;
    }

    const ids = themes.map((entry) => entry.themeId);
    expect(new Set(ids).size).toBe(GAME_CONFIG.gridsPerRound);
  });

  it('varies theme selection across seeds instead of always picking the same order', () => {
    const orders = new Set(
      [1, 2, 3, 4, 5].map((seed) => {
        const themes = selectThemesForRound(
          ENGLISH_SAMPLE_WORD_SET,
          DIFFICULTY_SEQUENCE,
          createSeededRandom(seed),
        );
        return themes?.map((theme) => theme.themeId).join(',');
      }),
    );

    expect(orders.size).toBeGreaterThan(1);
  });

  it('is deterministic for a given seed', () => {
    const first = selectThemesForRound(
      ENGLISH_SAMPLE_WORD_SET,
      DIFFICULTY_SEQUENCE,
      createSeededRandom(42),
    );
    const second = selectThemesForRound(
      ENGLISH_SAMPLE_WORD_SET,
      DIFFICULTY_SEQUENCE,
      createSeededRandom(42),
    );

    expect(first?.map((theme) => theme.themeId)).toEqual(
      second?.map((theme) => theme.themeId),
    );
  });

  it('avoids recently played themes when the tier has another candidate (fb#13)', () => {
    // A and B each need 2 unique themes since DIFFICULTY_SEQUENCE uses each tier twice.
    const wordSet: LanguageWordSet = {
      language: 'en',
      themes: [
        theme('theme-a1', 'A1', 'A'),
        theme('theme-a2', 'A2', 'A'),
        theme('theme-b1', 'B1', 'B'),
        theme('theme-b2', 'B2', 'B'),
        theme('theme-c', 'C', 'C'),
        theme('theme-d', 'D', 'D'),
        theme('theme-e', 'E', 'E'),
      ],
    };

    const themes = selectThemesForRound(
      wordSet,
      DIFFICULTY_SEQUENCE,
      Math.random,
      new Set(['theme-a1']),
    );

    expect(themes?.find((entry) => entry.difficultyTier === 'A')?.themeId).toBe('theme-a2');
  });

  it('falls back to a recently played theme rather than failing when it is the only candidate', () => {
    const wordSet: LanguageWordSet = {
      language: 'en',
      themes: [
        theme('theme-a1', 'A1', 'A'),
        theme('theme-a2', 'A2', 'A'),
        theme('theme-b1', 'B1', 'B'),
        theme('theme-b2', 'B2', 'B'),
        theme('theme-c', 'C', 'C'),
        theme('theme-d', 'D', 'D'),
        theme('theme-e', 'E', 'E'),
      ],
    };

    // Both C candidates (there's only one) are "recently played" -- must still be used.
    const themes = selectThemesForRound(
      wordSet,
      DIFFICULTY_SEQUENCE,
      Math.random,
      new Set(['theme-c']),
    );

    expect(themes?.find((entry) => entry.difficultyTier === 'C')?.themeId).toBe('theme-c');
  });

  it('picks a flexible-composition theme (fb#3e) exactly as often as a standard one', () => {
    // Three B-tier candidates competing for the sequence's two B slots — one
    // carries a build-time-baked wordLengthComposition override. The user's
    // explicit fb#3e requirement is that this must not shift how often it's
    // chosen relative to the two plain-standard candidates.
    const wordSet: LanguageWordSet = {
      language: 'en',
      themes: [
        theme('theme-a1', 'A1', 'A'),
        theme('theme-a2', 'A2', 'A'),
        theme('theme-b-standard-1', 'B Standard 1', 'B'),
        theme('theme-b-standard-2', 'B Standard 2', 'B'),
        {
          ...theme('theme-b-flexible', 'B Flexible', 'B'),
          wordLengthComposition: [
            { length: 4, count: 3 },
            { length: 6, count: 2 },
            { length: 7, count: 1 },
          ],
        },
        theme('theme-c', 'C', 'C'),
        theme('theme-d', 'D', 'D'),
        theme('theme-e', 'E', 'E'),
      ],
    };

    // With 3 candidates filling 2 of the sequence's B slots each round, every
    // candidate should be chosen (into either slot) in ~2/3 of trials if
    // selection is composition-blind.
    const trials = 400;
    const picks = { 'theme-b-standard-1': 0, 'theme-b-standard-2': 0, 'theme-b-flexible': 0 };
    for (let seed = 1; seed <= trials; seed++) {
      const themes = selectThemesForRound(wordSet, DIFFICULTY_SEQUENCE, createSeededRandom(seed));
      const bThemeIds = new Set(themes?.filter((entry) => entry.difficultyTier === 'B').map((entry) => entry.themeId));
      for (const id of Object.keys(picks)) {
        if (bThemeIds.has(id)) {
          picks[id as keyof typeof picks] += 1;
        }
      }
    }

    const rates = Object.values(picks).map((count) => count / trials);
    for (const rate of rates) {
      expect(rate).toBeGreaterThan(0.5);
      expect(rate).toBeLessThan(0.85);
    }
    // The flexible candidate's rate shouldn't be a statistical outlier next
    // to the two standard candidates.
    const [standard1, standard2, flexible] = rates;
    expect(Math.abs(flexible - standard1)).toBeLessThan(0.2);
    expect(Math.abs(flexible - standard2)).toBeLessThan(0.2);
  });
});

function theme(themeId: string, label: string, difficultyTier: DifficultyTier): ThemeWordSet {
  return {
    themeId,
    label,
    difficultyTier,
    words: ['bear', 'wolf', 'tiger', 'eagle', 'forest', 'country'],
  };
}
