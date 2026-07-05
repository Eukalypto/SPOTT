import { describe, expect, it } from 'vitest';
import { DIRECTIONS } from '../config/index.js';
import {
  detectTargetWordDuplicates,
  hasUniqueTargetWordOccurrences,
  pathMatchesPlacedWord,
} from './detect-target-word-duplicates.js';
import type { GridData } from '../types/grid.js';
import type { PlacedWord } from '../types/word.js';
import { generateGrid } from '../grid-generation/generate-grid.js';
import { toThemeWordSet } from '../sample-data/types.js';
import { ENGLISH_SAMPLE_THEMES } from '../sample-data/english/themes.js';

function createTestGrid(cells: string[][], placedWords: PlacedWord[]): GridData {
  return {
    id: 'test-grid',
    index: 0,
    size: cells.length,
    themeId: 'test-theme',
    themeLabel: 'Test',
    difficulty: 'A',
    cells: cells.map((row, rowIndex) =>
      row.map((letter, colIndex) => {
        const owner = placedWords.find((word) =>
          word.cells.some((cell) => cell.row === rowIndex && cell.col === colIndex),
        );
        return {
          letter,
          wordId: owner?.id ?? null,
        };
      }),
    ),
    placedWords,
    maskingPolicy: { fullCount: 0, partialCount: 0 },
  };
}

function placedWord(
  id: string,
  normalizedText: string,
  cells: Array<{ row: number; col: number }>,
): PlacedWord {
  return {
    id,
    text: normalizedText,
    normalizedText,
    length: normalizedText.length as PlacedWord['length'],
    direction: 'horizontal-right',
    start: cells[0],
    end: cells[cells.length - 1],
    cells,
    maskType: 'none',
    found: false,
    findOrder: null,
    colorIndex: null,
  };
}

describe('detectTargetWordDuplicates', () => {
  it('reports exactly one occurrence per target on a valid grid', () => {
    const bear = placedWord('w1', 'bear', [
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
    ]);
    const tiger = placedWord('w2', 'tiger', [
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 1, col: 4 },
    ]);

    const letters = [
      ['T', 'I', 'G', 'E', 'R', 'X', 'Q'],
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
      ['O', 'B', 'E', 'A', 'R', 'P', 'Q'],
      ['R', 'S', 'T', 'U', 'V', 'W', 'X'],
      ['Y', 'Z', 'A', 'B', 'C', 'D', 'E'],
      ['F', 'G', 'H', 'I', 'J', 'K', 'L'],
    ];

    const grid = createTestGrid(letters, [bear, tiger]);
    const report = detectTargetWordDuplicates(grid);

    expect(report.isValid).toBe(true);
    expect(report.countsByTarget.bear).toBe(1);
    expect(report.countsByTarget.tiger).toBe(1);
    expect(report.duplicateTargets).toEqual([]);
  });

  it('detects when filler letters accidentally duplicate a target word', () => {
    const bear = placedWord('w1', 'bear', [
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
    ]);

    const letters = [
      ['B', 'E', 'A', 'R', 'X', 'Y', 'Z'],
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
      ['O', 'B', 'E', 'A', 'R', 'P', 'Q'],
      ['R', 'S', 'T', 'U', 'V', 'W', 'X'],
      ['Y', 'Z', 'A', 'B', 'C', 'D', 'E'],
      ['F', 'G', 'H', 'I', 'J', 'K', 'L'],
    ];

    const grid = createTestGrid(letters, [bear]);
    const report = detectTargetWordDuplicates(grid);

    expect(report.isValid).toBe(false);
    expect(report.countsByTarget.bear).toBe(2);
    expect(report.duplicateTargets).toHaveLength(1);
    expect(report.duplicateTargets[0].occurrences).toHaveLength(2);
    expect(hasUniqueTargetWordOccurrences(grid)).toBe(false);
  });

  it('scans all configured directions', () => {
    const bear = placedWord('w1', 'bear', [
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
      { row: 3, col: 6 },
    ]);

    const letters = [
      ['R', 'A', 'E', 'B', 'X', 'Y', 'Z'],
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
      ['O', 'P', 'Q', 'B', 'E', 'A', 'R'],
      ['R', 'S', 'T', 'U', 'V', 'W', 'X'],
      ['Y', 'Z', 'A', 'B', 'C', 'D', 'E'],
      ['F', 'G', 'H', 'I', 'J', 'K', 'L'],
    ];

    const grid = createTestGrid(letters, [bear]);
    const report = detectTargetWordDuplicates(grid);

    expect(report.isValid).toBe(false);
    expect(report.duplicateTargets[0].occurrences.some(
      (occurrence) => occurrence.direction === 'horizontal-left',
    )).toBe(true);
    expect(DIRECTIONS.length).toBe(6);
  });

  it('uses normalized text for Spanish targets with ñ', () => {
    const word = placedWord('w1', 'señor', [
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ]);

    const letters = [
      ['S', 'E', 'Ñ', 'O', 'R', 'Q', 'W'],
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      ['H', 'S', 'E', 'Ñ', 'O', 'R', 'N'],
      ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
      ['V', 'W', 'X', 'Y', 'Z', 'A', 'B'],
      ['C', 'D', 'E', 'F', 'G', 'H', 'I'],
      ['J', 'K', 'L', 'M', 'N', 'O', 'P'],
    ];

    const grid = createTestGrid(letters, [word]);
    const report = detectTargetWordDuplicates(grid);

    expect(report.isValid).toBe(false);
    expect(report.countsByTarget['señor']).toBe(2);
  });
});

describe('generateGrid duplicate rejection', () => {
  it('returns grids that pass duplicate detection', () => {
    const result = generateGrid({
      id: 'grid-dup-check',
      index: 0,
      themeWordSet: toThemeWordSet(ENGLISH_SAMPLE_THEMES[0]),
      difficulty: 'A',
      language: 'en',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(hasUniqueTargetWordOccurrences(result.grid)).toBe(true);
    }
  });
});

describe('pathMatchesPlacedWord', () => {
  it('matches forward and reverse coordinate paths', () => {
    const word = placedWord('w1', 'bear', [
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
    ]);

    expect(pathMatchesPlacedWord(word.cells, word)).toBe(true);
    expect(pathMatchesPlacedWord([...word.cells].reverse(), word)).toBe(true);
    expect(pathMatchesPlacedWord(word.cells.slice(0, 3), word)).toBe(false);
  });

  it('does not treat n as ñ when scanning duplicate targets', () => {
    const senor = placedWord('w1', 'senor', [
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ]);

    const letters = [
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
      ['X', 'S', 'E', 'N', 'O', 'R', 'Q'],
      ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
      ['V', 'W', 'X', 'Y', 'Z', 'A', 'B'],
      ['C', 'D', 'E', 'F', 'G', 'H', 'I'],
      ['J', 'K', 'L', 'M', 'N', 'O', 'P'],
    ];

    const grid = createTestGrid(letters, [senor]);
    const report = detectTargetWordDuplicates(grid);

    expect(report.isValid).toBe(true);
    expect(report.countsByTarget.senor).toBe(1);
  });
});
