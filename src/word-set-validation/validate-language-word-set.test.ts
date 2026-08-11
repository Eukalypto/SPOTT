import { describe, expect, it } from 'vitest';
import type { DifficultyTier } from '../types/difficulty.js';
import type { LanguageWordSet, ThemeWordSet } from '../types/index.js';
import { validateLanguageWordSet } from './validate-language-word-set.js';

const FOUR_LETTER_POOL = [
  ['bear', 'wolf'],
  ['lion', 'deer'],
  ['duck', 'frog'],
  ['cake', 'corn'],
  ['blue', 'teal'],
  ['cold', 'warm'],
  ['fast', 'slow'],
] as const;

const FIVE_LETTER_POOL = [
  ['tiger', 'eagle'],
  ['whale', 'shark'],
  ['horse', 'zebra'],
  ['grape', 'melon'],
  ['brick', 'stone'],
  ['cloud', 'storm'],
  ['light', 'night'],
] as const;

const SIX_LETTER_POOL = [
  'forest',
  'planet',
  'garden',
  'castle',
  'silver',
  'orange',
  'purple',
] as const;

const SEVEN_LETTER_POOL = [
  'country',
  'animals',
  'flowers',
  'kitchen',
  'rainbow',
  'teacher',
  'village',
] as const;

const SPARE_WORDS = [
  'sparex',
  'sparey',
  'sparez',
  'sparea',
  'spareb',
  'sparec',
  'spared',
] as const;

function uniqueThemeWords(index: number, includeSpare = true): readonly string[] {
  const words = [
    ...FOUR_LETTER_POOL[index],
    ...FIVE_LETTER_POOL[index],
    SIX_LETTER_POOL[index],
    SEVEN_LETTER_POOL[index],
  ];
  return includeSpare ? [...words, SPARE_WORDS[index]] : words;
}

function createTheme(
  themeId: string,
  label: string,
  difficultyTier: DifficultyTier,
  index: number,
  includeSpare = true,
): ThemeWordSet {
  return {
    themeId,
    label,
    difficultyTier,
    words: uniqueThemeWords(index, includeSpare),
  };
}

const CLASSIC_TIER_LAYOUT: Array<{ themeId: string; label: string; tier: DifficultyTier; index: number }> = [
  { themeId: 'theme-a1', label: 'Theme A1', tier: 'A', index: 0 },
  { themeId: 'theme-a2', label: 'Theme A2', tier: 'A', index: 1 },
  { themeId: 'theme-b1', label: 'Theme B1', tier: 'B', index: 2 },
  { themeId: 'theme-b2', label: 'Theme B2', tier: 'B', index: 3 },
  { themeId: 'theme-c', label: 'Theme C', tier: 'C', index: 4 },
  { themeId: 'theme-d', label: 'Theme D', tier: 'D', index: 5 },
  { themeId: 'theme-e', label: 'Theme E', tier: 'E', index: 6 },
];

function createValidEnglishWordSet(includeSpare = true): LanguageWordSet {
  return {
    language: 'en',
    themes: CLASSIC_TIER_LAYOUT.map(({ themeId, label, tier, index }) =>
      createTheme(themeId, label, tier, index, includeSpare),
    ),
  };
}

describe('validateLanguageWordSet — valid sets', () => {
  it('accepts a fully valid English Classic word set', () => {
    const result = validateLanguageWordSet(createValidEnglishWordSet());
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    // fb#3e: each theme's spare word gives its 6-letter bucket genuine
    // surplus, which is enough for computeWordLengthComposition to legally
    // redistribute a slot away from the standard shape for variety — that's
    // an informational (non-standard composition) warning, not a defect.
    expect(result.warnings.every((warning) => warning.includes('non-standard word-length composition'))).toBe(
      true,
    );
  });

  it('accepts valid French word sets with accent normalization', () => {
    const result = validateLanguageWordSet({
      language: 'fr',
      themes: CLASSIC_TIER_LAYOUT.map(({ themeId, label, tier, index }) =>
        createTheme(themeId, label, tier, index),
      ).map((theme, index) => ({
        ...theme,
        words: [
          ...uniqueThemeWords(index).slice(0, 6),
          index === 0 ? 'fête' : SPARE_WORDS[index],
        ],
      })),
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accepts valid Spanish word sets preserving ñ as one character', () => {
    const result = validateLanguageWordSet({
      language: 'es',
      themes: CLASSIC_TIER_LAYOUT.map(({ themeId, label, tier, index }) => ({
        themeId,
        label,
        difficultyTier: tier,
        words: [
          ...FOUR_LETTER_POOL[index],
          ...FIVE_LETTER_POOL[index],
          SIX_LETTER_POOL[index],
          index === 0 ? 'montaña' : SEVEN_LETTER_POOL[index],
          SPARE_WORDS[index],
        ],
      })),
    });

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});

describe('validateLanguageWordSet — word rules', () => {
  it('rejects empty normalized words', () => {
    const wordSet = createValidEnglishWordSet();
    wordSet.themes[0].words = ['!!!', ...uniqueThemeWords(0).slice(1)];

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('normalized word is empty'))).toBe(true);
  });

  it('rejects invalid normalized lengths', () => {
    const wordSet = createValidEnglishWordSet();
    wordSet.themes[0].words = ['bee', ...uniqueThemeWords(0).slice(1)];

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('normalized length 3'))).toBe(true);
  });

  it('rejects palindromes after normalization', () => {
    const wordSet = createValidEnglishWordSet();
    wordSet.themes[0].words = ['racecar', ...uniqueThemeWords(0).slice(1)];

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('palindrome'))).toBe(true);
  });

  it('rejects French palindromes after accent normalization', () => {
    const wordSet = createValidEnglishWordSet();
    wordSet.language = 'fr';
    wordSet.themes[0].words = ['Kayak', ...uniqueThemeWords(0).slice(1)];

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('palindrome'))).toBe(true);
  });

  it('rejects duplicate normalized words within a theme', () => {
    const wordSet = createValidEnglishWordSet();
    wordSet.themes[0].words = [...uniqueThemeWords(0), ' BEAR '];

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('within theme'))).toBe(true);
  });

  it('rejects duplicate normalized words across themes', () => {
    const wordSet = createValidEnglishWordSet();
    wordSet.themes[1].words = [...uniqueThemeWords(1), ' BEAR '];

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('across themes'))).toBe(true);
  });

  it('treats Spanish ñ distinctly for duplicate detection', () => {
    const wordSet = createValidEnglishWordSet();
    wordSet.language = 'es';
    wordSet.themes[0].words = uniqueThemeWords(0).map((word) =>
      word === 'eagle' ? 'señor' : word,
    );
    wordSet.themes[1].words = uniqueThemeWords(1).map((word) =>
      word === 'shark' ? 'senor' : word,
    );

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(true);
    expect(
      result.errors.some((error) => error.includes('señor') || error.includes('senor')),
    ).toBe(false);
  });
});

describe('validateLanguageWordSet — theme composition', () => {
  it('warns when a theme has only bare minimum word counts', () => {
    const result = validateLanguageWordSet({
      language: 'en',
      themes: CLASSIC_TIER_LAYOUT.map(({ themeId, label, tier, index }) =>
        createTheme(themeId, label, tier, index, index !== 0),
      ),
    });

    expect(result.isValid).toBe(true);
    // Theme A1 has exactly the baseline count of every length (no spare) and
    // gets the original bare-minimum warning; every other theme has a spare
    // 6-letter word, which is enough surplus for fb#3e's redistribution to
    // legally reshape it away from the standard composition (a separate,
    // informational warning — see the "accepts a fully valid" test above).
    expect(result.warnings[0]).toContain('Theme A1');
    expect(result.warnings[0]).toContain('bare minimum');
    expect(result.warnings.slice(1).every((warning) => warning.includes('non-standard word-length composition'))).toBe(
      true,
    );
  });

  it('redistributes a theme entirely missing a length instead of rejecting it (fb#3e)', () => {
    const wordSet = createValidEnglishWordSet();
    // Removing the only 7-letter word still leaves exactly six words
    // (2×4, 2×5, 2×6 via the spare) — enough to redistribute into a valid,
    // non-standard composition rather than fail outright.
    wordSet.themes[0].words = uniqueThemeWords(0).filter((word) => word !== 'country');

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings[0]).toContain('Theme A1');
    expect(result.warnings[0]).toContain('non-standard word-length composition');
  });

  it('rejects a theme with too few words overall to fill a grid', () => {
    const wordSet = createValidEnglishWordSet();
    // Remove the only 7-letter word and the spare: five words left, one
    // short of the six a grid needs — no redistribution can invent a sixth.
    wordSet.themes[0].words = uniqueThemeWords(0).filter(
      (word) => word !== 'country' && word !== 'sparex',
    );

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('cannot assemble'))).toBe(true);
  });
});

describe('validateLanguageWordSet — Classic round capacity', () => {
  it('rejects when fewer than seven themes are available', () => {
    const result = validateLanguageWordSet({
      language: 'en',
      themes: [
        createTheme('theme-a1', 'A1', 'A', 0),
        createTheme('theme-b1', 'B1', 'B', 2),
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('require at least 7 unique themes'))).toBe(
      true,
    );
  });

  it('rejects duplicate theme ids', () => {
    const wordSet = createValidEnglishWordSet();
    wordSet.themes[1].themeId = wordSet.themes[0].themeId;

    const result = validateLanguageWordSet(wordSet);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('Duplicate theme id'))).toBe(true);
  });

  it('rejects when difficulty tier coverage is insufficient for A, B, C, D, B, E, A', () => {
    const result = validateLanguageWordSet({
      language: 'en',
      themes: [
        createTheme('theme-a1', 'A1', 'A', 0),
        createTheme('theme-b1', 'B1', 'B', 2),
        createTheme('theme-b2', 'B2', 'B', 3),
        createTheme('theme-c', 'C', 'C', 4),
        createTheme('theme-d', 'D', 'D', 5),
        createTheme('theme-e', 'E', 'E', 6),
      ],
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.includes('difficulty tier A'))).toBe(true);
    expect(result.errors.some((error) => error.includes('A, B, C, D, B, E, A'))).toBe(true);
  });
});
