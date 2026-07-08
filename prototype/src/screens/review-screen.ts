import { GAME_CONFIG, type RoundState } from '@spott/engine';

import {
  buildReviewClueListHtml,
  buildReviewLetterGridHtml,
} from '../components/grid-review.js';
import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { injectWordColorVars } from '../utils/word-colors.js';

export interface ReviewScreenOptions {
  roundState: RoundState;
  reviewGridIndex: number;
  locale: UiLocale;
  onChangeGrid: (index: number) => void;
  onClose: () => void;
}

export function buildReviewScreenHtml(options: ReviewScreenOptions): string {
  const { roundState, reviewGridIndex, locale } = options;
  const grid = roundState.round.grids[reviewGridIndex];
  const gridNumber = reviewGridIndex + 1;
  const hasPrevious = reviewGridIndex > 0;
  const hasNext = reviewGridIndex < roundState.round.grids.length - 1;

  return `
    <section class="screen screen--review" aria-labelledby="review-title">
      <header class="review-header">
        <div class="review-header__titles">
          <h2 id="review-title">${escapeHtml(t('gridReview', locale))}</h2>
          <p class="review-header__hint">${escapeHtml(t('reviewReadOnlyHint', locale))}</p>
        </div>
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
        <p class="review-grid-label" aria-live="polite">
          ${escapeHtml(tFormat('gridWordsFoundSummary', locale, {
            found: grid.placedWords.filter((word) => word.found).length,
            total: grid.placedWords.length,
          }))}
          · ${escapeHtml(t('grid', locale))} ${gridNumber}/${GAME_CONFIG.gridsPerRound} · ${escapeHtml(grid.themeLabel)}
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
        aria-readonly="true"
      >
        ${buildReviewLetterGridHtml(grid, locale)}
      </div>

      <section class="review-words" aria-labelledby="review-words-title">
        <h3 id="review-words-title" class="review-words__title">${escapeHtml(t('reviewAllWords', locale))}</h3>
        <ul class="review-clue-list" aria-label="${escapeHtml(t('reviewAllWords', locale))}">
          ${buildReviewClueListHtml(grid, locale)}
        </ul>
      </section>
    </section>
  `;
}

export function renderReviewScreen(container: HTMLElement, options: ReviewScreenOptions): void {
  injectWordColorVars(container);
  container.innerHTML = buildReviewScreenHtml(options);

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

  const { reviewGridIndex } = options;
  const hasPrevious = reviewGridIndex > 0;
  const hasNext = reviewGridIndex < options.roundState.round.grids.length - 1;

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
      const selected = index === reviewGridIndex;
      const selectedClass = selected ? ' review-tab--active' : '';
      const completed = entry.placedWords.every((word) => word.found)
        ? ' review-tab--complete'
        : '';
      const missed = entry.placedWords.some((word) => !word.found)
        ? ' review-tab--has-missed'
        : '';
      const ariaCurrent = selected ? ' aria-current="page"' : '';
      const missedCount = entry.placedWords.filter((word) => !word.found).length;
      const ariaLabel = buildReviewTabAriaLabel(index, {
        selected,
        completed: missedCount === 0,
        missedCount,
        locale,
      });

      return `<button type="button" class="review-tab${selectedClass}${completed}${missed}" data-grid-index="${index}" aria-label="${escapeHtml(ariaLabel)}"${ariaCurrent}>${index + 1}</button>`;
    })
    .join('');
}

function buildReviewTabAriaLabel(
  index: number,
  options: {
    selected: boolean;
    completed: boolean;
    missedCount: number;
    locale: UiLocale;
  },
): string {
  const parts = [`${t('grid', options.locale)} ${index + 1}`];

  if (options.selected) {
    parts.push(t('reviewTabSelected', options.locale));
  }

  if (options.completed) {
    parts.push(t('complete', options.locale));
  } else if (options.missedCount > 0) {
    parts.push(tFormat('reviewTabWordsMissed', options.locale, { count: options.missedCount }));
  } else {
    parts.push(t('incomplete', options.locale));
  }

  return parts.join(', ');
}
