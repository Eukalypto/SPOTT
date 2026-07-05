import { getDisplayedClue, type GridData, type PlacedWord } from '@spott/engine';

import { escapeHtml } from '../utils/html.js';

export function buildClueListHtml(grid: GridData): string {
  const activeWords = grid.placedWords.filter((word) => !word.found);
  const foundWords = grid.placedWords.filter((word) => word.found);

  const activeSection =
    activeWords.length > 0
      ? activeWords.map((word) => buildClueItemHtml(word)).join('')
      : '<li class="clue-item clue-item--empty">All words found on this grid</li>';

  const foundSection = foundWords.map((word) => buildClueItemHtml(word)).join('');

  return `${activeSection}${foundSection}`;
}

export function renderClueList(container: HTMLElement, grid: GridData): void {
  container.innerHTML = buildClueListHtml(grid);
  container.dataset.activeCount = String(grid.placedWords.filter((word) => !word.found).length);
}

function buildClueItemHtml(word: PlacedWord): string {
  const clue = getDisplayedClue(word);
  const foundClass = word.found ? ' clue-item--found' : '';
  const colorIndex = word.colorIndex ?? null;
  const colorStyle =
    word.found && colorIndex !== null
      ? ` style="--clue-accent: var(--word-color-${colorIndex}); border-left-color: var(--word-color-${colorIndex})"`
      : '';
  const statusLabel = word.found ? 'Found' : 'Clue';
  const ariaLabel = word.found ? `${clue}, found` : clue;

  return `
    <li
      class="clue-item${foundClass}"
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
