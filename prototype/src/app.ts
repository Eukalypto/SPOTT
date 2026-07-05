import {
  createInitialRoundState,
  createSeededRandom,
  generateRound,
  skipGrid,
  startRound,
  submitSwipe,
} from '@spott/engine';

import { PROTOTYPE_LANGUAGE } from './constants.js';
import { renderEndScreen } from './screens/end-screen.js';
import { mountGameScreen, type GameScreenHandle } from './screens/game-screen.js';
import { renderReviewScreen } from './screens/review-screen.js';
import { renderStartScreen } from './screens/start-screen.js';
import {
  createRoundTimerController,
  isRoundFinished,
  type RoundTimerController,
} from './utils/round-timer.js';
import { createInitialAppState, type AppState } from './types.js';

export function createApp(root: HTMLElement): { getState: () => AppState } {
  let state = createInitialAppState();
  let gameScreenHandle: GameScreenHandle | null = null;
  let roundTimer: RoundTimerController | null = null;

  const destroyGameScreen = (): void => {
    gameScreenHandle?.destroy();
    gameScreenHandle = null;
  };

  const stopRoundTimer = (): void => {
    roundTimer?.stop();
    roundTimer = null;
  };

  const handleRoundEnded = (roundState: NonNullable<AppState['roundState']>): void => {
    stopRoundTimer();
    state = {
      ...state,
      roundState,
      screen: 'end',
    };
    render();
  };

  const applyRoundState = (
    roundState: NonNullable<AppState['roundState']>,
    options: { fromSwipe?: boolean; fromSkip?: boolean } = {},
  ): void => {
    state = {
      ...state,
      roundState,
    };

    if (isRoundFinished(roundState)) {
      handleRoundEnded(roundState);
      return;
    }

    if (state.screen === 'game') {
      if (options.fromSwipe || options.fromSkip) {
        gameScreenHandle?.updateFromRoundState(roundState);
        if (options.fromSkip) {
          gameScreenHandle?.playSkipTransition();
        }
        return;
      }
      render();
    }
  };

  const startPracticeRound = (): void => {
    const roundId = `practice-${Date.now()}`;
    const result = generateRound({
      id: roundId,
      language: PROTOTYPE_LANGUAGE,
      random: createSeededRandom(roundId),
    });

    if (!result.success) {
      state = {
        ...state,
        screen: 'start',
        errorMessage: `Could not start a practice round (${result.reason}).`,
      };
      render();
      return;
    }

    state = {
      screen: 'game',
      roundState: startRound(createInitialRoundState(result.round), Date.now()),
      errorMessage: null,
      reviewGridIndex: 0,
    };
    render();
  };

  const render = (): void => {
    stopRoundTimer();
    destroyGameScreen();

    root.innerHTML = '';
    const shell = document.createElement('div');
    shell.className = 'app-shell';
    root.appendChild(shell);

    switch (state.screen) {
      case 'start':
        renderStartScreen(shell, {
          errorMessage: state.errorMessage,
          onStartPracticeRound: startPracticeRound,
        });
        break;
      case 'game':
        if (!state.roundState) {
          state = createInitialAppState();
          render();
          return;
        }
        gameScreenHandle = mountGameScreen(shell, {
          roundState: state.roundState,
          onSkip: () => {
            if (!state.roundState) {
              return;
            }
            const nextState = skipGrid(state.roundState);
            if (nextState === state.roundState) {
              return;
            }
            applyRoundState(nextState, { fromSkip: true });
          },
          onSubmitSwipe: (coordinates) => {
            if (!state.roundState) {
              return false;
            }
            const result = submitSwipe(state.roundState, coordinates);
            if (!result.applied) {
              return false;
            }
            applyRoundState(result.state, { fromSwipe: true });
            return true;
          },
        });
        startRoundTimer();
        break;
      case 'end':
        if (!state.roundState) {
          state = createInitialAppState();
          render();
          return;
        }
        renderEndScreen(shell, {
          roundState: state.roundState,
          onReviewGrids: () => {
            state = {
              ...state,
              screen: 'review',
              reviewGridIndex: 0,
            };
            render();
          },
          onStartAnotherRound: startPracticeRound,
        });
        break;
      case 'review':
        if (!state.roundState) {
          state = createInitialAppState();
          render();
          return;
        }
        renderReviewScreen(shell, {
          roundState: state.roundState,
          reviewGridIndex: state.reviewGridIndex,
          onChangeGrid: (index) => {
            state = {
              ...state,
              reviewGridIndex: index,
            };
            render();
          },
          onClose: () => {
            state = {
              ...state,
              screen: 'end',
            };
            render();
          },
        });
        break;
    }
  };

  const startRoundTimer = (): void => {
    roundTimer = createRoundTimerController({
      getRoundState: () => state.roundState,
      isGameScreenActive: () => state.screen === 'game',
      onTick: (roundState) => {
        state = {
          ...state,
          roundState,
        };
        gameScreenHandle?.updateTimer(roundState.remainingSeconds);
      },
      onRoundEnded: (roundState) => {
        handleRoundEnded(roundState);
      },
    });
    roundTimer.start();
  };

  render();

  return {
    getState: () => state,
  };
}
