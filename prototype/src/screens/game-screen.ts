import {
  GAME_CONFIG,
  type Coordinate,
  type RoundState,
} from '@spott/engine';

import { buildClueListHtml, renderClueList } from '../components/clue-list.js';
import { buildGaugeHtml, renderGauge } from '../components/word-gauge.js';
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

export interface GameScreenOptions {
  roundState: RoundState;
  onSkip: () => void;
  onSubmitSwipe: (coordinates: Coordinate[]) => boolean;
}

export interface GameScreenHandle {
  updateTimer: (remainingSeconds: number) => void;
  updateFromRoundState: (roundState: RoundState) => void;
  playSkipTransition: () => void;
  destroy: () => void;
}

export function mountGameScreen(
  container: HTMLElement,
  options: GameScreenOptions,
): GameScreenHandle {
  injectWordColorVars(container);
  container.innerHTML = buildGameScreenHtml(options.roundState);

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

  return {
    updateTimer: (remainingSeconds) => {
      const timerEl = container.querySelector<HTMLElement>('[data-timer]');
      if (timerEl) {
        timerEl.textContent = formatRemainingTime(remainingSeconds);
        timerEl.classList.toggle('game-stat__value--urgent', isTimerUrgent(remainingSeconds));
      }
    },
    updateFromRoundState: (roundState) => {
      updateGameScreenDom(container, roundState);
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

function updateGameScreenDom(container: HTMLElement, roundState: RoundState): void {
  const grid = roundState.round.grids[roundState.currentGridIndex];

  container.querySelector<HTMLElement>('[data-score]')!.textContent = String(
    roundState.score.total,
  );
  container.querySelector<HTMLElement>('[data-current-grid]')!.dataset.currentGrid = String(
    roundState.currentGridIndex,
  );

  updateGridNavigation(container, roundState);

  const gauge = container.querySelector<HTMLElement>('[data-gauge]');
  if (gauge) {
    renderGauge(gauge, grid);
  }

  const clueList = container.querySelector<HTMLElement>('[data-clue-list]');
  if (clueList) {
    renderClueList(clueList, grid);
  }

  const theme = container.querySelector<HTMLElement>('[data-theme-label]');
  if (theme) {
    theme.textContent = grid.themeLabel;
  }

  updateSkipButton(container, roundState);

  const letterGrid = container.querySelector<HTMLElement>('[data-letter-grid]');
  if (letterGrid) {
    letterGrid.innerHTML = buildLetterGridHtml(grid);
  }
}

function updateGridNavigation(container: HTMLElement, roundState: RoundState): void {
  const gridNumberEl = container.querySelector<HTMLElement>('[data-grid-number]');
  const gridHintEl = container.querySelector<HTMLElement>('[data-grid-hint]');

  if (gridNumberEl) {
    gridNumberEl.textContent = getGridDisplayLabel(roundState);
  }

  if (gridHintEl) {
    gridHintEl.textContent = getGridNavigationHint(roundState);
  }
}

function updateSkipButton(container: HTMLElement, roundState: RoundState): void {
  const skipButton = container.querySelector<HTMLButtonElement>('[data-action="skip"]');
  if (!skipButton) {
    return;
  }

  const skippable = canSkipGrid(roundState);
  skipButton.disabled = !skippable;
  skipButton.setAttribute(
    'aria-label',
    skippable ? 'Skip to next unfinished grid' : 'Skip unavailable on the last unfinished grid',
  );
}

function buildGameScreenHtml(roundState: RoundState): string {
  const grid = roundState.round.grids[roundState.currentGridIndex];
  const skippable = canSkipGrid(roundState);
  const foundOnGrid = grid.placedWords.filter((word) => word.found).length;

  return `
    <section
      class="screen screen--game"
      aria-label="Game"
      data-current-grid="${roundState.currentGridIndex}"
    >
      <header class="game-header">
        <div class="game-stat game-stat--grid">
          <span class="game-stat__label">Grid</span>
          <span class="game-stat__value" data-grid-number aria-live="polite">${getGridDisplayLabel(roundState)}</span>
          <span class="game-stat__hint" data-grid-hint>${getGridNavigationHint(roundState)}</span>
        </div>
        <div class="game-stat">
          <span class="game-stat__label">Time</span>
          <span class="game-stat__value${isTimerUrgent(roundState.remainingSeconds) ? ' game-stat__value--urgent' : ''}" data-timer aria-live="polite">${formatRemainingTime(roundState.remainingSeconds)}</span>
        </div>
        <div class="game-stat">
          <span class="game-stat__label">Score</span>
          <span class="game-stat__value" data-score>${roundState.score.total}</span>
        </div>
      </header>

      <p class="game-theme" data-theme-label>${escapeHtml(grid.themeLabel)}</p>

      <div class="word-gauge" data-gauge aria-label="${foundOnGrid} of ${grid.placedWords.length} words found on this grid">
        ${buildGaugeHtml(grid)}
      </div>

      <div class="letter-grid" data-letter-grid role="grid" aria-label="Letter grid ${getGridDisplayLabel(roundState)}">
        ${buildLetterGridHtml(grid)}
      </div>

      <ul class="clue-list" data-clue-list aria-label="Clues">
        ${buildClueListHtml(grid)}
      </ul>

      <button
        type="button"
        class="skip-button${skippable ? '' : ' skip-button--disabled'}"
        data-action="skip"
        ${skippable ? '' : 'disabled'}
        aria-label="${skippable ? 'Skip to next unfinished grid' : 'Skip unavailable on the last unfinished grid'}"
      >
        <span class="skip-button__label">Skip</span>
        <span class="skip-button__arrow" aria-hidden="true">→</span>
      </button>
    </section>
  `;
}
