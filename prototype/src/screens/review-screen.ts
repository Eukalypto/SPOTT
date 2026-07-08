import { GAME_CONFIG, type RoundState } from '@spott/engine';

import {
  buildReviewClueListHtml,
  buildReviewLetterGridHtml,
} from '../components/grid-review.js';
import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { injectWordColorVars } from '../utils/word-colors.js';

export interface ReviewScreenOptions {
  roundState: RoundState;
  reviewGridIndex: number;
  locale: UiLocale;
  onChangeGrid: (index: number) => void;
  onClose: () => void;
}

export function renderReviewScreen(container: HTMLElement, options: ReviewScreenOptions): void {
  injectWordColorVars(container);

  const { roundState, reviewGridIndex, locale } = options;
  const grid = roundState.round.grids[reviewGridIndex];
  const gridNumber = reviewGridIndex + 1;
  const hasPrevious = reviewGridIndex > 0;
  const hasNext = reviewGridIndex < roundState.round.grids.length - 1;

  container.innerHTML = `
    <section class="screen screen--review" aria-labelledby="review-title">
      <header class="review-header">
        <h2 id="review-title">${escapeHtml(t('gridReview', locale))}</h2>
        <button type="button" class="text-button" data-action="close">${escapeHtml(t('backToResults', locale))}</button>
      </header>

      <nav class="review-tabs" aria-label="${escapeHtml(t('grid', locale))}">
        ${buildGridTabsHtml(roundState, reviewGridIndex, locale)}
      </nav>

      <div class="review-grid-nav">
        <button
          type="button"
          class="review-nav-button"
          data-action="prev"
          ${hasPrevious ? '' : 'disabled'}
          aria-label="${escapeHtml(t('previousGrid', locale))}"
        >
          ← ${escapeHtml(t('previousGrid', locale))}
        </button>
        <p class="review-grid-label">
          ${escapeHtml(t('grid', locale))} ${gridNumber}/${GAME_CONFIG.gridsPerRound} · ${escapeHtml(grid.themeLabel)}
        </p>
        <button
          type="button"
          class="review-nav-button"
          data-action="next"
          ${hasNext ? '' : 'disabled'}
          aria-label="${escapeHtml(t('nextGrid', locale))}"
        >
          ${escapeHtml(t('nextGrid', locale))} →
        </button>
      </div>

      <div
        class="letter-grid letter-grid--review"
        role="grid"
        aria-label="${escapeHtml(`${t('gridReview', locale)} ${gridNumber}`)}"
      >
        ${buildReviewLetterGridHtml(grid)}
      </div>

      <ul class="review-clue-list" aria-label="${escapeHtml(t('wordsFound', locale))}">
        ${buildReviewClueListHtml(grid, locale)}
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

function buildGridTabsHtml(
  roundState: RoundState,
  reviewGridIndex: number,
  locale: UiLocale,
): string {
  return roundState.round.grids
    .map((entry, index) => {
      const selected = index === reviewGridIndex ? ' review-tab--active' : '';
      const completed = entry.placedWords.every((word) => word.found)
        ? ' review-tab--complete'
        : '';
      const missed = entry.placedWords.some((word) => !word.found)
        ? ' review-tab--has-missed'
        : '';
      return `<button type="button" class="review-tab${selected}${completed}${missed}" data-grid-index="${index}" aria-label="${escapeHtml(`${t('gridReview', locale)} ${index + 1}`)}">${index + 1}</button>`;
    })
    .join('');
}
