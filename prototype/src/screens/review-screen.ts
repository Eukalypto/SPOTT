import type { RoundState } from '@spott/engine';

import { buildClueListHtml } from '../components/clue-list.js';
import { buildGaugeHtml, getGaugeSummaryText } from '../components/word-gauge.js';
import { buildReviewLetterGridHtml, getUnfoundWordColors } from '../components/grid-review.js';
import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { GENERIC_AVATAR_ICON } from '../utils/avatar-assets.js';
import { escapeHtml } from '../utils/html.js';
import { getRoundStats } from '../utils/round-stats.js';
import { injectWordColorVars } from '../utils/word-colors.js';

export interface ReviewScreenOptions {
  roundState: RoundState;
  reviewGridIndex: number;
  locale: UiLocale;
  /** Display name shown next to the avatar; pass the guest label for guest sessions. */
  playerName: string;
  /** Chosen avatar image url; falls back to a generic icon for guests or unset avatars. */
  playerAvatarUrl?: string;
  onChangeGrid: (index: number) => void;
  onClose: () => void;
}

/** mm:ss, matching the live timer's formatting. */
function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Same header as the Game screen (A2i), except the timer slot shows how the
 * round ended instead of ticking (fb#2i):
 *  - completed: remaining/bonus time in green, "All Grids Completed"
 *  - interrupted: remaining time in red, "Game Stopped"
 *  - anything else (expired): 0:00 in orange, "{n} words found out of 42"
 */
function buildReviewHeaderHtml(options: ReviewScreenOptions): string {
  const { roundState, locale, playerName, playerAvatarUrl } = options;
  const stats = getRoundStats(roundState);
  const status = roundState.round.status;

  let timeValue: string;
  let statusModifier: string;
  let statusMessage: string;

  if (status === 'completed') {
    timeValue = formatTime(stats.remainingSeconds);
    statusModifier = 'completed';
    statusMessage = t('reviewStatusAllCompleted', locale);
  } else if (status === 'interrupted') {
    timeValue = formatTime(stats.remainingSeconds);
    statusModifier = 'stopped';
    statusMessage = t('reviewStatusGameStopped', locale);
  } else {
    timeValue = formatTime(0);
    statusModifier = 'expired';
    statusMessage = tFormat('reviewWordsFoundOfTotal', locale, {
      found: stats.wordsFound,
      total: stats.totalWords,
    });
  }

  const avatarContent = playerAvatarUrl
    ? `<img class="game-header__avatar-image" src="${escapeHtml(playerAvatarUrl)}" alt="" />`
    : GENERIC_AVATAR_ICON;

  return `
    <header class="game-header">
      <div class="game-stat__timer" data-timer-wrap aria-label="${escapeHtml(`${timeValue}, ${statusMessage}`)}">
        <span class="game-stat__value game-stat__value--review-${statusModifier}">${escapeHtml(timeValue)}</span>
        <span class="game-stat__badge game-stat__badge--review-${statusModifier}">${escapeHtml(statusMessage)}</span>
      </div>
      <span class="game-header__score" data-score aria-label="${escapeHtml(t('score', locale))} ${roundState.score.total}">${roundState.score.total}</span>
      <div
        class="game-header__player"
        aria-label="${escapeHtml(tFormat('playerAvatarAria', locale, { name: playerName }))}"
      >
        <span class="game-header__player-name">${escapeHtml(playerName)}</span>
        <span class="game-header__avatar" aria-hidden="true">${avatarContent}</span>
      </div>
    </header>
  `;
}

export function buildReviewScreenHtml(options: ReviewScreenOptions): string {
  const { roundState, reviewGridIndex, locale } = options;
  const grid = roundState.round.grids[reviewGridIndex];
  const hasPrevious = reviewGridIndex > 0;
  const hasNext = reviewGridIndex < roundState.round.grids.length - 1;
  const unfoundWordColors = getUnfoundWordColors(grid);

  return `
    <section class="screen screen--review" aria-label="${escapeHtml(t('gridReview', locale))}">
      ${buildReviewHeaderHtml(options)}

      <div class="game-theme-row">
        <button
          type="button"
          class="stop-game-button"
          data-action="close"
          aria-label="${escapeHtml(t('backToResults', locale))}"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div
        class="letter-grid letter-grid--review"
        role="grid"
        aria-label="${escapeHtml(`${t('gridReview', locale)} ${reviewGridIndex + 1}`)}"
        aria-readonly="true"
      >
        ${buildReviewLetterGridHtml(grid, locale)}
      </div>

      <div class="grid-rank-badge">
        <span class="grid-rank-badge__rank">${reviewGridIndex + 1}</span>
        <span class="grid-rank-badge__separator" aria-hidden="true">–</span>
        <span class="grid-rank-badge__category">${escapeHtml(grid.themeLabel)}</span>
      </div>

      <ul class="clue-list" aria-label="${escapeHtml(t('reviewAllWords', locale))}">
        ${buildClueListHtml(grid, { locale, unfoundWordColors })}
      </ul>

      <div class="next-grid-row next-grid-row--review">
        <button
          type="button"
          class="next-grid-button prev-grid-button${hasPrevious ? '' : ' next-grid-button--disabled'}"
          data-action="prev"
          ${hasPrevious ? '' : 'disabled'}
          aria-label="${escapeHtml(t('previousGrid', locale))}"
        >
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path fill="currentColor" d="M14.6 6.6 8.2 12l6.4 5.4V6.6z" />
          </svg>
        </button>
        <button
          type="button"
          class="next-grid-button${hasNext ? '' : ' next-grid-button--disabled'}"
          data-action="next"
          ${hasNext ? '' : 'disabled'}
          aria-label="${escapeHtml(t('nextGrid', locale))}"
        >
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path fill="currentColor" d="M9.4 6.6 15.8 12l-6.4 5.4V6.6z" />
          </svg>
        </button>
      </div>

      <div class="word-gauge" aria-label="${escapeHtml(getGaugeSummaryText(grid, locale))}">
        ${buildGaugeHtml(grid)}
      </div>
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
