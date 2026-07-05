import { describe, expect, it } from 'vitest';

import { getGridSummaries, getRoundStats } from './round-stats.js';

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
});
