import { GAME_CONFIG } from '../config/index.js';
import { isPalindromeNormalized, normalizeWord } from '../normalization/index.js';
import type { DifficultyTier } from '../types/difficulty.js';
import type { LanguageCode } from '../types/language.js';
import type { LanguageWordSet, ThemeWordSet, WordLength } from '../types/index.js';
import { WORD_LENGTHS } from '../types/word.js';

export interface LanguageWordSetValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface NormalizedWordOccurrence {
  themeId: string;
  themeLabel: string;
  rawWord: string;
}

const VALID_LENGTHS = new Set<WordLength>(WORD_LENGTHS);

/**
 * Validate whether a {@link LanguageWordSet} can supply Classic rounds.
 *
 * Checks every word (normalization, length, palindrome), duplicate normalized
 * forms, per-theme word-length minimums, difficulty-tier coverage for the
 * Classic sequence, and bare-minimum theme capacity warnings.
 */
export function validateLanguageWordSet(
  wordSet: LanguageWordSet,
): LanguageWordSetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { language } = wordSet;
  const normalizedOccurrences = new Map<string, NormalizedWordOccurrence[]>();

  for (const theme of wordSet.themes) {
    validateThemeWords(theme, language, normalizedOccurrences, errors);
    validateThemeWordCounts(theme, language, errors, warnings);
  }

  validateCrossThemeDuplicates(language, normalizedOccurrences, errors);
  validateUniqueThemeIds(wordSet.themes, errors);
  validateDifficultyTierCoverage(wordSet.themes, errors);
  validateMinimumThemeCount(wordSet.themes, errors);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateThemeWords(
  theme: ThemeWordSet,
  language: LanguageCode,
  normalizedOccurrences: Map<string, NormalizedWordOccurrence[]>,
  errors: string[],
): void {
  const seenInTheme = new Set<string>();

  for (const rawWord of theme.words) {
    const normalized = normalizeWord(rawWord, language);
    const context = `"${rawWord}" in theme "${theme.label}" (${theme.themeId})`;

    if (normalized.length === 0) {
      errors.push(`${context}: normalized word is empty`);
      continue;
    }

    if (!VALID_LENGTHS.has(normalized.length as WordLength)) {
      errors.push(
        `${context}: normalized length ${normalized.length} is invalid (must be 4, 5, 6, or 7)`,
      );
    }

    if (isPalindromeNormalized(normalized)) {
      errors.push(`${context}: word is a palindrome after normalization ("${normalized}")`);
    }

    if (seenInTheme.has(normalized)) {
      errors.push(
        `${context}: duplicate normalized form "${normalized}" within theme "${theme.label}"`,
      );
    } else {
      seenInTheme.add(normalized);
    }

    const occurrences = normalizedOccurrences.get(normalized) ?? [];
    occurrences.push({ themeId: theme.themeId, themeLabel: theme.label, rawWord });
    normalizedOccurrences.set(normalized, occurrences);
  }
}

function validateCrossThemeDuplicates(
  language: LanguageCode,
  normalizedOccurrences: Map<string, NormalizedWordOccurrence[]>,
  errors: string[],
): void {
  for (const [normalized, occurrences] of normalizedOccurrences) {
    if (occurrences.length < 2) {
      continue;
    }

    const themeIds = new Set(occurrences.map((entry) => entry.themeId));
    if (themeIds.size < 2) {
      continue;
    }

    const locations = occurrences
      .map((entry) => `"${entry.rawWord}" (${entry.themeLabel})`)
      .join(', ');
    errors.push(
      `Duplicate normalized form "${normalized}" across themes in language "${language}": ${locations}`,
    );
  }
}

function validateThemeWordCounts(
  theme: ThemeWordSet,
  language: LanguageCode,
  errors: string[],
  warnings: string[],
): void {
  const lengthCounts = countNormalizedWordLengths(theme, language);
  let atExactMinimum = true;

  for (const { length, count: minimum } of GAME_CONFIG.wordLengthComposition) {
    const actual = lengthCounts.get(length) ?? 0;

    if (actual < minimum) {
      errors.push(
        `Theme "${theme.label}" (${theme.themeId}): has ${actual} word(s) of length ${length}, requires at least ${minimum}`,
      );
      atExactMinimum = false;
      continue;
    }

    if (actual > minimum) {
      atExactMinimum = false;
    }
  }

  if (atExactMinimum) {
    warnings.push(
      `Theme "${theme.label}" (${theme.themeId}): has only the bare minimum word counts (2×4, 2×5, 1×6, 1×7); grid generation may fail more often`,
    );
  }
}

function validateUniqueThemeIds(themes: readonly ThemeWordSet[], errors: string[]): void {
  const seen = new Set<string>();

  for (const theme of themes) {
    if (seen.has(theme.themeId)) {
      errors.push(`Duplicate theme id "${theme.themeId}" in language word set`);
    } else {
      seen.add(theme.themeId);
    }
  }
}

function validateMinimumThemeCount(themes: readonly ThemeWordSet[], errors: string[]): void {
  const required = GAME_CONFIG.gridsPerRound;
  if (themes.length < required) {
    errors.push(
      `Language word set has ${themes.length} theme(s), but Classic rounds require at least ${required} unique themes`,
    );
  }
}

function validateDifficultyTierCoverage(
  themes: readonly ThemeWordSet[],
  errors: string[],
): void {
  const requiredByTier = countDifficultyTierSlots(GAME_CONFIG.difficultySequence);
  const availableByTier = countThemesByDifficulty(themes);

  for (const tier of Object.keys(requiredByTier) as DifficultyTier[]) {
    const required = requiredByTier[tier];
    const available = availableByTier[tier] ?? 0;

    if (available < required) {
      errors.push(
        `Not enough themes for difficulty tier ${tier}: need ${required} for Classic sequence ${formatSequence(GAME_CONFIG.difficultySequence)}, but only ${available} theme(s) available`,
      );
    }
  }
}

function countDifficultyTierSlots(
  sequence: readonly DifficultyTier[],
): Readonly<Record<DifficultyTier, number>> {
  const counts: Record<DifficultyTier, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const tier of sequence) {
    counts[tier]++;
  }
  return counts;
}

function countThemesByDifficulty(
  themes: readonly ThemeWordSet[],
): Readonly<Partial<Record<DifficultyTier, number>>> {
  const counts: Partial<Record<DifficultyTier, number>> = {};
  for (const theme of themes) {
    counts[theme.difficultyTier] = (counts[theme.difficultyTier] ?? 0) + 1;
  }
  return counts;
}

function formatSequence(sequence: readonly DifficultyTier[]): string {
  return sequence.join(', ');
}

/** Count normalized word lengths for a theme using the parent language's rules. */
export function countNormalizedWordLengths(
  theme: ThemeWordSet,
  language: LanguageCode,
): Map<WordLength, number> {
  const counts = new Map<WordLength, number>();

  for (const rawWord of theme.words) {
    const normalized = normalizeWord(rawWord, language);
    const length = normalized.length as WordLength;
    if (!VALID_LENGTHS.has(length)) {
      continue;
    }
    counts.set(length, (counts.get(length) ?? 0) + 1);
  }

  return counts;
}
