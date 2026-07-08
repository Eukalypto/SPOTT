import { describe, expect, it } from 'vitest';

import type { PlacedWord } from '@spott/engine';

import {
  buildReviewClueListHtml,
  buildReviewLetterGridHtml,
  revealWordText,
} from './grid-review.js';

function createWord(overrides: Partial<{
  id: string;
  text: string;
  found: boolean;
  colorIndex: number | null;
  maskType: 'none' | 'partial' | 'full';
  cells: { row: number; col: number }[];
}> = {}) {
  return {
    id: 'w1',
    text: 'lion',
    normalizedText: 'lion',
    length: 4 as const,
    direction: 'horizontal-right' as const,
    start: { row: 0, col: 0 },
    end: { row: 0, col: 3 },
    cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }],
    maskType: 'full' as const,
    found: false,
    findOrder: null,
    colorIndex: null,
    ...overrides,
  };
}

function asPlacedWord(
  overrides: Partial<{
    id: string;
    text: string;
    found: boolean;
    colorIndex: number | null;
    maskType: 'none' | 'partial' | 'full';
    cells: { row: number; col: number }[];
  }> = {},
): PlacedWord {
  return createWord(overrides) as PlacedWord;
}

describe('grid review', () => {
  it('reveals full words instead of masked clues', () => {
    expect(revealWordText(asPlacedWord({ text: 'señor', maskType: 'full' }))).toBe('SEÑOR');
  });

  it('colors all target words on the review grid', () => {
    const grid = {
      cells: [
        [{ letter: 'L', wordId: 'w1' }, { letter: 'I', wordId: 'w1' }],
        [{ letter: 'X', wordId: null }, { letter: 'X', wordId: null }],
      ],
      placedWords: [createWord({ cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] })],
    } as never;

    expect(buildReviewLetterGridHtml(grid)).toContain('grid-cell--review-missed');
    expect(buildReviewLetterGridHtml(grid)).toContain('--cell-color:var(--word-color-0)');
  });

  it('marks found clues with strikethrough and missed clues without', () => {
    const grid = {
      placedWords: [
        createWord({ id: 'w1', text: 'lion', found: true, colorIndex: 0 }),
        createWord({ id: 'w2', text: 'tiger', found: false }),
      ],
    } as never;

    const html = buildReviewClueListHtml(grid);

    expect(html).toContain('review-clue__word--found');
    expect(html).toContain('>TIGER<');
    expect(html.match(/review-clue__word--found/g)?.length).toBe(1);
    expect(html).toContain('review-clue--missed');
    expect(html).toContain('review-clue--found');
  });
});
