import { describe, expect, it } from 'vitest';
import { DIRECTIONS, GAME_CONFIG } from '../config/index.js';
import { detectOverlaps } from '../duplicate-detection/index.js';
import { ENGLISH_SAMPLE_THEMES } from '../sample-data/english/themes.js';
import { toThemeWordSet } from '../sample-data/types.js';
import {
  assertGeneratedGridInvariants,
  DEFAULT_GRID_CONFIG,
  generateGrid,
} from './generate-grid.js';

const FOREST_THEME = toThemeWordSet(ENGLISH_SAMPLE_THEMES[0]);

function generateForestGrid(index = 0) {
  const result = generateGrid({
    id: `grid-${index}`,
    index,
    themeWordSet: FOREST_THEME,
    difficulty: 'A',
    language: 'en',
    config: DEFAULT_GRID_CONFIG,
  });

  if (!result.success) {
    throw new Error(`Grid generation failed: ${result.reason}`);
  }

  return result.grid;
}

describe('generateGrid', () => {
  it('generates a successful grid from English sample data', () => {
    const result = generateGrid({
      id: 'grid-test',
      index: 0,
      themeWordSet: FOREST_THEME,
      difficulty: 'A',
      language: 'en',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.grid.themeId).toBe('en-forest');
    expect(result.grid.difficulty).toBe('A');
  });

  it('produces a 7×7 grid', () => {
    const grid = generateForestGrid();
    expect(grid.size).toBe(7);
    expect(grid.cells).toHaveLength(7);
    expect(grid.cells.every((row) => row.length === 7)).toBe(true);
  });

  it('places exactly six words with required lengths', () => {
    const grid = generateForestGrid();
    expect(grid.placedWords).toHaveLength(6);

    const lengthCounts = grid.placedWords.reduce<Map<number, number>>((counts, word) => {
      counts.set(word.length, (counts.get(word.length) ?? 0) + 1);
      return counts;
    }, new Map());

    expect(lengthCounts.get(4)).toBe(2);
    expect(lengthCounts.get(5)).toBe(2);
    expect(lengthCounts.get(6)).toBe(1);
    expect(lengthCounts.get(7)).toBe(1);
  });

  it('uses each configured direction exactly once', () => {
    const grid = generateForestGrid();
    const directions = grid.placedWords.map((word) => word.direction).sort();
    const expected = DIRECTIONS.map((direction) => direction.name).sort();

    expect(directions).toEqual(expected);
  });

  it('places words without overlap', () => {
    const grid = generateForestGrid();
    const overlap = detectOverlaps(grid.placedWords);
    expect(overlap.hasOverlap).toBe(false);
  });

  it('keeps all placed words within bounds', () => {
    const grid = generateForestGrid();

    for (const placedWord of grid.placedWords) {
      for (const cell of placedWord.cells) {
        expect(cell.row).toBeGreaterThanOrEqual(0);
        expect(cell.col).toBeGreaterThanOrEqual(0);
        expect(cell.row).toBeLessThan(7);
        expect(cell.col).toBeLessThan(7);
      }
    }
  });

  it('fills all empty cells with letters', () => {
    const grid = generateForestGrid();

    for (const row of grid.cells) {
      for (const cell of row) {
        expect(cell.letter).toMatch(/^[A-ZÑ]$/);
      }
    }
  });

  it('returns placed word metadata with initial state', () => {
    const grid = generateForestGrid();
    const placedWord = grid.placedWords[0];

    expect(placedWord.text).toBeTruthy();
    expect(placedWord.normalizedText).toBeTruthy();
    expect(placedWord.start).toEqual(placedWord.cells[0]);
    expect(placedWord.end).toEqual(placedWord.cells[placedWord.cells.length - 1]);
    expect(placedWord.maskType).toBe('none');
    expect(placedWord.found).toBe(false);
  });

  it('writes placed letters onto the grid cells', () => {
    const grid = generateForestGrid();

    for (const placedWord of grid.placedWords) {
      for (let index = 0; index < placedWord.cells.length; index++) {
        const { row, col } = placedWord.cells[index];
        expect(grid.cells[row][col].letter).toBe(
          placedWord.normalizedText[index].toUpperCase(),
        );
        expect(grid.cells[row][col].wordId).toBe(placedWord.id);
      }
    }
  });

  it('passes shared grid invariants helper', () => {
    const grid = generateForestGrid();
    expect(() => assertGeneratedGridInvariants(grid)).not.toThrow();
  });

  it('generates grids for every English sample theme', () => {
    for (const [index, theme] of ENGLISH_SAMPLE_THEMES.entries()) {
      const result = generateGrid({
        id: `grid-${theme.themeId}`,
        index,
        themeWordSet: toThemeWordSet(theme),
        difficulty: theme.difficultyTier,
        language: 'en',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        assertGeneratedGridInvariants(result.grid);
      }
    }
  });

  it('returns invalid-word-set when theme lacks required lengths', () => {
    const result = generateGrid({
      id: 'grid-invalid',
      index: 0,
      themeWordSet: {
        themeId: 'invalid',
        label: 'Invalid',
        difficultyTier: 'A',
        words: ['bear', 'wolf', 'tiger', 'eagle'],
      },
      difficulty: 'A',
      language: 'en',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('invalid-word-set');
    }
  });

  it('uses normalized word length for selection', () => {
    const result = generateGrid({
      id: 'grid-fr',
      index: 0,
      themeWordSet: {
        themeId: 'fr-test',
        label: 'French',
        difficultyTier: 'A',
        words: ['loup', 'ours', 'aigle', 'fête', 'foret', 'jardin', 'branche', 'country'],
      },
      difficulty: 'A',
      language: 'fr',
    });

    expect(result.success).toBe(true);
  });

  it('varies word starting positions across runs for the same word set', () => {
    const fingerprints = new Set<string>();

    for (let run = 0; run < 10; run++) {
      const result = generateGrid({
        id: `grid-variety-${run}`,
        index: 0,
        themeWordSet: FOREST_THEME,
        difficulty: 'A',
        language: 'en',
      });

      expect(result.success).toBe(true);
      if (!result.success) {
        return;
      }

      const fingerprint = result.grid.placedWords
        .map((word) => `${word.normalizedText}:${word.start.row},${word.start.col}`)
        .sort()
        .join('|');
      fingerprints.add(fingerprint);
    }

    expect(fingerprints.size).toBeGreaterThanOrEqual(5);
  });
});

describe('generateGrid config', () => {
  it('respects custom config inputs', () => {
    const grid = generateForestGrid();
    expect(grid.size).toBe(GAME_CONFIG.gridSize);
    expect(grid.placedWords).toHaveLength(GAME_CONFIG.wordsPerGrid);
  });
});
