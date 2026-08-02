import { describe, expect, it } from 'vitest';

import { t, tFormat } from '../i18n/index.js';
import { buildEndScreenHtml } from './end-screen.js';

function createRoundState(
  overrides: Partial<{
    status: 'completed' | 'expired';
    remainingSeconds: number;
    timeBonus: number;
    total: number;
    grids: Array<{ themeLabel: string; foundCount: number }>;
  }> = {},
) {
  const grids = overrides.grids ?? Array.from({ length: 7 }, (_, index) => ({
    themeLabel: `Theme ${index + 1}`,
    foundCount: index === 0 ? 6 : index === 1 ? 4 : 0,
  }));

  return {
    round: {
      status: overrides.status ?? 'expired',
      grids: grids.map((grid, index) => ({
        index,
        themeLabel: grid.themeLabel,
        placedWords: Array.from({ length: 6 }, (_, wordIndex) => ({
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
      wordPoints: 100,
      timeBonus: overrides.timeBonus ?? 0,
      total: overrides.total ?? 100,
    },
  } as never;
}

describe('buildEndScreenHtml', () => {
  it('shows the Finished Game Status heading and the final score', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState({ total: 280 }),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain(t('finishedGameStatus', 'en'));
    expect(html).toContain(t('finalScore', 'en'));
    expect(html).toContain('>280<');
  });

  it('shows "Time is up" when the round expired', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState({ status: 'expired' }),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain(t('timeIsUp', 'en'));
  });

  it('shows "Grids completed" without a bonus when there is none', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState({ status: 'completed', timeBonus: 0 }),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain(t('statusGridsCompleted', 'en'));
    expect(html).not.toContain('bonus =');
  });

  it('shows the seconds-spared and bonus format when grids finish with time to spare', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState({ status: 'completed', remainingSeconds: 15, timeBonus: 225 }),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain(
      tFormat('statusGridsCompletedWithBonus', 'en', { seconds: 15, bonus: 225 }),
    );
  });

  it('shows "Play Solo Again" for solo games and "Challenge the same opponent" for challenges', () => {
    const solo = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      gameMode: 'solo',
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });
    const challenge = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      gameMode: 'challenge',
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(solo).toContain(t('playSoloAgain', 'en'));
    expect(challenge).toContain(t('challengeSameOpponent', 'en'));
  });

  it('provides review, restart, and back-to-start actions', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain('data-action="review"');
    expect(html).toContain('data-action="restart"');
    expect(html).toContain('data-action="back-to-start"');
    expect(html).toContain(t('reviewGrids', 'en'));
    expect(html).toContain(t('home', 'en'));
  });

  it('shows an empty Player Statistics placeholder and nothing else', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState({
        grids: [
          { themeLabel: 'Forest', foundCount: 6 },
          { themeLabel: 'Ocean', foundCount: 2 },
        ],
      }),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain(t('playerStatistics', 'en'));
    expect(html).not.toContain('Forest');
    expect(html).not.toContain('Ocean');
  });
});
