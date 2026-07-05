import type { RoundState } from '@spott/engine';

import { escapeHtml } from '../utils/html.js';
import { getGridSummaries, getRoundStats } from '../utils/round-stats.js';
import { formatRemainingTime } from '../utils/round-timer.js';

export interface EndScreenOptions {
  roundState: RoundState;
  onReviewGrids: () => void;
  onStartAnotherRound: () => void;
}

export function renderEndScreen(container: HTMLElement, options: EndScreenOptions): void {
  const stats = getRoundStats(options.roundState);
  const gridSummaries = getGridSummaries(options.roundState);
  const statusLabel =
    options.roundState.round.status === 'completed' ? 'All grids complete!' : 'Time is up';

  container.innerHTML = `
    <section class="screen screen--end" aria-labelledby="end-title">
      <header class="end-header">
        <h2 id="end-title">Round over</h2>
        <p class="end-status">${escapeHtml(statusLabel)}</p>
      </header>

      <dl class="end-stats">
        <div class="end-stat">
          <dt>Final score</dt>
          <dd>${stats.finalScore}</dd>
        </div>
        <div class="end-stat">
          <dt>Words found</dt>
          <dd>${stats.wordsFound} / ${stats.totalWords}</dd>
        </div>
        <div class="end-stat">
          <dt>Grids completed</dt>
          <dd>${stats.gridsCompleted} / ${stats.totalGrids}</dd>
        </div>
        <div class="end-stat">
          <dt>Time remaining</dt>
          <dd>${formatRemainingTime(stats.remainingSeconds)}</dd>
        </div>
        <div class="end-stat">
          <dt>Time bonus</dt>
          <dd>${formatTimeBonus(stats.timeBonus)}</dd>
        </div>
      </dl>

      <section class="end-grid-summary" aria-labelledby="grid-summary-title">
        <h3 id="grid-summary-title" class="end-grid-summary__title">Grid summary</h3>
        <ul class="end-grid-summary__list">
          ${gridSummaries.map(buildGridSummaryItemHtml).join('')}
        </ul>
      </section>

      <div class="end-actions">
        <button type="button" class="primary-button" data-action="review">
          Review Grids
        </button>
        <button type="button" class="secondary-button" data-action="restart">
          Start New Round
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

function buildGridSummaryItemHtml(grid: ReturnType<typeof getGridSummaries>[number]): string {
  const statusClass = grid.completed ? 'end-grid-item--complete' : 'end-grid-item--incomplete';
  const statusLabel = grid.completed ? 'Complete' : 'Incomplete';

  return `
    <li class="end-grid-item ${statusClass}">
      <div class="end-grid-item__header">
        <span class="end-grid-item__number">Grid ${grid.gridNumber}</span>
        <span class="end-grid-item__status">${statusLabel}</span>
      </div>
      <p class="end-grid-item__theme">${escapeHtml(grid.themeLabel)}</p>
      <p class="end-grid-item__words">${grid.wordsFound} / ${grid.totalWords} words found</p>
    </li>
  `;
}
