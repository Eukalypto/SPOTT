import type { Coordinate } from './coordinate.js';
import type { DirectionName } from './direction.js';
import type { DifficultyTier } from './difficulty.js';
import type { LanguageCode } from './language.js';
import type { MaskType } from './masking.js';
import type { WordLengthCompositionEntry } from '../config/game-config.js';

export type WordLength = 4 | 5 | 6 | 7;

export const WORD_LENGTHS = [4, 5, 6, 7] as const satisfies readonly WordLength[];

/** A word placed on the grid with placement and display metadata. */
export interface PlacedWord {
  id: string;
  /** Original word text as provided in the theme word set. */
  text: string;
  /** Normalized internal form used for comparison and length checks. */
  normalizedText: string;
  length: WordLength;
  direction: DirectionName;
  start: Coordinate;
  end: Coordinate;
  /** Ordered cell coordinates from start to end (inclusive). */
  cells: Coordinate[];
  maskType: MaskType;
  found: boolean;
  /** 1-based order within the grid when found; null before discovery. */
  findOrder: number | null;
  /** Zero-based highlight color assigned when found; null before discovery. */
  colorIndex: number | null;
}

/** Six or more words grouped under a single theme (one grid's word pool). */
export interface ThemeWordSet {
  themeId: string;
  label: string;
  /** Difficulty tier this theme is eligible for during Classic round assignment. */
  difficultyTier: DifficultyTier;
  words: readonly string[];
  /**
   * Per-theme word-length composition (fb#3e), pre-computed and empirically
   * validated at word-list generation time (see
   * scripts/generate-word-lists.mjs). Falls back to the standard
   * GAME_CONFIG.wordLengthComposition when absent. generateGrid never derives
   * a composition live from theme word counts — only a build-time-validated
   * shape is trusted for real gameplay.
   */
  wordLengthComposition?: readonly WordLengthCompositionEntry[];
}

/** All themed word pools available for a language. */
export interface LanguageWordSet {
  language: LanguageCode;
  themes: readonly ThemeWordSet[];
}
