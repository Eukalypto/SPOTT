import { describe, expect, it } from 'vitest';

import type { PlacedWord } from '@spott/engine';

import { buildReviewLetterGridHtml, revealWordText } from './grid-review.js';
import { getCellTileUrl } from '../utils/tile-assets.js';

function createWord(overrides: Partial<{
  id: string;
  text: string;
  found: boolean;
  colorIndex: number | null;
  maskType: 'none' | 'partial' | 'full';
  cells: { row: number; col: number }[];
}> = {}) {
  const text = overrides.text ?? 'lion';

  return {
    id: 'w1',
    text,
    normalizedText: text,
    length: text.length as never,
    direction: 'horizontal-right' as const,
    start: { row: 0, col: 0 },
    end: { row: 0, col: text.length - 1 },
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

  it('gives an unfound word the neutral default tile, not a colored one', () => {
    const grid = {
      cells: [
        [{ letter: 'L', wordId: 'w1' }, { letter: 'I', wordId: 'w1' }],
        [{ letter: 'X', wordId: null }, { letter: 'X', wordId: null }],
      ],
      placedWords: [createWord({ cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], found: false })],
    } as never;

    const html = buildReviewLetterGridHtml(grid);

    expect(html).toContain('grid-cell--review-missed');
    expect(html).toContain(`--cell-tile-url:url('${getCellTileUrl(null)}')`);
  });

  it('gives a found word its real find-order color', () => {
    const grid = {
      cells: [[{ letter: 'L', wordId: 'w1' }, { letter: 'I', wordId: 'w1' }]],
      placedWords: [
        createWord({ cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], found: true, colorIndex: 3 }),
      ],
    } as never;

    const html = buildReviewLetterGridHtml(grid);

    expect(html).toContain('grid-cell--review-found');
    expect(html).toContain(`--cell-tile-url:url('${getCellTileUrl(3)}')`);
  });

  it('never lets an unfound word collide with a found word\'s color (fb#12)', () => {
    // Regression: the old fallback colored unfound words by their array
    // position (wordIndex % WORDS_PER_GRID), which could coincidentally equal
    // another word's real find-order colorIndex and paint both the same color.
    // Here the found word (array position 0) has real colorIndex 2, and the
    // unfound word (array position 2) would have collided under the old
    // `wordIndex % WORDS_PER_GRID` formula (2 % 6 = 2).
    const grid = {
      cells: [
        [{ letter: 'L', wordId: 'w1' }, { letter: 'I', wordId: 'w1' }],
        [{ letter: 'B', wordId: 'w3' }, { letter: 'E', wordId: 'w3' }],
      ],
      placedWords: [
        createWord({ id: 'w1', cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }], found: true, colorIndex: 2 }),
        createWord({ id: 'w2', text: 'noop', cells: [], found: false }),
        createWord({ id: 'w3', text: 'bear', cells: [{ row: 1, col: 0 }, { row: 1, col: 1 }], found: false }),
      ],
    } as never;

    const html = buildReviewLetterGridHtml(grid);
    const foundTileUrl = getCellTileUrl(2);

    // Only the found word's own 2 cells may use its color; the unfound word must not.
    const foundTileOccurrences = html.split(`--cell-tile-url:url('${foundTileUrl}')`).length - 1;
    expect(foundTileOccurrences).toBe(2);
  });
});
