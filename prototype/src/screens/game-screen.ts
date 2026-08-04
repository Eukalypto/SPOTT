import { type Coordinate, type RoundState } from '@spott/engine';

import { buildClueListHtml, renderClueList, type ClueListOptions } from '../components/clue-list.js';
import { buildGaugeHtml, getGaugeSummaryText, renderGauge } from '../components/word-gauge.js';
import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { attachGridSwipe } from '../interaction/grid-swipe.js';
import { buildLetterGridHtml } from '../utils/grid-display.js';
import {
  canSkipGrid,
  getGridDisplayLabel,
  getGridNavigationHint,
} from '../utils/grid-navigation.js';
import { escapeHtml } from '../utils/html.js';
import { buildTimerStatHtml, updateTimerDisplay } from '../utils/timer-display.js';
import { injectWordColorVars } from '../utils/word-colors.js';

const SKIP_TRANSITION_MS = 200;

export interface GameScreenViewOptions {
  clueListOptions?: ClueListOptions;
  timerPaused?: boolean;
}

export interface GameScreenOptions {
  roundState: RoundState;
  locale: UiLocale;
  /** Display name shown under the player's avatar; pass the guest label for guest sessions. */
  playerName: string;
  getViewOptions?: () => GameScreenViewOptions;
  onSkip: () => void;
  onSubmitSwipe: (coordinates: Coordinate[]) => boolean;
  onStopGame: () => void;
}

export interface GameScreenHandle {
  updateTimer: (remainingSeconds: number, timerPaused?: boolean) => void;
  updateFromRoundState: (roundState: RoundState) => void;
  playSkipTransition: () => void;
  destroy: () => void;
}

export function mountGameScreen(
  container: HTMLElement,
  options: GameScreenOptions,
): GameScreenHandle {
  injectWordColorVars(container);

  const getViewOptions = (): GameScreenViewOptions => options.getViewOptions?.() ?? {};

  container.innerHTML = buildGameScreenHtml(
    options.roundState,
    options.locale,
    options.playerName,
    getViewOptions(),
  );

  let swipeHandle = attachGridSwipe(
    container.querySelector<HTMLElement>('[data-letter-grid]')!,
    { onSubmitSwipe: options.onSubmitSwipe },
  );

  let skipTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

  container.querySelector<HTMLButtonElement>('[data-action="skip"]')?.addEventListener(
    'click',
    options.onSkip,
  );

  const stopGameDialog = container.querySelector<HTMLElement>('[data-stop-game-dialog]');
  const showStopGameDialog = (): void => {
    stopGameDialog?.removeAttribute('hidden');
  };
  const hideStopGameDialog = (): void => {
    stopGameDialog?.setAttribute('hidden', '');
  };

  container.querySelector<HTMLButtonElement>('[data-action="stop-game"]')?.addEventListener(
    'click',
    showStopGameDialog,
  );
  container.querySelector<HTMLButtonElement>('[data-action="stop-game-cancel"]')?.addEventListener(
    'click',
    hideStopGameDialog,
  );
  container.querySelector<HTMLButtonElement>('[data-action="stop-game-confirm"]')?.addEventListener(
    'click',
    () => {
      hideStopGameDialog();
      options.onStopGame();
    },
  );

  const playSkipTransition = (): void => {
    const screen = container.querySelector<HTMLElement>('.screen--game');
    if (!screen) {
      return;
    }

    screen.classList.remove('game-screen--skip-transition');
    void screen.offsetWidth;
    screen.classList.add('game-screen--skip-transition');

    if (skipTransitionTimeout !== null) {
      clearTimeout(skipTransitionTimeout);
    }

    skipTransitionTimeout = setTimeout(() => {
      screen.classList.remove('game-screen--skip-transition');
      skipTransitionTimeout = null;
    }, SKIP_TRANSITION_MS);
  };

  const updateTimerDisplayHandler = (remainingSeconds: number, timerPaused = false): void => {
    updateTimerDisplay(container, remainingSeconds, options.locale, { timerPaused });
  };

  return {
    updateTimer: updateTimerDisplayHandler,
    updateFromRoundState: (roundState) => {
      updateGameScreenDom(container, roundState, options.locale, getViewOptions());
    },
    playSkipTransition,
    destroy: () => {
      if (skipTransitionTimeout !== null) {
        clearTimeout(skipTransitionTimeout);
      }
      swipeHandle.destroy();
    },
  };
}

function updateGameScreenDom(
  container: HTMLElement,
  roundState: RoundState,
  locale: UiLocale,
  viewOptions: GameScreenViewOptions,
): void {
  const grid = roundState.round.grids[roundState.currentGridIndex];
  const timerPaused = viewOptions.timerPaused ?? false;
  const clueListOptions = { ...viewOptions.clueListOptions, locale };

  container.querySelector<HTMLElement>('[data-score]')!.textContent = String(roundState.score.total);
  container.querySelector<HTMLElement>('[data-current-grid]')!.dataset.currentGrid = String(
    roundState.currentGridIndex,
  );

  updateGridNavigation(container, roundState, locale);

  const gauge = container.querySelector<HTMLElement>('[data-gauge]');
  if (gauge) {
    renderGauge(gauge, grid, locale);
  }

  const gaugeSummary = container.querySelector<HTMLElement>('[data-gauge-summary]');
  if (gaugeSummary) {
    gaugeSummary.textContent = getGaugeSummaryText(grid, locale);
  }

  const clueList = container.querySelector<HTMLElement>('[data-clue-list]');
  if (clueList) {
    renderClueList(clueList, grid, clueListOptions);
  }

  const theme = container.querySelector<HTMLElement>('[data-theme-label]');
  if (theme) {
    theme.textContent = grid.themeLabel;
  }

  updateSkipButton(container, roundState, locale);

  const letterGrid = container.querySelector<HTMLElement>('[data-letter-grid]');
  if (letterGrid) {
    letterGrid.innerHTML = buildLetterGridHtml(grid);
  }

  updateTimerDisplay(container, roundState.remainingSeconds, locale, { timerPaused });
}

function updateGridNavigation(container: HTMLElement, roundState: RoundState, locale: UiLocale): void {
  container.querySelector<HTMLElement>('[data-grid-number]')!.textContent =
    getGridDisplayLabel(roundState);
  container.querySelector<HTMLElement>('[data-grid-hint]')!.textContent =
    getGridNavigationHint(roundState, locale);
  container.querySelector<HTMLElement>('[data-grid-rank]')!.textContent =
    getGridDisplayLabel(roundState);
}

function updateSkipButton(container: HTMLElement, roundState: RoundState, locale: UiLocale): void {
  const skipButton = container.querySelector<HTMLButtonElement>('[data-action="skip"]');
  if (!skipButton) {
    return;
  }

  const skippable = canSkipGrid(roundState);
  skipButton.disabled = !skippable;
  skipButton.setAttribute(
    'aria-label',
    skippable ? t('skipAriaAvailable', locale) : t('skipAriaUnavailable', locale),
  );
  skipButton.classList.toggle('skip-button--disabled', !skippable);

  const skipHint = container.querySelector<HTMLElement>('[data-skip-hint]');
  if (skipHint) {
    skipHint.hidden = skippable;
    skipHint.textContent = t('skipHintUnavailable', locale);
  }
}

function buildGameScreenHtml(
  roundState: RoundState,
  locale: UiLocale,
  playerName: string,
  viewOptions: GameScreenViewOptions,
): string {
  const grid = roundState.round.grids[roundState.currentGridIndex];
  const skippable = canSkipGrid(roundState);
  const timerPaused = viewOptions.timerPaused ?? false;
  const clueListOptions = { ...viewOptions.clueListOptions, locale };

  return `
    <section
      class="screen screen--game"
      aria-label="${escapeHtml(t('gameAriaLabel', locale))}"
      data-current-grid="${roundState.currentGridIndex}"
    >
      <div
        class="game-player-badge"
        aria-label="${escapeHtml(tFormat('playerAvatarAria', locale, { name: playerName }))}"
      >
        <span class="game-player-badge__avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path
              fill="currentColor"
              d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
            />
          </svg>
        </span>
        <span class="game-player-badge__name" data-player-name>${escapeHtml(playerName)}</span>
      </div>

      <header class="game-header">
        <div class="game-stat game-stat--grid">
          <span class="game-stat__label">${escapeHtml(t('grid', locale))}</span>
          <span class="game-stat__value" data-grid-number aria-live="polite">${getGridDisplayLabel(roundState)}</span>
          <span class="game-stat__hint" data-grid-hint>${escapeHtml(getGridNavigationHint(roundState, locale))}</span>
        </div>
        <div class="game-stat">
          <span class="game-stat__label">${escapeHtml(t('time', locale))}</span>
          ${buildTimerStatHtml(roundState.remainingSeconds, locale, { timerPaused })}
        </div>
        <div class="game-stat">
          <span class="game-stat__label">${escapeHtml(t('score', locale))}</span>
          <span class="game-stat__value" data-score>${roundState.score.total}</span>
        </div>
      </header>

      <div class="game-theme-row">
        <button
          type="button"
          class="stop-game-button"
          data-action="stop-game"
          aria-label="${escapeHtml(t('stopGame', locale))}"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <div class="word-gauge-block">
        <p class="word-gauge__summary" data-gauge-summary aria-live="polite">${escapeHtml(getGaugeSummaryText(grid, locale))}</p>
        <div class="word-gauge" data-gauge aria-label="${escapeHtml(getGaugeSummaryText(grid, locale))}">
          ${buildGaugeHtml(grid)}
        </div>
      </div>

      <div class="letter-grid" data-letter-grid role="grid" aria-label="${escapeHtml(t('letterGridAria', locale))}">
        ${buildLetterGridHtml(grid)}
      </div>

      <div class="grid-rank-badge">
        <span class="grid-rank-badge__category" data-theme-label>${escapeHtml(grid.themeLabel)}</span>
        <span class="grid-rank-badge__rank" data-grid-rank>${getGridDisplayLabel(roundState)}</span>
      </div>

      <ul class="clue-list" data-clue-list aria-label="${escapeHtml(t('clues', locale))}">
        ${buildClueListHtml(grid, clueListOptions)}
      </ul>

      <button
        type="button"
        class="skip-button${skippable ? '' : ' skip-button--disabled'}"
        data-action="skip"
        ${skippable ? '' : 'disabled'}
        aria-label="${escapeHtml(skippable ? t('skipAriaAvailable', locale) : t('skipAriaUnavailable', locale))}"
      >
        <span class="skip-button__label">${escapeHtml(t('skip', locale))}</span>
        <span class="skip-button__arrow" aria-hidden="true">→</span>
      </button>
      <p class="skip-button__hint" data-skip-hint${skippable ? ' hidden' : ''}>${escapeHtml(t('skipHintUnavailable', locale))}</p>

      <div
        class="confirm-dialog"
        data-stop-game-dialog
        hidden
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="stop-game-dialog-message"
      >
        <div class="confirm-dialog__panel">
          <p id="stop-game-dialog-message" class="confirm-dialog__message">
            ${escapeHtml(t('confirmStopGameMessage', locale))}
          </p>
          <div class="confirm-dialog__actions">
            <button type="button" class="secondary-button" data-action="stop-game-cancel">
              ${escapeHtml(t('confirmStopGameCancel', locale))}
            </button>
            <button type="button" class="primary-button" data-action="stop-game-confirm">
              ${escapeHtml(t('confirmStopGameConfirm', locale))}
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}
