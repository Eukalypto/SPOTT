import { describe, expect, it } from 'vitest';
import { GRID_MASKING_POLICIES, getGridMaskingPolicy } from '../config/masking-config.js';
import { applyMasking, assignMaskTypes } from './apply-masking.js';
import { getDisplayedClue } from './get-displayed-clue.js';
import type { GridData } from '../types/grid.js';
import type { PlacedWord } from '../types/word.js';

function createPlacedWord(
  id: string,
  text: string,
  normalizedText = text.toLowerCase(),
): PlacedWord {
  const length = normalizedText.length as PlacedWord['length'];
  return {
    id,
    text,
    normalizedText,
    length,
    direction: 'horizontal-right',
    start: { row: 0, col: 0 },
    end: { row: 0, col: length - 1 },
    cells: Array.from({ length }, (_, col) => ({ row: 0, col })),
    maskType: 'none',
    found: false,
    findOrder: null,
    colorIndex: null,
  };
}

function createGrid(index: number, words: PlacedWord[]): GridData {
  return {
    id: `grid-${index}`,
    index,
    size: 7,
    themeId: 'test-theme',
    themeLabel: 'Test',
    difficulty: 'A',
    cells: [],
    placedWords: words,
    maskingPolicy: getGridMaskingPolicy(index),
  };
}

function wordsForGrid(index: number): PlacedWord[] {
  return [
    createPlacedWord(`grid-${index}-word-1`, 'lion'),
    createPlacedWord(`grid-${index}-word-2`, 'tiger'),
    createPlacedWord(`grid-${index}-word-3`, 'eagle'),
    createPlacedWord(`grid-${index}-word-4`, 'whale'),
    createPlacedWord(`grid-${index}-word-5`, 'forest'),
    createPlacedWord(`grid-${index}-word-6`, 'country'),
  ];
}

function maskCounts(words: PlacedWord[]): Record<string, number> {
  return words.reduce<Record<string, number>>(
    (counts, word) => {
      counts[word.maskType] = (counts[word.maskType] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

describe('applyMasking — Classic schedule', () => {
  it.each([
    { gridNumber: 1, index: 0, full: 0, partial: 0, none: 6 },
    { gridNumber: 2, index: 1, full: 0, partial: 0, none: 6 },
    { gridNumber: 3, index: 2, full: 1, partial: 1, none: 4 },
    { gridNumber: 4, index: 3, full: 0, partial: 0, none: 6 },
    { gridNumber: 5, index: 4, full: 2, partial: 2, none: 2 },
    { gridNumber: 6, index: 5, full: 1, partial: 1, none: 4 },
    { gridNumber: 7, index: 6, full: 2, partial: 2, none: 2 },
  ])(
    'grid $gridNumber applies $full full, $partial partial, and $none none masks',
    ({ index, full, partial, none }) => {
      const masked = applyMasking(createGrid(index, wordsForGrid(index)));
      expect(masked.maskingPolicy).toEqual(GRID_MASKING_POLICIES[index]);
      const counts = maskCounts(masked.placedWords);
      expect(counts.full ?? 0).toBe(full);
      expect(counts.partial ?? 0).toBe(partial);
      expect(counts.none ?? 0).toBe(none);
    },
  );

  it('assigns masks deterministically by sorted word id', () => {
    const words = [
      createPlacedWord('grid-2-word-3', 'eagle'),
      createPlacedWord('grid-2-word-1', 'lion'),
      createPlacedWord('grid-2-word-2', 'tiger'),
      createPlacedWord('grid-2-word-6', 'country'),
      createPlacedWord('grid-2-word-4', 'whale'),
      createPlacedWord('grid-2-word-5', 'forest'),
    ];

    const masked = applyMasking(createGrid(2, words));

    expect(masked.placedWords.find((word) => word.id === 'grid-2-word-1')?.maskType).toBe(
      'full',
    );
    expect(masked.placedWords.find((word) => word.id === 'grid-2-word-2')?.maskType).toBe(
      'partial',
    );
    expect(masked.placedWords.find((word) => word.id === 'grid-2-word-3')?.maskType).toBe(
      'none',
    );
  });

  it('does not mutate the input grid', () => {
    const grid = createGrid(0, wordsForGrid(0));
    const originalMask = grid.placedWords.map((word) => word.maskType);
    applyMasking(grid);
    expect(grid.placedWords.map((word) => word.maskType)).toEqual(originalMask);
  });
});

describe('getDisplayedClue', () => {
  it('shows full mask as # repeated for word length', () => {
    expect(
      getDisplayedClue({
        ...createPlacedWord('w1', 'lion'),
        maskType: 'full',
      }),
    ).toBe('####');

    expect(
      getDisplayedClue({
        ...createPlacedWord('w2', 'tiger'),
        maskType: 'full',
      }),
    ).toBe('#####');
  });

  it('shows partial mask hiding the first half rounded up', () => {
    expect(
      getDisplayedClue({
        ...createPlacedWord('w1', 'lion'),
        maskType: 'partial',
      }),
    ).toBe('##ON');

    expect(
      getDisplayedClue({
        ...createPlacedWord('w2', 'tiger'),
        maskType: 'partial',
      }),
    ).toBe('###ER');
  });

  it('shows unmasked words in uppercase', () => {
    expect(getDisplayedClue(createPlacedWord('w1', 'lion'))).toBe('LION');
  });

  it('shows the full original clue once a word is found', () => {
    expect(
      getDisplayedClue({
        ...createPlacedWord('w1', 'lion'),
        maskType: 'full',
        found: true,
      }),
    ).toBe('LION');
  });

  it('preserves Spanish ñ in visible partial clue letters', () => {
    const word = createPlacedWord('w1', 'señor', 'señor');
    expect(
      getDisplayedClue({
        ...word,
        maskType: 'partial',
      }),
    ).toBe('###OR');
  });

  it('counts ñ as one character for full-mask length', () => {
    expect(
      getDisplayedClue({
        ...createPlacedWord('w1', 'señor', 'señor'),
        maskType: 'full',
      }),
    ).toBe('#####');
  });

  it('preserves French accents in visible partial clue letters', () => {
    expect(
      getDisplayedClue({
        ...createPlacedWord('w1', 'fête', 'fete'),
        maskType: 'partial',
      }),
    ).toBe('##TE');
  });

  it('aligns partial clues to normalized length for French ligatures', () => {
    expect(
      getDisplayedClue({
        ...createPlacedWord('w1', 'cœur', 'coeur'),
        maskType: 'partial',
      }),
    ).toBe('###UR');
  });
});

describe('assignMaskTypes', () => {
  it('matches grid 5 schedule counts', () => {
    const words = wordsForGrid(4);
    const maskById = assignMaskTypes(words, 2, 2);

    expect([...maskById.values()].filter((type) => type === 'full')).toHaveLength(2);
    expect([...maskById.values()].filter((type) => type === 'partial')).toHaveLength(2);
    expect([...maskById.values()].filter((type) => type === 'none')).toHaveLength(2);
  });
});
