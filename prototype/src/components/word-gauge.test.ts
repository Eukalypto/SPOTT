import { describe, expect, it } from 'vitest';

import { getWordHighlightColor, WORDS_PER_GRID } from '../utils/word-colors.js';
import { buildGaugeHtml, getFilledGaugeNotches } from './word-gauge.js';
import { buildLetterGridHtml, getFoundCellColorIndexes } from '../utils/grid-display.js';

function createFoundWord(
  id: string,
  findOrder: number,
  cells: { row: number; col: number }[],
) {
  return {
    id,
    text: id,
    normalizedText: id,
    length: 4 as const,
    direction: 'horizontal-right' as const,
    start: cells[0],
    end: cells[cells.length - 1],
    cells,
    maskType: 'none' as const,
    found: true,
    findOrder,
    colorIndex: findOrder - 1,
  };
}

describe('word gauge and found-word coloring', () => {
  it('renders exactly six notches per grid', () => {
    const grid = { placedWords: [] } as unknown as Parameters<typeof buildGaugeHtml>[0];
    const html = buildGaugeHtml(grid);
    expect(html.match(/gauge-notch/g)?.length).toBe(WORDS_PER_GRID);
  });

  it('fills notches left to right in find order with unique palette colors', () => {
    const grid = {
      placedWords: [
        createFoundWord('w2', 2, [{ row: 0, col: 1 }]),
        createFoundWord('w1', 1, [{ row: 0, col: 0 }]),
      ],
    } as unknown as Parameters<typeof buildGaugeHtml>[0];

    const notches = getFilledGaugeNotches(grid);
    expect(notches[0]?.colorIndex).toBe(0);
    expect(notches[1]?.colorIndex).toBe(1);
    expect(notches[2]).toBeUndefined();

    expect(buildGaugeHtml(grid)).toContain(getWordHighlightColor(0));
    expect(buildGaugeHtml(grid)).toContain(getWordHighlightColor(1));
  });

  it('uses the same color index on grid cells as the assigned word color', () => {
    const grid = {
      size: 7,
      cells: Array.from({ length: 7 }, () =>
        Array.from({ length: 7 }, () => ({ letter: 'A', wordId: null })),
      ),
      placedWords: [
        createFoundWord('w1', 1, [
          { row: 2, col: 2 },
          { row: 2, col: 3 },
        ]),
      ],
    } as unknown as Parameters<typeof buildLetterGridHtml>[0];

    const colorIndexes = getFoundCellColorIndexes(grid);
    expect(colorIndexes.get('2,2')).toBe(0);
    expect(colorIndexes.get('2,3')).toBe(0);
    expect(buildLetterGridHtml(grid)).toContain(`background-color:${getWordHighlightColor(0)}`);
  });

  it('keeps found-word colors when revisiting a skipped grid', () => {
    const grid = {
      size: 7,
      cells: Array.from({ length: 7 }, () =>
        Array.from({ length: 7 }, () => ({ letter: 'A', wordId: null })),
      ),
      placedWords: [
        createFoundWord('w1', 1, [{ row: 1, col: 1 }]),
        {
          ...createFoundWord('w2', 2, [{ row: 3, col: 3 }]),
          found: false,
          findOrder: null,
          colorIndex: null,
        },
      ],
    } as unknown as Parameters<typeof getFoundCellColorIndexes>[0];

    expect(getFoundCellColorIndexes(grid).get('1,1')).toBe(0);
    expect(getFoundCellColorIndexes(grid).has('3,3')).toBe(false);
    expect(getFilledGaugeNotches(grid).filter(Boolean)).toHaveLength(1);
  });

  it('exposes six distinct palette colors', () => {
    const palette = Array.from({ length: WORDS_PER_GRID }, (_, index) =>
      getWordHighlightColor(index),
    );
    expect(new Set(palette).size).toBe(WORDS_PER_GRID);
  });
});
