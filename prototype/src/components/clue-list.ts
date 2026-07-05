import { getDisplayedClue, type GridData, type PlacedWord } from '@spott/engine';

import { revealWordText } from './grid-review.js';
import { escapeHtml } from '../utils/html.js';

export interface ClueListOptions {
  /** Dev-only visual aid: show full target words instead of masked clues. */
  revealWords?: boolean;
}

export function buildClueListHtml(grid: GridData, options: ClueListOptions = {}): string {
  const activeWords = grid.placedWords.filter((word) => !word.found);
  const foundWords = grid.placedWords.filter((word) => word.found);

  const activeSection =
    activeWords.length > 0
      ? activeWords.map((word) => buildClueItemHtml(word, options)).join('')
      : '<li class="clue-item clue-item--empty">All words found on this grid</li>';

  const foundSection = foundWords.map((word) => buildClueItemHtml(word, options)).join('');

  return `${activeSection}${foundSection}`;
}

export function renderClueList(
  container: HTMLElement,
  grid: GridData,
  options: ClueListOptions = {},
): void {
  container.innerHTML = buildClueListHtml(grid, options);
  container.dataset.activeCount = String(grid.placedWords.filter((word) => !word.found).length);
}

function getClueText(word: PlacedWord, options: ClueListOptions): string {
  if (word.found || !options.revealWords) {
    return getDisplayedClue(word);
  }

  return revealWordText(word);
}

function buildClueItemHtml(word: PlacedWord, options: ClueListOptions): string {
  const clue = getClueText(word, options);
  const foundClass = word.found ? ' clue-item--found' : '';
  const revealedClass = options.revealWords && !word.found ? ' clue-item--revealed' : '';
  const colorIndex = word.colorIndex ?? null;
  const colorStyle =
    word.found && colorIndex !== null
      ? ` style="--clue-accent: var(--word-color-${colorIndex}); border-left-color: var(--word-color-${colorIndex})"`
      : '';
  const statusLabel = word.found ? 'Found' : options.revealWords ? 'Revealed' : 'Clue';
  const ariaLabel = word.found ? `${clue}, found` : clue;

  return `
    <li
      class="clue-item${foundClass}${revealedClass}"
      data-word-id="${escapeHtml(word.id)}"
      aria-label="${escapeHtml(ariaLabel)}"
      ${colorStyle}
    >
      <span class="clue-item__label">${statusLabel}</span>
      <span class="clue-item__text${word.found ? ' clue-item__text--found' : ''}">${formatClueDisplayHtml(clue)}</span>
    </li>
  `;
}

/**
 * Render clue text from {@link getDisplayedClue}, styling `#` mask chars separately
 * so visible letters (including ñ and accents) display correctly.
 */
export function formatClueDisplayHtml(clue: string): string {
  return [...clue]
    .map((character) => {
      if (character === '#') {
        return '<span class="clue-mask" aria-hidden="true">#</span>';
      }
      return `<span class="clue-letter">${escapeHtml(character)}</span>`;
    })
    .join('');
}
