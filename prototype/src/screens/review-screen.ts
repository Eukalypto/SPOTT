import { GAME_CONFIG, type RoundState } from '@spott/engine';

import { getReviewCellColors, getReviewWordColor } from '../utils/grid-display.js';
import { escapeHtml } from '../utils/html.js';

export interface ReviewScreenOptions {
  roundState: RoundState;
  reviewGridIndex: number;
  onChangeGrid: (index: number) => void;
  onClose: () => void;
}

export function renderReviewScreen(container: HTMLElement, options: ReviewScreenOptions): void {
  const { roundState, reviewGridIndex } = options;
  const grid = roundState.round.grids[reviewGridIndex];
  const cellColors = getReviewCellColors(grid);
  const gridNumber = reviewGridIndex + 1;

  const gridTabs = roundState.round.grids
    .map((entry, index) => {
      const selected = index === reviewGridIndex ? ' review-tab--active' : '';
      const completed = entry.placedWords.every((word) => word.found)
        ? ' review-tab--complete'
        : '';
      return `<button type="button" class="review-tab${selected}${completed}" data-grid-index="${index}">${index + 1}</button>`;
    })
    .join('');

  const gridRows = grid.cells
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, colIndex) => {
          const highlight = cellColors.get(`${rowIndex},${colIndex}`);
          const style = highlight ? ` style="background:${escapeHtml(highlight.color)}"` : '';
          return `<span class="grid-cell grid-cell--review"${style}>${escapeHtml(cell.letter)}</span>`;
        })
        .join('');
      return `<div class="grid-row">${cells}</div>`;
    })
    .join('');

  const clueItems = grid.placedWords
    .map((word, wordIndex) => {
      const color = getReviewWordColor(word, wordIndex);
      const status = word.found ? 'found' : 'missed';
      const statusLabel = word.found ? 'Found' : 'Missed';
      return `
        <li class="review-clue review-clue--${status}" style="border-left-color:${escapeHtml(color)}">
          <span class="review-clue__word">${escapeHtml(word.text.toUpperCase())}</span>
          <span class="review-clue__status">${statusLabel}</span>
        </li>
      `;
    })
    .join('');

  container.innerHTML = `
    <section class="screen screen--review" aria-labelledby="review-title">
      <header class="review-header">
        <h2 id="review-title">Grid review</h2>
        <button type="button" class="text-button" data-action="close">Back to results</button>
      </header>

      <nav class="review-tabs" aria-label="Grids">
        ${gridTabs}
      </nav>

      <p class="game-theme">Grid ${gridNumber}/${GAME_CONFIG.gridsPerRound} · ${escapeHtml(grid.themeLabel)}</p>

      <div class="letter-grid letter-grid--review" role="grid" aria-label="Review grid ${gridNumber}">
        ${gridRows}
      </div>

      <ul class="review-clue-list" aria-label="Words on this grid">
        ${clueItems}
      </ul>
    </section>
  `;

  container.querySelector<HTMLButtonElement>('[data-action="close"]')?.addEventListener(
    'click',
    options.onClose,
  );

  container.querySelectorAll<HTMLButtonElement>('[data-grid-index]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.gridIndex);
      if (!Number.isNaN(index)) {
        options.onChangeGrid(index);
      }
    });
  });
}
