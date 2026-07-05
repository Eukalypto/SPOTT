import { GAME_CONFIG, type RoundState } from '@spott/engine';

import {
  buildReviewClueListHtml,
  buildReviewLetterGridHtml,
} from '../components/grid-review.js';
import { escapeHtml } from '../utils/html.js';
import { injectWordColorVars } from '../utils/word-colors.js';

export interface ReviewScreenOptions {
  roundState: RoundState;
  reviewGridIndex: number;
  onChangeGrid: (index: number) => void;
  onClose: () => void;
}

export function renderReviewScreen(container: HTMLElement, options: ReviewScreenOptions): void {
  injectWordColorVars(container);

  const { roundState, reviewGridIndex } = options;
  const grid = roundState.round.grids[reviewGridIndex];
  const gridNumber = reviewGridIndex + 1;
  const hasPrevious = reviewGridIndex > 0;
  const hasNext = reviewGridIndex < roundState.round.grids.length - 1;

  container.innerHTML = `
    <section class="screen screen--review" aria-labelledby="review-title">
      <header class="review-header">
        <h2 id="review-title">Grid review</h2>
        <button type="button" class="text-button" data-action="close">Back to results</button>
      </header>

      <nav class="review-tabs" aria-label="Grids">
        ${buildGridTabsHtml(roundState, reviewGridIndex)}
      </nav>

      <div class="review-grid-nav">
        <button
          type="button"
          class="review-nav-button"
          data-action="prev"
          ${hasPrevious ? '' : 'disabled'}
          aria-label="Previous grid"
        >
          ← Prev
        </button>
        <p class="review-grid-label">
          Grid ${gridNumber}/${GAME_CONFIG.gridsPerRound} · ${escapeHtml(grid.themeLabel)}
        </p>
        <button
          type="button"
          class="review-nav-button"
          data-action="next"
          ${hasNext ? '' : 'disabled'}
          aria-label="Next grid"
        >
          Next →
        </button>
      </div>

      <div
        class="letter-grid letter-grid--review"
        role="grid"
        aria-label="Review grid ${gridNumber}, read only"
      >
        ${buildReviewLetterGridHtml(grid)}
      </div>

      <ul class="review-clue-list" aria-label="Words on this grid">
        ${buildReviewClueListHtml(grid)}
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

  container.querySelector<HTMLButtonElement>('[data-action="prev"]')?.addEventListener(
    'click',
    () => {
      if (hasPrevious) {
        options.onChangeGrid(reviewGridIndex - 1);
      }
    },
  );

  container.querySelector<HTMLButtonElement>('[data-action="next"]')?.addEventListener(
    'click',
    () => {
      if (hasNext) {
        options.onChangeGrid(reviewGridIndex + 1);
      }
    },
  );
}

function buildGridTabsHtml(roundState: RoundState, reviewGridIndex: number): string {
  return roundState.round.grids
    .map((entry, index) => {
      const selected = index === reviewGridIndex ? ' review-tab--active' : '';
      const completed = entry.placedWords.every((word) => word.found)
        ? ' review-tab--complete'
        : '';
      const missed = entry.placedWords.some((word) => !word.found)
        ? ' review-tab--has-missed'
        : '';
      return `<button type="button" class="review-tab${selected}${completed}${missed}" data-grid-index="${index}" aria-label="Review grid ${index + 1}">${index + 1}</button>`;
    })
    .join('');
}
