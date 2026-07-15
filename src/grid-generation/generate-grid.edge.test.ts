import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockHasUniqueTargetWordOccurrences, realHasUniqueRef } = vi.hoisted(() => ({
  mockHasUniqueTargetWordOccurrences: vi.fn(),
  realHasUniqueRef: {
    current: null as
      | ((grid: import('../types/grid.js').GridData, directions?: readonly import('../types/direction.js').DirectionDefinition[]) => boolean)
      | null,
  },
}));

vi.mock('../duplicate-detection/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../duplicate-detection/index.js')>();
  realHasUniqueRef.current = actual.hasUniqueTargetWordOccurrences;
  return {
    ...actual,
    hasUniqueTargetWordOccurrences: (
      ...args: Parameters<typeof actual.hasUniqueTargetWordOccurrences>
    ) => mockHasUniqueTargetWordOccurrences(...args),
  };
});

import { DIRECTIONS, FILLER_ALPHABET, GAME_CONFIG } from '../config/index.js';
import { createSeededRandom } from '../random/index.js';
import { ENGLISH_SAMPLE_THEMES } from '../sample-data/english/themes.js';
import { toThemeWordSet } from '../sample-data/types.js';
import {
  assertGeneratedGridInvariants,
  DEFAULT_GRID_CONFIG,
  generateGrid,
  MAX_FILL_ATTEMPTS,
  type GenerateGridConfig,
} from './generate-grid.js';

const FOREST_THEME = toThemeWordSet(ENGLISH_SAMPLE_THEMES[0]);

const BASE_OPTIONS = {
  id: 'edge-grid',
  index: 0,
  themeWordSet: FOREST_THEME,
  difficulty: 'A' as const,
  language: 'en' as const,
};

beforeEach(() => {
  mockHasUniqueTargetWordOccurrences.mockReset();
  mockHasUniqueTargetWordOccurrences.mockImplementation((grid, directions) => {
    if (!realHasUniqueRef.current) {
      throw new Error('Duplicate detection mock was not initialized');
    }
    return realHasUniqueRef.current(grid, directions);
  });
});

describe('generateGrid failure paths', () => {
  it('returns invalid-word-set when direction count does not match words per grid', () => {
    const result = generateGrid({
      ...BASE_OPTIONS,
      config: {
        ...DEFAULT_GRID_CONFIG,
        directions: DIRECTIONS.slice(0, 3),
      },
    });

    expect(result).toEqual({ success: false, reason: 'invalid-word-set' });
  });

  it('returns placement-impossible when words cannot fit on a tiny grid', () => {
    const tinyConfig: GenerateGridConfig = {
      game: {
        gridSize: 3,
        wordLengthComposition: GAME_CONFIG.wordLengthComposition,
      },
      directions: DIRECTIONS,
      fillerAlphabet: FILLER_ALPHABET,
    };

    const result = generateGrid({
      ...BASE_OPTIONS,
      config: tinyConfig,
    });

    expect(result).toEqual({ success: false, reason: 'placement-impossible' });
  });

  it('retries filler placement when duplicate target words appear', () => {
    let calls = 0;
    mockHasUniqueTargetWordOccurrences.mockImplementation(() => {
      calls += 1;
      return calls >= 3;
    });

    const result = generateGrid(BASE_OPTIONS);

    expect(result.success).toBe(true);
    expect(calls).toBe(3);
  });

  it('returns placement-impossible when filler never clears duplicate targets', () => {
    mockHasUniqueTargetWordOccurrences.mockReturnValue(false);

    const result = generateGrid(BASE_OPTIONS);

    expect(result).toEqual({ success: false, reason: 'placement-impossible' });
    expect(mockHasUniqueTargetWordOccurrences.mock.calls.length).toBeGreaterThanOrEqual(
      MAX_FILL_ATTEMPTS,
    );
  });
});

describe('generateGrid determinism', () => {
  it('produces identical filler letters with the same seeded random function', () => {
    const first = generateGrid({ ...BASE_OPTIONS, random: createSeededRandom(42_424) });
    const second = generateGrid({ ...BASE_OPTIONS, random: createSeededRandom(42_424) });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    if (!first.success || !second.success) {
      return;
    }

    expect(first.grid.placedWords.map((word) => word.normalizedText)).toEqual(
      second.grid.placedWords.map((word) => word.normalizedText),
    );
    expect(first.grid.cells).toEqual(second.grid.cells);
  });

  it('can vary filler output across different seeds', () => {
    const first = generateGrid({ ...BASE_OPTIONS, random: createSeededRandom(1) });
    const second = generateGrid({ ...BASE_OPTIONS, random: createSeededRandom(99_999) });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    if (!first.success || !second.success) {
      return;
    }

    const firstFiller = first.grid.cells.flat().filter((cell) => cell.wordId === null);
    const secondFiller = second.grid.cells.flat().filter((cell) => cell.wordId === null);
    expect(firstFiller.some((cell, index) => cell.letter !== secondFiller[index].letter)).toBe(
      true,
    );
  });
});

describe('generateGrid language edge cases', () => {
  it('generates a Spanish grid with ñ in placed words', () => {
    const result = generateGrid({
      id: 'grid-es',
      index: 0,
      themeWordSet: {
        themeId: 'es-test',
        label: 'Spanish',
        difficultyTier: 'A',
        words: ['luna', 'lobo', 'tigre', 'pluma', 'jardin', 'montaña'],
      },
      difficulty: 'A',
      language: 'es',
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const normalizedTexts = result.grid.placedWords.map((word) => word.normalizedText);
    expect(normalizedTexts.some((text) => text.includes('ñ'))).toBe(true);
    assertGeneratedGridInvariants(result.grid);
  });
});

describe('assertGeneratedGridInvariants', () => {
  it('throws when placed words overlap', () => {
    const grid = generateGrid(BASE_OPTIONS);
    if (!grid.success) {
      throw new Error('Expected successful grid');
    }

    const [firstWord, secondWord] = grid.grid.placedWords;
    const broken = {
      ...grid.grid,
      placedWords: grid.grid.placedWords.map((word, index) =>
        index === 1
          ? {
              ...word,
              // Overlap one cell without changing path length (lengths may differ).
              cells: [firstWord.cells[0], ...secondWord.cells.slice(1)],
              start: firstWord.cells[0],
            }
          : word,
      ),
    };

    expect(() => assertGeneratedGridInvariants(broken)).toThrow('Placed words overlap');
  });
});
