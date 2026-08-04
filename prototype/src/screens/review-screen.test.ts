import { GAME_CONFIG } from '@spott/engine';
import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { formatClueDisplayHtml } from '../utils/html.js';
import { buildReviewScreenHtml } from './review-screen.js';

function createRoundState() {
  return {
    remainingSeconds: 42,
    score: { total: 250, wordPoints: 200, timeBonus: 50, entries: [] },
    round: {
      status: 'completed',
      grids: Array.from({ length: GAME_CONFIG.gridsPerRound }, (_, gridIndex) => ({
        index: gridIndex,
        themeLabel: `Theme ${gridIndex + 1}`,
        placedWords: Array.from({ length: 6 }, (_, wordIndex) => ({
          id: `g${gridIndex}-w${wordIndex}`,
          text: `word${wordIndex}`,
          normalizedText: `word${wordIndex}`,
          length: 4,
          direction: 'horizontal-right',
          start: { row: 0, col: 0 },
          end: { row: 0, col: 3 },
          cells: [],
          maskType: 'none',
          found: wordIndex < (gridIndex === 0 ? 4 : 2),
          findOrder: wordIndex < (gridIndex === 0 ? 4 : 2) ? wordIndex + 1 : null,
          colorIndex: wordIndex < (gridIndex === 0 ? 4 : 2) ? wordIndex : null,
        })),
        cells: Array.from({ length: 7 }, () =>
          Array.from({ length: 7 }, () => ({ letter: 'A', wordId: null })),
        ),
      })),
    },
  } as never;
}

describe('buildReviewScreenHtml', () => {
  it('renders all seven grid tabs and the current grid number', () => {
    const html = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: 2,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    expect(html.match(/data-grid-index="/g)?.length).toBe(GAME_CONFIG.gridsPerRound);
    expect(html).toContain('review-tab--active');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(`${t('reviewTabSelected', 'en')}`);
    expect(html).toContain(`${t('grid', 'en')} 3/${GAME_CONFIG.gridsPerRound}`);
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
    expect(html).toContain('review-clue--found');
    expect(html).toContain('review-clue--missed');
    expect(html).toContain('review-clue__word--found');
    expect(html).toContain('review-clue__word--missed');
    expect(html).toContain(formatClueDisplayHtml('WORD0'));
  });

  it('provides previous and next grid navigation', () => {
    const html = buildReviewScreenHtml({
      locale: 'en',
      roundState: createRoundState(),
      playerName: 'Tester',
      reviewGridIndex: 0,
      onChangeGrid: () => {},
      onClose: () => {},
    });

    expect(html).toContain('data-action="prev"');
    expect(html).toContain('data-action="next"');
    expect(html).toContain('disabled');
    expect(html).toContain(t('backToResults', 'en'));
    expect(html).toContain(t('reviewReadOnlyHint', 'en'));
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
});
