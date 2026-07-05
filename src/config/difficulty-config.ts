import type { DifficultyTier } from '../types/difficulty.js';
import { GAME_CONFIG } from './game-config.js';

export interface DifficultyProfile {
  tier: DifficultyTier;
  /** Relative score multiplier applied when a word on this tier is found. */
  scoreMultiplier: number;
  /** Human-readable label for UI layers (not used by the engine UI). */
  label: string;
}

export const DIFFICULTY_PROFILES: Readonly<Record<DifficultyTier, DifficultyProfile>> = {
  A: { tier: 'A', scoreMultiplier: 1.0, label: 'Easy' },
  B: { tier: 'B', scoreMultiplier: 1.25, label: 'Medium' },
  C: { tier: 'C', scoreMultiplier: 1.5, label: 'Hard' },
  D: { tier: 'D', scoreMultiplier: 1.75, label: 'Expert' },
  E: { tier: 'E', scoreMultiplier: 2.0, label: 'Master' },
} as const;

export function getDifficultyProfile(tier: DifficultyTier): DifficultyProfile {
  return DIFFICULTY_PROFILES[tier];
}

export function getDifficultyForGridIndex(index: number): DifficultyTier {
  return GAME_CONFIG.difficultySequence[index];
}
