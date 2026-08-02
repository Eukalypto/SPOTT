import { getDisplayedClue, type GridData, type PlacedWord } from '@spott/engine';

import { getWordHighlightColor } from '../utils/word-colors.js';
import { revealWordText } from './grid-review.js';
import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export interface ClueListOptions {
  locale?: UiLocale;
  /** Dev-only visual aid: show full target words instead of masked clues. */
  revealWords?: boolean;
}

/**
 * Renders clues in their fixed placedWords order — a word stays put and grays
 * out in place when found, it never jumps to the end of the list.
 */
export function buildClueListHtml(grid: GridData, options: ClueListOptions = {}): string {
  const locale = options.locale ?? 'en';

  return grid.placedWords.map((word) => buildClueItemHtml(word, options, locale)).join('');
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

function buildClueItemHtml(word: PlacedWord, options: ClueListOptions, locale: UiLocale): string {
  const clue = getClueText(word, options);
  const foundClass = word.found ? ' clue-item--found' : '';
  const revealedClass = options.revealWords && !word.found ? ' clue-item--revealed' : '';
  const colorIndex = word.colorIndex ?? null;
  const accentColor = colorIndex !== null ? getWordHighlightColor(colorIndex) : null;
  const colorStyle =
    word.found && accentColor !== null
      ? ` style="--clue-accent: ${accentColor}; border-left-color: ${accentColor}"`
      : '';
  const statusLabel = word.found
    ? t('found', locale)
    : options.revealWords
      ? t('revealed', locale)
      : t('clue', locale);
  const ariaLabel = word.found ? `${clue}, ${t('found', locale).toLowerCase()}` : clue;

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
