import { describe, expect, it } from 'vitest';

import type { PlacedWord } from '@spott/engine';

import {
  buildReviewClueListHtml,
  buildReviewLetterGridHtml,
  revealWordText,
} from './grid-review.js';
import { formatClueDisplayHtml } from '../utils/html.js';
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

  it('colors all target words on the review grid', () => {
    const grid = {
      cells: [
        [{ letter: 'L', wordId: 'w1' }, { letter: 'I', wordId: 'w1' }],
        [{ letter: 'X', wordId: null }, { letter: 'X', wordId: null }],
      ],
      placedWords: [createWord({ cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] })],
    } as never;

    expect(buildReviewLetterGridHtml(grid)).toContain('grid-cell--review-missed');
    expect(buildReviewLetterGridHtml(grid)).toContain(`--cell-tile-url:url('${getCellTileUrl(0)}')`);
    expect(buildReviewLetterGridHtml(grid)).not.toContain('--cell-color:var(--word-color-0)');
  });

  it('marks found clues with strikethrough and missed clues without', () => {
    const grid = {
      placedWords: [
        createWord({ id: 'w1', text: 'lion', found: true, colorIndex: 0, maskType: 'none' }),
        createWord({ id: 'w2', text: 'tiger', found: false, maskType: 'none' }),
      ],
    } as never;

    const html = buildReviewClueListHtml(grid);

    expect(html).toContain('review-clue__word--found');
    expect(html).toContain(formatClueDisplayHtml('TIGER'));
    expect(html.match(/review-clue__word--found/g)?.length).toBe(1);
    expect(html).toContain('review-clue--missed');
    expect(html).toContain('review-clue--found');
    expect(html).toContain('>Missed<');
  });

  it('keeps review clues in their original placedWords position, not grouped by found status', () => {
    const grid = {
      placedWords: [
        createWord({ id: 'w1', text: 'lion', found: false, maskType: 'none' }),
        createWord({ id: 'w2', text: 'tiger', found: true, colorIndex: 0, maskType: 'none' }),
        createWord({ id: 'w3', text: 'bear', found: false, maskType: 'none' }),
      ],
    } as never;

    const html = buildReviewClueListHtml(grid);
    const ids = [...html.matchAll(/data-word-id="([^"]+)"/g)].map((match) => match[1]);

    expect(ids).toEqual(['w1', 'w2', 'w3']);
  });

  it('keeps missed words masked (A2h) and only reveals words the player found', () => {
    const grid = {
      placedWords: [
        createWord({ id: 'w1', text: 'lion', found: true, colorIndex: 0, maskType: 'full' }),
        createWord({ id: 'w2', text: 'tiger', found: false, maskType: 'full' }),
        createWord({ id: 'w3', text: 'sardine', found: false, maskType: 'partial' }),
      ],
    } as never;

    const html = buildReviewClueListHtml(grid);

    expect(html).toContain(formatClueDisplayHtml('LION'));
    expect(html).not.toContain(formatClueDisplayHtml('TIGER'));
    expect(html).not.toContain(formatClueDisplayHtml('SARDINE'));
    expect(html.match(/clue-mask/g)?.length).toBeGreaterThan(0);
  });
});
