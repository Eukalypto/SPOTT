import type { DifficultyTier } from '../types/difficulty.js';
import type { WordLength } from '../types/word.js';

export interface WordLengthCompositionEntry {
  readonly length: WordLength;
  readonly count: number;
}

export interface GameConfig {
  readonly gridSize: number;
  readonly wordsPerGrid: number;
  readonly gridsPerRound: number;
  readonly roundDurationSeconds: number;
  readonly wordLengthComposition: readonly WordLengthCompositionEntry[];
  readonly difficultySequence: readonly DifficultyTier[];
  readonly allowOvershoot: boolean;
  readonly timeBonusPerSecond: number;
}

export const WORD_LENGTH_COMPOSITION = [
  { length: 4, count: 2 },
  { length: 5, count: 2 },
  { length: 6, count: 1 },
  { length: 7, count: 1 },
] as const satisfies readonly WordLengthCompositionEntry[];

export const DIFFICULTY_SEQUENCE = [
  'A',
  'B',
  'C',
  'D',
  'B',
  'E',
  'A',
] as const satisfies readonly DifficultyTier[];

export const GAME_CONFIG = {
  gridSize: 7,
  wordsPerGrid: 6,
  gridsPerRound: 7,
  roundDurationSeconds: 90,
  wordLengthComposition: WORD_LENGTH_COMPOSITION,
  difficultySequence: DIFFICULTY_SEQUENCE,
  allowOvershoot: false,
  timeBonusPerSecond: 15,
} as const satisfies GameConfig;

/** Letters used to fill empty cells after word placement. */
export const FILLER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Round duration in milliseconds, derived from seconds config. */
export const ROUND_DURATION_MS = GAME_CONFIG.roundDurationSeconds * 1000;

/** Word-length distribution as a lookup map (length → count). */
export const WORD_LENGTH_DISTRIBUTION: Readonly<Record<WordLength, number>> =
  Object.fromEntries(
    GAME_CONFIG.wordLengthComposition.map(({ length, count }) => [length, count]),
  ) as Record<WordLength, number>;

export const MIN_WORD_LENGTH = GAME_CONFIG.wordLengthComposition[0].length;
export const MAX_WORD_LENGTH =
  GAME_CONFIG.wordLengthComposition[GAME_CONFIG.wordLengthComposition.length - 1].length;
