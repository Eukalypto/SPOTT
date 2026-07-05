import type { GridMaskingPolicy } from '../types/masking.js';
import { GAME_CONFIG } from './game-config.js';

/**
 * Masking policy per grid in play order (grid 1 → index 0, …, grid 7 → index 6).
 *
 * `none` mask count is implicit: wordsPerGrid − fullCount − partialCount.
 */
export const GRID_MASKING_POLICIES = [
  { fullCount: 0, partialCount: 0 }, // Grid 1 — no masking
  { fullCount: 0, partialCount: 0 }, // Grid 2 — no masking
  { fullCount: 1, partialCount: 1 }, // Grid 3 — 1 full, 1 partial
  { fullCount: 0, partialCount: 0 }, // Grid 4 — no masking
  { fullCount: 2, partialCount: 2 }, // Grid 5 — 2 full, 2 partial
  { fullCount: 1, partialCount: 1 }, // Grid 6 — 1 full, 1 partial
  { fullCount: 2, partialCount: 2 }, // Grid 7 — 2 full, 2 partial
] as const satisfies readonly GridMaskingPolicy[];

export function getGridMaskingPolicy(gridIndex: number): GridMaskingPolicy {
  return GRID_MASKING_POLICIES[gridIndex];
}

export function getUnmaskedWordCount(policy: GridMaskingPolicy): number {
  return (
    GAME_CONFIG.wordsPerGrid - policy.fullCount - policy.partialCount
  );
}

export function assertGridMaskingPoliciesValid(
  policies: readonly GridMaskingPolicy[] = GRID_MASKING_POLICIES,
): void {
  if (policies.length !== GAME_CONFIG.gridsPerRound) {
    throw new Error(
      `Expected ${GAME_CONFIG.gridsPerRound} masking policies, got ${policies.length}`,
    );
  }

  for (let i = 0; i < policies.length; i++) {
    const { fullCount, partialCount } = policies[i];
    const total = fullCount + partialCount;
    if (total > GAME_CONFIG.wordsPerGrid) {
      throw new Error(
        `Grid ${i + 1} masking policy exceeds wordsPerGrid: ${total} > ${GAME_CONFIG.wordsPerGrid}`,
      );
    }
    if (fullCount < 0 || partialCount < 0) {
      throw new Error(`Grid ${i + 1} masking counts must be non-negative`);
    }
  }
}

// Validate at module load so misconfiguration fails fast.
assertGridMaskingPoliciesValid();
