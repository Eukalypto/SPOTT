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
    { gridNumber: 6, index: 5, full: 0, partial: 0, none: 6 },
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

  it('hides half the letters (rounded up) as one contiguous block at a random-but-stable position', () => {
    const clue = getDisplayedClue({
      ...createPlacedWord('w1', 'lion'),
      maskType: 'partial',
    });

    expect(clue).toHaveLength(4);
    expect(clue.match(/#/g)).toHaveLength(2);

    const candidates = ['##ON', 'L##N', 'LI##'];
    expect(candidates).toContain(clue);

    // Same word id always yields the same mask position (no jumping on re-render).
    const again = getDisplayedClue({
      ...createPlacedWord('w1', 'lion'),
      maskType: 'partial',
    });
    expect(again).toBe(clue);
  });

  it('does not always hide the same block position across different words', () => {
    const offsets = new Set(
      Array.from({ length: 30 }, (_, index) =>
        getDisplayedClue({
          ...createPlacedWord(`word-${index}`, 'tiger'),
          maskType: 'partial',
        }),
      ),
    );

    // Range is 5 - 3 + 1 = 3 possible positions; 30 different ids should hit more than one.
    expect(offsets.size).toBeGreaterThan(1);
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

  /** Every valid partial-mask rendering for a word, one per possible hidden-block position. */
  function partialMaskCandidates(displayLetters: string[], hiddenCount: number): string[] {
    const range = displayLetters.length - hiddenCount + 1;
    return Array.from({ length: range }, (_, offset) => {
      const before = displayLetters.slice(0, offset).join('').toUpperCase();
      const after = displayLetters.slice(offset + hiddenCount).join('').toUpperCase();
      return `${before}${'#'.repeat(hiddenCount)}${after}`;
    });
  }

  it('preserves Spanish ñ in visible partial clue letters', () => {
    const word = createPlacedWord('w1', 'señor', 'señor');
    const clue = getDisplayedClue({ ...word, maskType: 'partial' });

    expect(partialMaskCandidates([...'señor'], 3)).toContain(clue);
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
    const clue = getDisplayedClue({
      ...createPlacedWord('w1', 'fête', 'fete'),
      maskType: 'partial',
    });

    expect(partialMaskCandidates([...'fête'], 2)).toContain(clue);
  });

  it('aligns partial clues to normalized length for French ligatures', () => {
    const clue = getDisplayedClue({
      ...createPlacedWord('w1', 'cœur', 'coeur'),
      maskType: 'partial',
    });

    // "cœur" -> normalized "coeur" (5 letters); hidden block is 3 letters.
    expect(clue).toHaveLength(5);
    expect(clue.match(/#/g)).toHaveLength(3);
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
