import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SWIPE_VALIDATION_CONFIG,
  inferDirectionFromPath,
  validateSwipe,
  validateSwipePath,
} from './validate-swipe.js';
import type { GridData } from '../types/grid.js';
import type { PlacedWord } from '../types/word.js';
import type { SwipeValidationConfig } from './validate-swipe.js';

function createPlacedWord(
  id: string,
  text: string,
  cells: Coordinate[],
  options?: Partial<PlacedWord>,
): PlacedWord {
  return {
    id,
    text,
    normalizedText: text.toLowerCase(),
    length: text.length as PlacedWord['length'],
    direction: 'horizontal-right',
    start: cells[0],
    end: cells[cells.length - 1],
    cells,
    maskType: 'none',
    found: false,
    findOrder: null,
    colorIndex: null,
    ...options,
  };
}

type Coordinate = { row: number; col: number };

function createGrid(placedWords: PlacedWord[]): GridData {
  const size = 7;
  const cells = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ letter: 'X', wordId: null as string | null })),
  );

  for (const placedWord of placedWords) {
    for (let index = 0; index < placedWord.cells.length; index++) {
      const { row, col } = placedWord.cells[index];
      cells[row][col] = {
        letter: placedWord.normalizedText[index].toUpperCase(),
        wordId: placedWord.id,
      };
    }
  }

  return {
    id: 'swipe-grid',
    index: 0,
    size,
    themeId: 'test',
    themeLabel: 'Test',
    difficulty: 'A',
    cells,
    placedWords,
    maskingPolicy: { fullCount: 0, partialCount: 0 },
  };
}

const bear = createPlacedWord('w1', 'bear', [
  { row: 3, col: 1 },
  { row: 3, col: 2 },
  { row: 3, col: 3 },
  { row: 3, col: 4 },
]);

const tiger = createPlacedWord('w2', 'tiger', [
  { row: 1, col: 0 },
  { row: 1, col: 1 },
  { row: 1, col: 2 },
  { row: 1, col: 3 },
  { row: 1, col: 4 },
]);

function config(allowOvershoot: boolean): SwipeValidationConfig {
  return {
    ...DEFAULT_SWIPE_VALIDATION_CONFIG,
    allowOvershoot,
  };
}

describe('validateSwipe', () => {
  it('accepts a correct forward swipe on the intended coordinates', () => {
    const grid = createGrid([bear, tiger]);
    const result = validateSwipe(grid, bear.cells, config(false));

    expect(result).toEqual({ isValid: true, wordId: 'w1' });
  });

  it('rejects a reverse swipe on the same word', () => {
    const grid = createGrid([bear]);
    const reversePath = [...bear.cells].reverse();

    expect(validateSwipe(grid, reversePath, config(false))).toEqual({
      isValid: false,
      reason: 'reverse-not-allowed',
    });
  });

  it('rejects a wrong path even when the letters match duplicate text elsewhere', () => {
    const grid = createGrid([bear]);
    grid.cells[0][0].letter = 'B';
    grid.cells[0][1].letter = 'E';
    grid.cells[0][2].letter = 'A';
    grid.cells[0][3].letter = 'R';

    expect(
      validateSwipe(
        grid,
        [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 },
        ],
        config(false),
      ),
    ).toEqual({ isValid: false, reason: 'word-not-found' });
  });

  it('rejects a non-straight path', () => {
    const grid = createGrid([bear]);

    expect(
      validateSwipe(
        grid,
        [
          { row: 3, col: 1 },
          { row: 3, col: 2 },
          { row: 4, col: 2 },
          { row: 4, col: 3 },
        ],
        config(false),
      ),
    ).toEqual({ isValid: false, reason: 'path-not-contiguous' });
  });

  it('rejects swipes on already-found words', () => {
    const grid = createGrid([{ ...bear, found: true }]);

    expect(validateSwipe(grid, bear.cells, config(false))).toEqual({
      isValid: false,
      reason: 'word-already-found',
    });
  });

  it('requires an exact coordinate match when overshoot is disabled', () => {
    const grid = createGrid([bear]);
    const extendedPath = [...bear.cells, { row: 3, col: 5 }];

    expect(validateSwipe(grid, extendedPath, config(false))).toEqual({
      isValid: false,
      reason: 'path-length-mismatch',
    });
  });

  it('allows overshoot when enabled and the initial segment matches the word', () => {
    const grid = createGrid([bear]);
    const extendedPath = [...bear.cells, { row: 3, col: 5 }];

    expect(validateSwipe(grid, extendedPath, config(true))).toEqual({
      isValid: true,
      wordId: 'w1',
    });
  });

  it('rejects overshoot paths that do not start with the intended word coordinates', () => {
    const grid = createGrid([bear]);
    const wrongPrefix = [
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
    ];

    expect(validateSwipe(grid, wrongPrefix, config(true))).toEqual({
      isValid: false,
      reason: 'word-not-found',
    });
  });

  it('rejects paths that do not follow a configured direction', () => {
    const grid = createGrid([bear]);

    expect(
      validateSwipe(
        grid,
        [
          { row: 3, col: 1 },
          { row: 4, col: 3 },
        ],
        config(false),
      ),
    ).toEqual({ isValid: false, reason: 'invalid-direction' });
  });

  it('rejects reverse vertical swipes', () => {
    const vertical = createPlacedWord('w3', 'tree', [
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
    ]);
    const grid = createGrid([vertical]);
    const reverse = [...vertical.cells].reverse();

    expect(validateSwipe(grid, reverse, config(false))).toEqual({
      isValid: false,
      reason: 'reverse-not-allowed',
    });
  });

  it('rejects overshoot when the path is shorter than the word', () => {
    const grid = createGrid([bear]);
    const shortPath = bear.cells.slice(0, 3);

    expect(validateSwipe(grid, shortPath, config(false))).toEqual({
      isValid: false,
      reason: 'word-not-found',
    });
  });

  it('rejects reverse paths even when overshoot is enabled', () => {
    const grid = createGrid([bear]);
    const reverseExtended = [...[...bear.cells].reverse(), { row: 3, col: 0 }];

    expect(validateSwipe(grid, reverseExtended, config(true))).toEqual({
      isValid: false,
      reason: 'reverse-not-allowed',
    });
  });
});

describe('inferDirectionFromPath', () => {
  it('returns the direction name for a straight path', () => {
    expect(
      inferDirectionFromPath([
        { row: 3, col: 1 },
        { row: 3, col: 2 },
        { row: 3, col: 3 },
      ]),
    ).toBe('horizontal-right');
  });

  it('returns null for a single cell', () => {
    expect(inferDirectionFromPath([{ row: 0, col: 0 }])).toBeNull();
  });
});

describe('validateSwipePath compatibility', () => {
  it('wraps validateSwipe for legacy callers using foundWordIds', () => {
    const grid = createGrid([bear]);

    expect(validateSwipePath(grid, { cells: bear.cells }, new Set(['w1']))).toEqual({
      isValid: false,
      reason: 'word-already-found',
    });
  });
});
