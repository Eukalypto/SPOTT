import { GAME_CONFIG } from '../config/index.js';
import type { MaskType } from '../types/masking.js';
import type { PlacedWord } from '../types/word.js';

export interface ScoringConfig {
  timeBonusPerSecond: number;
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  timeBonusPerSecond: GAME_CONFIG.timeBonusPerSecond,
};

export const MASK_SCORE_MULTIPLIERS: Readonly<Record<MaskType, number>> = {
  none: 1,
  partial: 2,
  full: 3,
};

export function getMaskScoreMultiplier(maskType: MaskType): number {
  return MASK_SCORE_MULTIPLIERS[maskType];
}

/**
 * Classic word score: word length × find order × mask multiplier.
 */
export function calculateWordScore(word: PlacedWord, findOrder: number): number {
  return word.length * findOrder * getMaskScoreMultiplier(word.maskType);
}

/**
 * Time bonus awarded when all grids are completed before the round timer expires.
 */
export function calculateTimeBonus(
  remainingSeconds: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): number {
  if (remainingSeconds <= 0) {
    return 0;
  }

  return remainingSeconds * config.timeBonusPerSecond;
}

export function calculateFinalScore(baseScore: number, timeBonus: number): number {
  return baseScore + timeBonus;
}

/** Sum word scores for a grid or round subtotal. */
export function sumWordScores(scores: readonly number[]): number {
  return scores.reduce((total, score) => total + score, 0);
}
