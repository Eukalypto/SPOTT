import { getDisplayedClue, toDisplayUpperCase, type PlacedWord } from '@spott/engine';
import { describe, expect, it } from 'vitest';

import { formatGridCellLetter } from './grid-display.js';
import { startPracticeRoundState } from './round-setup.js';

describe('formatGridCellLetter', () => {
  it('uppercases normalized grid letters including Spanish ñ', () => {
    expect(formatGridCellLetter('ñ')).toBe('Ñ');
    expect(formatGridCellLetter('n')).toBe('N');
    expect(formatGridCellLetter('a')).toBe('A');
  });
});

describe('word display across languages', () => {
  it('uses original text for clues and normalized letters for grid cells in English', () => {
    const result = startPracticeRoundState({
      roundId: 'display-en',
      language: 'en',
      uiLocale: 'en',
    });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const grid = result.roundState.round.grids[0];
    for (const word of grid.placedWords) {
      expect(getDisplayedClue({ ...word, maskType: 'none' })).toBe(
        toDisplayUpperCase(word.text.trim()),
      );

      for (let index = 0; index < word.cells.length; index++) {
        const cell = grid.cells[word.cells[index].row][word.cells[index].col];
        expect(cell.letter).toBe(toDisplayUpperCase(word.normalizedText[index]));
      }
    }
  });

  it('preserves French accents in clues while grid uses normalized letters', () => {
    const result = startPracticeRoundState({
      roundId: 'display-fr',
      language: 'fr',
      uiLocale: 'fr',
    });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const grid = result.roundState.round.grids[0];
    for (const word of grid.placedWords) {
      const clue = getDisplayedClue({ ...word, maskType: 'none' });
      expect(clue).toBe(toDisplayUpperCase(word.text.trim()));
      expect(clue.length).toBeGreaterThan(0);

      for (let index = 0; index < word.cells.length; index++) {
        const cell = grid.cells[word.cells[index].row][word.cells[index].col];
        expect(cell.letter).toBe(toDisplayUpperCase(word.normalizedText[index]));
        expect(cell.letter).not.toMatch(/[àâäéèêëïîôùûü]/i);
      }
    }
  });

  it('preserves Spanish ñ in clues and grid cells when present', () => {
    // Direct unit test rather than round-generation integration: Spanish
    // currently reuses the English (ASCII-only) word lists per the design
    // brief, so a live-generated round has no ñ content to sample from.
    const word: PlacedWord = {
      id: 'w1',
      text: 'niño',
      normalizedText: 'niño',
      length: 4,
      direction: 'horizontal-right',
      start: { row: 0, col: 0 },
      end: { row: 0, col: 3 },
      cells: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 0, col: 3 },
      ],
      maskType: 'none',
      found: false,
      findOrder: null,
      colorIndex: null,
    };

    const clue = getDisplayedClue(word);
    expect(clue).toBe('NIÑO');
    expect(clue).not.toMatch(/NINO/);

    for (const normalizedChar of word.normalizedText) {
      if (normalizedChar === 'ñ') {
        expect(formatGridCellLetter(normalizedChar)).toBe('Ñ');
      }
    }
  });
});
