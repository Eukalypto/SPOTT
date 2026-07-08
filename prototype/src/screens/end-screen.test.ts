import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
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
  it('shows a prominent final score and round totals', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState({ total: 280, remainingSeconds: 12 }),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain('end-score-hero__value');
    expect(html).toContain('>280<');
    expect(html).toContain('10 / 42');
    expect(html).toContain('1 / 7');
    expect(html).toContain(formatTimePlaceholder(12));
  });

  it('hides the time bonus when the round expired without bonus points', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState({ status: 'expired', timeBonus: 0 }),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).not.toContain('end-stat--bonus');
    expect(html).not.toContain(t('timeBonus', 'en'));
  });

  it('shows the time bonus only for completed rounds with bonus points', () => {
    const html = buildEndScreenHtml({
      locale: 'en',
      roundState: createRoundState({ status: 'completed', timeBonus: 180, total: 280 }),
      onReviewGrids: () => {},
      onStartAnotherRound: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain('end-stat--bonus');
    expect(html).toContain('+180');
    expect(html).toContain(t('endScoreIncludesBonus', 'en').replace('{bonus}', '180'));
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
    expect(html).toContain(t('startNewRound', 'en'));
    expect(html).toContain(t('backToStart', 'en'));
  });

  it('lists per-grid summaries', () => {
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

    expect(html).toContain('Forest');
    expect(html).toContain('Ocean');
    expect(html).toContain('end-grid-item--complete');
    expect(html).toContain('end-grid-item--incomplete');
  });
});

function formatTimePlaceholder(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}
