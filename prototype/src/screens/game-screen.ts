import { type Coordinate, type RoundState } from '@spott/engine';

import { buildClueListHtml, renderClueList, type ClueListOptions } from '../components/clue-list.js';
import { buildGaugeHtml, renderGauge } from '../components/word-gauge.js';
import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { attachGridSwipe } from '../interaction/grid-swipe.js';
import { buildLetterGridHtml } from '../utils/grid-display.js';
import {
  canSkipGrid,
  getGridDisplayLabel,
  getGridNavigationHint,
} from '../utils/grid-navigation.js';
import { escapeHtml } from '../utils/html.js';
import { formatRemainingTime, isTimerUrgent } from '../utils/round-timer.js';
import { injectWordColorVars } from '../utils/word-colors.js';

const SKIP_TRANSITION_MS = 200;

export interface GameScreenViewOptions {
  clueListOptions?: ClueListOptions;
  timerPaused?: boolean;
}

export interface GameScreenOptions {
  roundState: RoundState;
  locale: UiLocale;
  getViewOptions?: () => GameScreenViewOptions;
  onSkip: () => void;
  onSubmitSwipe: (coordinates: Coordinate[]) => boolean;
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

  container.innerHTML = buildGameScreenHtml(options.roundState, options.locale, getViewOptions());

  let swipeHandle = attachGridSwipe(
    container.querySelector<HTMLElement>('[data-letter-grid]')!,
    { onSubmitSwipe: options.onSubmitSwipe },
  );

  let skipTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

  container.querySelector<HTMLButtonElement>('[data-action="skip"]')?.addEventListener(
    'click',
    options.onSkip,
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

  const updateTimerDisplay = (remainingSeconds: number, timerPaused = false): void => {
    const timerEl = container.querySelector<HTMLElement>('[data-timer]');
    if (!timerEl) {
      return;
    }

    timerEl.textContent = formatRemainingTime(remainingSeconds);
    timerEl.classList.toggle('game-stat__value--urgent', !timerPaused && isTimerUrgent(remainingSeconds));
    timerEl.classList.toggle('game-stat__value--paused', timerPaused);
    timerEl.setAttribute(
      'aria-label',
      timerPaused ? t('timerPaused', options.locale) : t('timeRemainingAria', options.locale),
    );
  };

  return {
    updateTimer: updateTimerDisplay,
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
    renderGauge(gauge, grid);
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

  const timerEl = container.querySelector<HTMLElement>('[data-timer]');
  if (timerEl) {
    timerEl.textContent = formatRemainingTime(roundState.remainingSeconds);
    timerEl.classList.toggle('game-stat__value--urgent', !timerPaused && isTimerUrgent(roundState.remainingSeconds));
    timerEl.classList.toggle('game-stat__value--paused', timerPaused);
    timerEl.setAttribute(
      'aria-label',
      timerPaused ? t('timerPaused', locale) : t('timeRemainingAria', locale),
    );
  }
}

function updateGridNavigation(container: HTMLElement, roundState: RoundState, locale: UiLocale): void {
  container.querySelector<HTMLElement>('[data-grid-number]')!.textContent =
    getGridDisplayLabel(roundState);
  container.querySelector<HTMLElement>('[data-grid-hint]')!.textContent =
    getGridNavigationHint(roundState, locale);
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
}

function buildGameScreenHtml(
  roundState: RoundState,
  locale: UiLocale,
  viewOptions: GameScreenViewOptions,
): string {
  const grid = roundState.round.grids[roundState.currentGridIndex];
  const skippable = canSkipGrid(roundState);
  const timerPaused = viewOptions.timerPaused ?? false;
  const foundOnGrid = grid.placedWords.filter((word) => word.found).length;
  const clueListOptions = { ...viewOptions.clueListOptions, locale };

  return `
    <section
      class="screen screen--game"
      aria-label="${escapeHtml(t('gameAriaLabel', locale))}"
      data-current-grid="${roundState.currentGridIndex}"
    >
      <header class="game-header">
        <div class="game-stat game-stat--grid">
          <span class="game-stat__label">${escapeHtml(t('grid', locale))}</span>
          <span class="game-stat__value" data-grid-number aria-live="polite">${getGridDisplayLabel(roundState)}</span>
          <span class="game-stat__hint" data-grid-hint>${escapeHtml(getGridNavigationHint(roundState, locale))}</span>
        </div>
        <div class="game-stat">
          <span class="game-stat__label">${escapeHtml(t('time', locale))}</span>
          <span class="game-stat__value${!timerPaused && isTimerUrgent(roundState.remainingSeconds) ? ' game-stat__value--urgent' : ''}${timerPaused ? ' game-stat__value--paused' : ''}" data-timer aria-live="polite" aria-label="${escapeHtml(timerPaused ? t('timerPaused', locale) : t('timeRemainingAria', locale))}">${formatRemainingTime(roundState.remainingSeconds)}</span>
        </div>
        <div class="game-stat">
          <span class="game-stat__label">${escapeHtml(t('score', locale))}</span>
          <span class="game-stat__value" data-score>${roundState.score.total}</span>
        </div>
      </header>

      <p class="game-theme" data-theme-label>${escapeHtml(grid.themeLabel)}</p>

      <div class="word-gauge" data-gauge aria-label="${escapeHtml(tFormat('wordsFoundOnGrid', locale, { found: foundOnGrid, total: grid.placedWords.length }))}">
        ${buildGaugeHtml(grid)}
      </div>

      <div class="letter-grid" data-letter-grid role="grid" aria-label="${escapeHtml(`${t('grid', locale)} ${getGridDisplayLabel(roundState)}`)}">
        ${buildLetterGridHtml(grid)}
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
    </section>
  `;
}
