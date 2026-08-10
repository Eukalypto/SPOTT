import { describe, expect, it } from 'vitest';

import { getGridSummaries, getOptimalScore, getRoundStats, shouldShowTimeBonus } from './round-stats.js';

function createRoundState(
  grids: Array<{
    themeLabel: string;
    foundCount: number;
    totalWords?: number;
  }>,
  overrides: Partial<{
    status: 'completed' | 'expired';
    remainingSeconds: number;
    timeBonus: number;
    total: number;
    wordPoints: number;
  }> = {},
) {
  return {
    round: {
      status: overrides.status ?? 'expired',
      grids: grids.map((grid, index) => ({
        index,
        themeLabel: grid.themeLabel,
        placedWords: Array.from({ length: grid.totalWords ?? 6 }, (_, wordIndex) => ({
          id: `g${index}-w${wordIndex}`,
          found: wordIndex < grid.foundCount,
        })),
      })),
    },
    foundWordIds: new Set(
      grids.flatMap((grid, gridIndex) =>
        Array.from({ length: grid.foundCount }, (_, wordIndex) => `g${gridIndex}-w${wordIndex}`),
      ),
    ),
    remainingSeconds: overrides.remainingSeconds ?? 0,
    score: {
      entries: [],
      wordPoints: overrides.wordPoints ?? 100,
      timeBonus: overrides.timeBonus ?? 0,
      total: overrides.total ?? 100,
    },
  } as never;
}

describe('round stats', () => {
  it('summarizes round totals for the end screen', () => {
    const roundState = createRoundState(
      [
        { themeLabel: 'Animals', foundCount: 6 },
        { themeLabel: 'Food', foundCount: 3 },
      ],
      { remainingSeconds: 12, timeBonus: 180, total: 280, wordPoints: 100 },
    );

    const stats = getRoundStats(roundState);

    expect(stats.finalScore).toBe(280);
    expect(stats.wordsFound).toBe(9);
    expect(stats.totalWords).toBe(12);
    expect(stats.gridsCompleted).toBe(1);
    expect(stats.totalGrids).toBe(7);
    expect(stats.remainingSeconds).toBe(12);
    expect(stats.timeBonus).toBe(180);
  });

  it('builds a per-grid summary with completion status', () => {
    const roundState = createRoundState([
      { themeLabel: 'Animals', foundCount: 6 },
      { themeLabel: 'Food', foundCount: 2 },
      { themeLabel: 'Travel', foundCount: 0 },
    ]);

    expect(getGridSummaries(roundState)).toEqual([
      {
        gridNumber: 1,
        themeLabel: 'Animals',
        wordsFound: 6,
        totalWords: 6,
        completed: true,
      },
      {
        gridNumber: 2,
        themeLabel: 'Food',
        wordsFound: 2,
        totalWords: 6,
        completed: false,
      },
      {
        gridNumber: 3,
        themeLabel: 'Travel',
        wordsFound: 0,
        totalWords: 6,
        completed: false,
      },
    ]);
  });

  it('shows time bonus only for completed rounds with bonus points', () => {
    const completed = createRoundState([{ themeLabel: 'Animals', foundCount: 6 }], {
      status: 'completed',
      timeBonus: 120,
    });
    const expired = createRoundState([{ themeLabel: 'Animals', foundCount: 3 }], {
      status: 'expired',
      timeBonus: 0,
    });

    expect(shouldShowTimeBonus(completed)).toBe(true);
    expect(shouldShowTimeBonus(expired)).toBe(false);
  });
});

describe('getOptimalScore (fb#3d)', () => {
  it('pairs the smallest (length x mask multiplier) with findOrder 1, largest with the last findOrder', () => {
    // weights: A=4x1=4, B=7x3=21, C=5x2=10 -> sorted [4,10,21] paired with [1,2,3]
    // = 4*1 + 10*2 + 21*3 = 4 + 20 + 63 = 87
    const roundState = {
      round: {
        grids: [
          {
            placedWords: [
              { length: 4, maskType: 'none' },
              { length: 7, maskType: 'full' },
              { length: 5, maskType: 'partial' },
            ],
          },
        ],
      },
    } as never;

    expect(getOptimalScore(roundState)).toBe(87);
  });

  it('sums the optimal score across every grid in the round', () => {
    const roundState = {
      round: {
        grids: [
          { placedWords: [{ length: 4, maskType: 'none' }] }, // 4*1 = 4
          { placedWords: [{ length: 4, maskType: 'none' }, { length: 4, maskType: 'none' }] }, // 4*1 + 4*2 = 12
        ],
      },
    } as never;

    expect(getOptimalScore(roundState)).toBe(16);
  });

  it('is unaffected by the actual found order or found state', () => {
    const roundState = {
      round: {
        grids: [
          {
            placedWords: [
              { length: 4, maskType: 'none', found: true, findOrder: 3 },
              { length: 7, maskType: 'full', found: false, findOrder: null },
            ],
          },
        ],
      },
    } as never;

    // weights [4, 21] -> 4*1 + 21*2 = 4 + 42 = 46, regardless of actual findOrder/found.
    expect(getOptimalScore(roundState)).toBe(46);
  });
});
