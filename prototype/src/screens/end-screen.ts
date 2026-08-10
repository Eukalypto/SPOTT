import type { RoundState } from '@spott/engine';

import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { getOptimalScore, getRoundStats, shouldShowTimeBonus } from '../utils/round-stats.js';

export type EndScreenGameMode = 'solo' | 'challenge';

export interface EndScreenOptions {
  roundState: RoundState;
  locale: UiLocale;
  /** Defaults to 'solo'; challenge mode is not yet playable. */
  gameMode?: EndScreenGameMode;
  onReviewGrids: () => void;
  onStartAnotherRound: () => void;
  onBackToStart: () => void;
}

/** One of the three Finished Game Status cases: interrupted, time out, or grids completed (+ bonus). */
function getFinishedStatusText(options: EndScreenOptions): string {
  const { roundState, locale } = options;

  if (roundState.round.status === 'interrupted') {
    return t('statusGameInterrupted', locale);
  }

  if (roundState.round.status === 'expired') {
    return t('timeIsUp', locale);
  }

  if (shouldShowTimeBonus(roundState)) {
    const stats = getRoundStats(roundState);
    return tFormat('statusGridsCompletedWithBonus', locale, {
      seconds: stats.remainingSeconds,
      bonus: stats.timeBonus,
    });
  }

  return t('statusGridsCompleted', locale);
}

export function buildEndScreenHtml(options: EndScreenOptions): string {
  const { locale } = options;
  const stats = getRoundStats(options.roundState);
  const gameMode = options.gameMode ?? 'solo';
  const playAgainLabel =
    gameMode === 'challenge' ? t('challengeSameOpponent', locale) : t('playSoloAgain', locale);

  return `
    <section class="screen screen--end" aria-labelledby="end-status-title">
      <header class="end-status-block">
        <h2 id="end-status-title" class="end-status-block__title">${escapeHtml(t('finishedGameStatus', locale))}</h2>
        <p class="end-status-block__value">${escapeHtml(getFinishedStatusText(options))}</p>
      </header>

      <section class="end-score-block" aria-labelledby="end-score-title">
        <h2 id="end-score-title" class="end-score-block__title">${escapeHtml(t('finalScore', locale))}</h2>
        <p class="end-score-block__value">${stats.finalScore}</p>
      </section>

      <div class="end-actions-row">
        <button type="button" class="secondary-button end-actions-row__button" data-action="review">
          ${escapeHtml(t('reviewGrids', locale))}
        </button>
        <button type="button" class="primary-button end-actions-row__button" data-action="restart">
          ${escapeHtml(playAgainLabel)}
        </button>
      </div>

      <section class="end-stats-placeholder" aria-labelledby="end-stats-placeholder-title">
        <h3 id="end-stats-placeholder-title" class="end-stats-placeholder__title">
          ${escapeHtml(t('playerStatistics', locale))}
        </h3>
        <dl class="profile-stats__list">
          <div class="profile-stats__row">
            <dt>${escapeHtml(t('statsWordsFoundOfTotal', locale))}</dt>
            <dd>${stats.wordsFound}/${stats.totalWords}</dd>
          </div>
          <div class="profile-stats__row">
            <dt>${escapeHtml(t('statsOptimalScore', locale))}</dt>
            <dd>${getOptimalScore(options.roundState)}</dd>
          </div>
        </dl>
      </section>

      <button type="button" class="primary-button end-home-button" data-action="back-to-start">
        ${escapeHtml(t('home', locale))}
      </button>
    </section>
  `;
}

export function renderEndScreen(container: HTMLElement, options: EndScreenOptions): void {
  container.innerHTML = buildEndScreenHtml(options);

  container.querySelector<HTMLButtonElement>('[data-action="review"]')?.addEventListener(
    'click',
    options.onReviewGrids,
  );
  container.querySelector<HTMLButtonElement>('[data-action="restart"]')?.addEventListener(
    'click',
    options.onStartAnotherRound,
  );
  container.querySelector<HTMLButtonElement>('[data-action="back-to-start"]')?.addEventListener(
    'click',
    options.onBackToStart,
  );
}
