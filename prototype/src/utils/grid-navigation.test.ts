import { describe, expect, it } from 'vitest';

import type { RoundState } from '@spott/engine';

import {
  canSkipGrid,
  getGridDisplayLabel,
  getGridNavigationHint,
  getUnfinishedGridCount,
} from './grid-navigation.js';

function createRoundState(activeGridIndices: number[], currentGridIndex = activeGridIndices[0]) {
  return {
    round: { status: 'active' as const },
    currentGridIndex,
    activeGridIndices,
    remainingSeconds: 60,
    foundWordIds: new Set<string>(),
    score: { entries: [], wordPoints: 0, timeBonus: 0, total: 0 },
  } as unknown as RoundState;
}

describe('grid navigation helpers', () => {
  it('shows the absolute grid rank (fb#7: no "n/7" suffix)', () => {
    const state = createRoundState([0, 1, 2, 3, 4, 5, 6], 2);
    expect(getGridDisplayLabel(state)).toBe('3');
  });

  it('allows skip only when more than one unfinished grid remains', () => {
    expect(canSkipGrid(createRoundState([0, 1, 2]))).toBe(true);
    expect(canSkipGrid(createRoundState([4]))).toBe(false);
  });

  it('reports unfinished grid count for skip feedback', () => {
    expect(getUnfinishedGridCount(createRoundState([2, 5, 6]))).toBe(3);
    expect(getGridNavigationHint(createRoundState([2, 5, 6]), 'en')).toBe('3 unfinished');
    expect(getGridNavigationHint(createRoundState([4]), 'en')).toBe('Last grid');
    expect(getGridNavigationHint(createRoundState([4]), 'fr')).toBe('Dernière grille');
  });
});
