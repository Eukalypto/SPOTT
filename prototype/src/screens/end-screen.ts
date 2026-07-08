import type { RoundState } from '@spott/engine';

import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { getGridSummaries, getRoundStats } from '../utils/round-stats.js';
import { formatRemainingTime } from '../utils/round-timer.js';

export interface EndScreenOptions {
  roundState: RoundState;
  locale: UiLocale;
  onReviewGrids: () => void;
  onStartAnotherRound: () => void;
}

export function renderEndScreen(container: HTMLElement, options: EndScreenOptions): void {
  const stats = getRoundStats(options.roundState);
  const gridSummaries = getGridSummaries(options.roundState);
  const statusLabel =
    options.roundState.round.status === 'completed'
      ? t('allGridsComplete', options.locale)
      : t('timeIsUp', options.locale);

  container.innerHTML = `
    <section class="screen screen--end" aria-labelledby="end-title">
      <header class="end-header">
        <h2 id="end-title">${escapeHtml(t('roundOver', options.locale))}</h2>
        <p class="end-status">${escapeHtml(statusLabel)}</p>
      </header>

      <dl class="end-stats">
        <div class="end-stat">
          <dt>${escapeHtml(t('finalScore', options.locale))}</dt>
          <dd>${stats.finalScore}</dd>
        </div>
        <div class="end-stat">
          <dt>${escapeHtml(t('wordsFound', options.locale))}</dt>
          <dd>${stats.wordsFound} / ${stats.totalWords}</dd>
        </div>
        <div class="end-stat">
          <dt>${escapeHtml(t('gridsCompleted', options.locale))}</dt>
          <dd>${stats.gridsCompleted} / ${stats.totalGrids}</dd>
        </div>
        <div class="end-stat">
          <dt>${escapeHtml(t('timeRemaining', options.locale))}</dt>
          <dd>${formatRemainingTime(stats.remainingSeconds)}</dd>
        </div>
        <div class="end-stat">
          <dt>${escapeHtml(t('timeBonus', options.locale))}</dt>
          <dd>${formatTimeBonus(stats.timeBonus)}</dd>
        </div>
      </dl>

      <section class="end-grid-summary" aria-labelledby="grid-summary-title">
        <h3 id="grid-summary-title" class="end-grid-summary__title">${escapeHtml(t('gridSummary', options.locale))}</h3>
        <ul class="end-grid-summary__list">
          ${gridSummaries.map((grid) => buildGridSummaryItemHtml(grid, options.locale)).join('')}
        </ul>
      </section>

      <div class="end-actions">
        <button type="button" class="primary-button" data-action="review">
          ${escapeHtml(t('reviewGrids', options.locale))}
        </button>
        <button type="button" class="secondary-button" data-action="restart">
          ${escapeHtml(t('startNewRound', options.locale))}
        </button>
      </div>
    </section>
  `;

  container.querySelector<HTMLButtonElement>('[data-action="review"]')?.addEventListener(
    'click',
    options.onReviewGrids,
  );
  container.querySelector<HTMLButtonElement>('[data-action="restart"]')?.addEventListener(
    'click',
    options.onStartAnotherRound,
  );
}

function formatTimeBonus(timeBonus: number): string {
  if (timeBonus > 0) {
    return `+${timeBonus}`;
  }
  return '—';
}

function buildGridSummaryItemHtml(
  grid: ReturnType<typeof getGridSummaries>[number],
  locale: UiLocale,
): string {
  const statusClass = grid.completed ? 'end-grid-item--complete' : 'end-grid-item--incomplete';
  const statusLabel = grid.completed ? t('complete', locale) : t('incomplete', locale);

  return `
    <li class="end-grid-item ${statusClass}">
      <div class="end-grid-item__header">
        <span class="end-grid-item__number">${escapeHtml(t('grid', locale))} ${grid.gridNumber}</span>
        <span class="end-grid-item__status">${escapeHtml(statusLabel)}</span>
      </div>
      <p class="end-grid-item__theme">${escapeHtml(grid.themeLabel)}</p>
      <p class="end-grid-item__words">${escapeHtml(tFormat('gridWordsFoundSummary', locale, { found: grid.wordsFound, total: grid.totalWords }))}</p>
    </li>
  `;
}
