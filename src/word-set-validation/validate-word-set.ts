import { GAME_CONFIG, WORD_LENGTH_DISTRIBUTION } from '../config/index.js';
import type { ThemeWordSet, WordLength } from '../types/index.js';

export type WordSetValidationResult =
  | { valid: true }
  | { valid: false; reason: WordSetInvalidReason };

export type WordSetInvalidReason =
  | 'wrong-word-count'
  | 'invalid-length-distribution'
  | 'duplicate-word'
  | 'empty-word'
  | 'non-alpha-characters';

function expectedWordCount(): number {
  return GAME_CONFIG.wordLengthComposition.reduce((sum, entry) => sum + entry.count, 0);
}

/**
 * Verify that a theme word set satisfies the per-grid length composition
 * (2×4, 2×5, 1×6, 1×7) and contains no duplicates.
 */
export function validateThemeWordSet(wordSet: ThemeWordSet): WordSetValidationResult {
  if (wordSet.words.length !== expectedWordCount()) {
    return { valid: false, reason: 'wrong-word-count' };
  }

  const seen = new Set<string>();
  const lengthCounts = new Map<WordLength, number>();

  for (const rawWord of wordSet.words) {
    const word = rawWord.trim().toUpperCase();
    if (!word) {
      return { valid: false, reason: 'empty-word' };
    }
    if (!/^[A-Z]+$/.test(word)) {
      return { valid: false, reason: 'non-alpha-characters' };
    }
    if (seen.has(word)) {
      return { valid: false, reason: 'duplicate-word' };
    }
    seen.add(word);

    const len = word.length as WordLength;
    lengthCounts.set(len, (lengthCounts.get(len) ?? 0) + 1);
  }

  for (const [length, required] of Object.entries(WORD_LENGTH_DISTRIBUTION)) {
    const actual = lengthCounts.get(Number(length) as WordLength) ?? 0;
    if (actual !== required) {
      return { valid: false, reason: 'invalid-length-distribution' };
    }
  }

  return { valid: true };
}

export function isValidThemeWordSet(
  wordSet: ThemeWordSet,
): wordSet is ThemeWordSet & { words: readonly string[] } {
  return validateThemeWordSet(wordSet).valid;
}

/** @deprecated Use validateThemeWordSet */
export const validateWordSet = validateThemeWordSet;

/** @deprecated Use isValidThemeWordSet */
export const isValidWordSet = isValidThemeWordSet;
