import type { GridData, PlacedWord } from '@spott/engine';
import { getDisplayedClue, toDisplayUpperCase } from '@spott/engine';

import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { cellKey, formatGridCellLetter, getReviewWordColor } from '../utils/grid-display.js';
import { escapeHtml, formatClueDisplayHtml } from '../utils/html.js';
import { getWordHighlightColor, getWordHighlightTextColor, WORDS_PER_GRID } from '../utils/word-colors.js';

export interface ReviewWordEntry {
  word: PlacedWord;
  wordIndex: number;
  /** Full word when found; the word's original mask (per A2h) when missed. */
  displayText: string;
  color: string;
  found: boolean;
}

export function getReviewWordEntries(grid: GridData): ReviewWordEntry[] {
  return grid.placedWords.map((word, wordIndex) => ({
    word,
    wordIndex,
    displayText: getDisplayedClue(word),
    color: getReviewWordColor(word, wordIndex),
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
    { colorIndex: number; found: boolean }
  >();

  entries.forEach((entry) => {
    const colorIndex = entry.word.found && entry.word.colorIndex !== null
      ? entry.word.colorIndex
      : entry.wordIndex % WORDS_PER_GRID;

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
          const meta = cellMeta.get(cellKey(rowIndex, colIndex));
          if (!meta) {
            return `<span class="grid-cell grid-cell--review">${escapeHtml(formatGridCellLetter(cell.letter))}</span>`;
          }

          const stateClass = meta.found
            ? ' grid-cell--review-found'
            : ' grid-cell--review-missed';
          const color = getWordHighlightColor(meta.colorIndex);
          const textColor = getWordHighlightTextColor(meta.colorIndex);
          const missedLabel = meta.found ? '' : ` aria-label="${escapeHtml(t('missed', locale))}"`;
          return `<span class="grid-cell grid-cell--review${stateClass}" style="background-color:${color};color:${textColor}"${missedLabel}>${escapeHtml(formatGridCellLetter(cell.letter))}</span>`;
        })
        .join('');
      return `<div class="grid-row">${cells}</div>`;
    })
    .join('');
}

/** Renders review clues in their fixed placedWords order, matching the live grid's list position. */
export function buildReviewClueListHtml(grid: GridData, locale: UiLocale = 'en'): string {
  return getReviewWordEntries(grid)
    .map((entry) => buildReviewClueItemHtml(entry, locale))
    .join('');
}

function buildReviewClueItemHtml(entry: ReviewWordEntry, locale: UiLocale): string {
  const status = entry.found ? 'found' : 'missed';
  const statusLabel = entry.found ? t('found', locale) : t('missed', locale);
  const wordClass = entry.found ? ' review-clue__word--found' : ' review-clue__word--missed';
  const borderColor = entry.found ? entry.color : 'var(--danger)';

  return `
    <li
      class="review-clue review-clue--${status}"
      data-word-id="${escapeHtml(entry.word.id)}"
      style="border-left-color:${escapeHtml(borderColor)}"
      aria-label="${escapeHtml(tFormat('reviewWordStatusAria', locale, { word: entry.displayText, status: statusLabel }))}"
    >
      <span class="review-clue__word${wordClass}">${formatClueDisplayHtml(entry.displayText)}</span>
      <span class="review-clue__status">${statusLabel}</span>
    </li>
  `;
}
