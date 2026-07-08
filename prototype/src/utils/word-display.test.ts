import { getDisplayedClue, toDisplayUpperCase } from '@spott/engine';
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
    const result = startPracticeRoundState({
      roundId: 'display-es',
      language: 'es',
      uiLocale: 'es',
    });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    const wordsWithEnye = result.roundState.round.grids.flatMap((grid) =>
      grid.placedWords.filter((word) => word.normalizedText.includes('ñ')),
    );

    expect(wordsWithEnye.length).toBeGreaterThan(0);

    for (const word of wordsWithEnye) {
      const clue = getDisplayedClue({ ...word, maskType: 'none' });
      expect(clue).toContain('Ñ');
      expect(clue).not.toMatch(/NINO|MANANA/);

      const grid = result.roundState.round.grids.find((entry) =>
        entry.placedWords.some((entryWord) => entryWord.id === word.id),
      )!;
      for (let index = 0; index < word.cells.length; index++) {
        const normalizedChar = word.normalizedText[index];
        const cell = grid.cells[word.cells[index].row][word.cells[index].col];
        if (normalizedChar === 'ñ') {
          expect(cell.letter).toBe('Ñ');
        }
      }
    }
  });
});
