import type { GridData, PlacedWord } from '@spott/engine';
import { toDisplayUpperCase } from '@spott/engine';

import { escapeHtml } from './html.js';
import { getCellTileUrl, getLetterTileUrl } from './tile-assets.js';
import { getWordHighlightColor, WORDS_PER_GRID } from './word-colors.js';

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** Format a grid cell letter for display (normalized engine letter, uppercased). */
export function formatGridCellLetter(letter: string): string {
  return toDisplayUpperCase(letter);
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

/** Renders a grid cell's letter as tile art when available, falling back to plain text (e.g. Ñ). */
export function buildGridCellContentHtml(letter: string): string {
  const letterUrl = getLetterTileUrl(letter);

  return letterUrl
    ? `<img class="grid-cell__letter" src="${escapeHtml(letterUrl)}" alt="${escapeHtml(letter)}" />`
    : escapeHtml(letter);
}

export function buildLetterGridHtml(grid: GridData): string {
  const foundColors = getFoundCellColorIndexes(grid);

  return grid.cells
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, colIndex) => {
          const colorIndex = foundColors.get(cellKey(rowIndex, colIndex));
          const foundClass = colorIndex !== undefined ? ' grid-cell--found' : '';
          const tileUrl = getCellTileUrl(colorIndex);
          const letter = formatGridCellLetter(cell.letter);
          return `<span class="grid-cell${foundClass}" data-row="${rowIndex}" data-col="${colIndex}" style="--cell-tile-url:url('${escapeHtml(tileUrl)}')">${buildGridCellContentHtml(letter)}</span>`;
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
