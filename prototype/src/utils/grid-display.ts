import type { GridData, PlacedWord } from '@spott/engine';

import { escapeHtml } from './html.js';
import { getWordHighlightColor, wordColorVar, WORDS_PER_GRID } from './word-colors.js';

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** Color index per cell for found target words on the current grid. */
export function getFoundCellColorIndexes(grid: GridData): Map<string, number> {
  const colors = new Map<string, number>();

  for (const word of grid.placedWords) {
    if (!word.found || word.colorIndex === null) {
      continue;
    }

    for (const cell of word.cells) {
      colors.set(cellKey(cell.row, cell.col), word.colorIndex);
    }
  }

  return colors;
}

export function buildLetterGridHtml(grid: GridData): string {
  const foundColors = getFoundCellColorIndexes(grid);

  return grid.cells
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, colIndex) => {
          const colorIndex = foundColors.get(cellKey(rowIndex, colIndex));
          const foundClass = colorIndex !== undefined ? ' grid-cell--found' : '';
          const style =
            colorIndex !== undefined
              ? ` style="--cell-color:${wordColorVar(colorIndex)}"`
              : '';
          return `<span class="grid-cell${foundClass}" data-row="${rowIndex}" data-col="${colIndex}"${style}>${escapeHtml(cell.letter)}</span>`;
        })
        .join('');
      return `<div class="grid-row">${cells}</div>`;
    })
    .join('');
}

export function getReviewWordColor(word: PlacedWord, wordIndex: number): string {
  if (word.found && word.colorIndex !== null) {
    return getWordHighlightColor(word.colorIndex);
  }

  return getWordHighlightColor(wordIndex % WORDS_PER_GRID);
}
