import { GAME_CONFIG } from '@spott/engine';
import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { formatClueDisplayHtml } from '../utils/html.js';
import { buildReviewScreenHtml } from './review-screen.js';

function createRoundState(status: 'completed' | 'interrupted' | 'expired' = 'completed') {
  const foundWordIds = new Set<string>();
  const grids = Array.from({ length: GAME_CONFIG.gridsPerRound }, (_, gridIndex) => ({
    id: `grid-${gridIndex}`,
    index: gridIndex,
    themeLabel: `Theme ${gridIndex + 1}`,
    placedWords: Array.from({ length: 6 }, (_, wordIndex) => {
      const found = wordIndex < (gridIndex === 0 ? 4 : 2);
      const id = `g${gridIndex}-w${wordIndex}`;
      if (found) {
        foundWordIds.add(id);
      }
      return {
        id,
        text: `word${wordIndex}`,
        normalizedText: `word${wordIndex}`,
        length: 4,
        direction: 'horizontal-right',
        start: { row: 0, col: 0 },
        end: { row: 0, col: 3 },
        cells: [],
        maskType: 'none',
        found,
        findOrder: found ? wordIndex + 1 : null,
        colorIndex: found ? wordIndex : null,
      };
    }),
    cells: Array.from({ length: 7 }, () =>
      Array.from({ length: 7 }, () => ({ letter: 'A', wordId: null })),
    ),
  }));

  return {
    remainingSeconds: 42,
    foundWordIds,
    score: { total: 250, wordPoints: 200, timeBonus: 50, entries: [] },
    round: { status, grids },
  } as never;
}

describe('buildReviewScreenHtml', () => {
  it('shows the category/rank badge matching the Game screen format (fb#2b)', () => {
    const html = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: 2,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    expect(html).toContain('grid-rank-badge');
    expect(html).toContain('3');
    expect(html).toContain('Theme 3');
  });

  it('reveals all target words in read-only review mode', () => {
    const html = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: 0,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    expect(html).toContain('letter-grid--review');
    expect(html).toContain('aria-readonly="true"');
    expect(html).toContain(t('reviewAllWords', 'en'));
    expect(html).toContain('clue-item--found');
    expect(html).toContain('clue-item__text--found');
    expect(html).toContain(formatClueDisplayHtml('WORD0'));
  });

  it('colors not-found words in the grid cells, dimmed, and leaves the clue list plain (fb 260814/4d)', () => {
    // fb#2j originally colored the clue list; the correction moves that
    // coloring to the grid cells themselves and reverts the list to plain
    // found/unfound styling — so this fixture needs real cell positions
    // (unlike createRoundState's placedWords, which use empty cells arrays
    // since they only ever exercised the clue list).
    const roundState = {
      remainingSeconds: 42,
      foundWordIds: new Set(['g0-w0']),
      score: { total: 100, wordPoints: 100, timeBonus: 0, entries: [] },
      round: {
        status: 'completed',
        grids: [
          {
            id: 'grid-0',
            index: 0,
            themeLabel: 'Theme 1',
            cells: [
              [{ letter: 'L', wordId: 'g0-w0' }, { letter: 'I', wordId: 'g0-w0' }],
              [{ letter: 'B', wordId: 'g0-w1' }, { letter: 'E', wordId: 'g0-w1' }],
            ],
            placedWords: [
              {
                id: 'g0-w0',
                text: 'li',
                normalizedText: 'li',
                length: 2,
                direction: 'horizontal-right',
                start: { row: 0, col: 0 },
                end: { row: 0, col: 1 },
                cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
                maskType: 'none',
                found: true,
                findOrder: 1,
                colorIndex: 0,
              },
              {
                id: 'g0-w1',
                text: 'be',
                normalizedText: 'be',
                length: 2,
                direction: 'vertical-down',
                start: { row: 1, col: 0 },
                end: { row: 1, col: 1 },
                cells: [{ row: 1, col: 0 }, { row: 1, col: 1 }],
                maskType: 'none',
                found: false,
                findOrder: null,
                colorIndex: null,
              },
            ],
          },
        ],
      },
    } as never;

    const html = buildReviewScreenHtml({
      locale: 'en',
      roundState,
      playerName: 'Tester',
      reviewGridIndex: 0,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    expect(html).toContain('grid-cell--review-found');
    expect(html).toContain('grid-cell--review-missed');
    expect(html).not.toContain('clue-item--unfound-colored');
  });

  it('provides symmetric previous and next grid arrows, never disabled (fb#2d, fb#2e, circular nav fb 260814/4b)', () => {
    const firstGrid = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: 0,
      onChangeGrid: () => {},
      onClose: () => {},
    });
    const lastGrid = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: GAME_CONFIG.gridsPerRound - 1,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    for (const html of [firstGrid, lastGrid]) {
      expect(html).toContain('data-action="prev"');
      expect(html).toContain('data-action="next"');
      expect(html).not.toContain('disabled');
      expect(html).not.toContain('next-grid-button--disabled');
      expect(html).toContain('next-grid-row--review');
    }
  });

  it('shows an X button that closes straight to results, no confirmation (fb#2f)', () => {
    const html = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: 0,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    expect(html).toContain('data-action="close"');
    expect(html).not.toContain('confirm-dialog');
  });

  it('shows the gauge with the correct per-grid found colors (fb#2c)', () => {
    const html = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: 0,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    expect(html).toContain('word-gauge');
    expect(html).toContain('gauge-notch--filled');
  });

  it('shows the frozen final score and the player name/avatar (A2i)', () => {
    const html = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: 0,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    expect(html).toContain('game-header');
    expect(html).toContain('>250<');
    expect(html).toContain('Tester');
  });

  describe('timer slot shows how the round ended (fb#2i)', () => {
    it('shows the saved time in green with "All Grids Completed" when completed', () => {
      const html = buildReviewScreenHtml({
        locale: 'en',
        roundState: createRoundState('completed'),
        playerName: 'Tester',
        reviewGridIndex: 0,
        onChangeGrid: () => {},
        onClose: () => {},
      });

      expect(html).toContain('game-stat__value--review-completed');
      expect(html).toContain(t('reviewStatusAllCompleted', 'en'));
      expect(html).toContain('0:42');
    });

    it('shows the saved time in red with "Game Stopped" when interrupted', () => {
      const html = buildReviewScreenHtml({
        locale: 'en',
        roundState: createRoundState('interrupted'),
        playerName: 'Tester',
        reviewGridIndex: 0,
        onChangeGrid: () => {},
        onClose: () => {},
      });

      expect(html).toContain('game-stat__value--review-stopped');
      expect(html).toContain(t('reviewStatusGameStopped', 'en'));
      expect(html).toContain('0:42');
    });

    it('shows 0:00 in orange with the words-found count when time expired', () => {
      const html = buildReviewScreenHtml({
        locale: 'en',
        roundState: createRoundState('expired'),
        playerName: 'Tester',
        reviewGridIndex: 0,
        onChangeGrid: () => {},
        onClose: () => {},
      });

      expect(html).toContain('game-stat__value--review-expired');
      expect(html).toContain('0:00');
      // Grid 0 has 4 found, the other six grids have 2 each = 4 + 6*2 = 16.
      expect(html).toContain('16 words found out of 42');
    });
  });
});
