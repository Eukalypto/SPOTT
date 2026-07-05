import { GAME_CONFIG, type GridData, type PlacedWord } from '@spott/engine';

import { wordColorVar } from '../utils/word-colors.js';

export function buildGaugeHtml(grid: GridData): string {
  const filledNotches = getFilledGaugeNotches(grid);

  return Array.from({ length: GAME_CONFIG.wordsPerGrid }, (_, notchIndex) => {
    const word = filledNotches[notchIndex];
    if (!word || word.colorIndex === null) {
      return `<span class="gauge-notch" data-notch="${notchIndex}" aria-hidden="true"></span>`;
    }

    const color = wordColorVar(word.colorIndex);
    return `<span class="gauge-notch gauge-notch--filled" data-notch="${notchIndex}" style="--notch-color:${color};background:${color};border-color:${color}" aria-hidden="true"></span>`;
  }).join('');
}

export function renderGauge(container: HTMLElement, grid: GridData): void {
  const foundCount = grid.placedWords.filter((word) => word.found).length;
  container.innerHTML = buildGaugeHtml(grid);
  container.setAttribute(
    'aria-label',
    `${foundCount} of ${grid.placedWords.length} words found on this grid`,
  );
}

/** Maps each filled notch (left to right) to the word found at that find order on this grid. */
export function getFilledGaugeNotches(grid: GridData): Array<PlacedWord | undefined> {
  const slots: Array<PlacedWord | undefined> = Array.from(
    { length: GAME_CONFIG.wordsPerGrid },
    () => undefined,
  );

  const foundInOrder = grid.placedWords
    .filter(
      (word): word is PlacedWord & { findOrder: number; colorIndex: number } =>
        word.found && word.findOrder !== null && word.colorIndex !== null,
    )
    .sort((left, right) => left.findOrder - right.findOrder);

  for (let index = 0; index < foundInOrder.length && index < slots.length; index++) {
    slots[index] = foundInOrder[index];
  }

  return slots;
}
