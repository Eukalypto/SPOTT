import type { RoundData } from './round.js';
import type { RoundScore } from './scoring.js';

/** Mutable runtime state for an in-progress or finished Classic round. */
export interface RoundState {
  round: RoundData;
  /** Grid index the player is currently viewing. */
  currentGridIndex: number;
  /** Unfinished grid indices in active play order (front = current). */
  activeGridIndices: number[];
  /** Seconds remaining on the round clock. */
  remainingSeconds: number;
  /** Word ids found across the entire round. */
  foundWordIds: Set<string>;
  score: RoundScore;
}

export function createEmptyRoundScore(): RoundScore {
  return {
    entries: [],
    wordPoints: 0,
    timeBonus: 0,
    total: 0,
  };
}
