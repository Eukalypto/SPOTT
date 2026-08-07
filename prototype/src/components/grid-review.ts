import type { GridData, PlacedWord } from '@spott/engine';
import { getDisplayedClue, toDisplayUpperCase } from '@spott/engine';

import { t, type UiLocale } from '../i18n/index.js';
import {
  buildGridCellContentHtml,
  cellKey,
  formatGridCellLetter,
} from '../utils/grid-display.js';
import { escapeHtml } from '../utils/html.js';
import { getCellTileUrl } from '../utils/tile-assets.js';

export interface ReviewWordEntry {
  word: PlacedWord;
  wordIndex: number;
  /** Full word when found; the word's original mask (per A2h) when missed. */
  displayText: string;
  found: boolean;
}

export function getReviewWordEntries(grid: GridData): ReviewWordEntry[] {
  return grid.placedWords.map((word, wordIndex) => ({
    word,
    wordIndex,
    displayText: getDisplayedClue(word),
    found: word.found,
  }));
}

/** Review mode always shows the full original word, never masked clues. */
export function revealWordText(word: PlacedWord): string {
  return toDisplayUpperCase(word.text.trim());
}

export function buildReviewLetterGridHtml(grid: GridData, locale: UiLocale = 'en'): string {
  const entries = getReviewWordEntries(grid);
  const cellMeta = new Map<
    string,
    { colorIndex: number | null; found: boolean }
  >();

  entries.forEach((entry) => {
    // Only found words carry a real colorIndex (their find-order color); unfound
    // words get the neutral default tile — a fallback based on array position
    // could collide with an actual found word's colorIndex (fb#12).
    const colorIndex = entry.word.found ? entry.word.colorIndex : null;

    for (const cell of entry.word.cells) {
      cellMeta.set(cellKey(cell.row, cell.col), {
        colorIndex,
        found: entry.found,
      });
    }
  });

  return grid.cells
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, colIndex) => {
          const letter = formatGridCellLetter(cell.letter);
          const meta = cellMeta.get(cellKey(rowIndex, colIndex));
          if (!meta) {
            return `<span class="grid-cell grid-cell--review" style="--cell-tile-url:url('${escapeHtml(getCellTileUrl(null))}')">${buildGridCellContentHtml(letter)}</span>`;
          }

          const stateClass = meta.found
            ? ' grid-cell--review-found'
            : ' grid-cell--review-missed';
          const tileUrl = getCellTileUrl(meta.colorIndex);
          const missedLabel = meta.found ? '' : ` aria-label="${escapeHtml(t('missed', locale))}"`;
          return `<span class="grid-cell grid-cell--review${stateClass}" style="--cell-tile-url:url('${escapeHtml(tileUrl)}')"${missedLabel}>${buildGridCellContentHtml(letter)}</span>`;
        })
        .join('');
      return `<div class="grid-row">${cells}</div>`;
    })
    .join('');
}
