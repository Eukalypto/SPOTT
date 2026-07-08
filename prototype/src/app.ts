import { skipGrid, submitSwipe } from '@spott/engine';

import { completeCurrentGridViaEngine, logRoundState } from './debug/debug-actions.js';
import { mountDebugPanel, updateDebugPanelView } from './debug/debug-panel.js';
import { IS_DEV } from './env.js';
import { setDocumentLanguage } from './i18n/index.js';
import { renderEndScreen } from './screens/end-screen.js';
import { mountGameScreen, type GameScreenHandle } from './screens/game-screen.js';
import { renderReviewScreen } from './screens/review-screen.js';
import { renderRoundStartErrorScreen } from './screens/round-start-error-screen.js';
import { renderStartScreen } from './screens/start-screen.js';
import { startPracticeRoundState } from './utils/round-setup.js';
import { savePersistedLanguage } from './utils/language-persistence.js';
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
  let debugPanelRoot: HTMLElement | null = null;

  const destroyGameScreen = (): void => {
    gameScreenHandle?.destroy();
    gameScreenHandle = null;
    debugPanelRoot = null;
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
      timerPaused: false,
    };
    render();
  };

  const applyRoundState = (
    roundState: NonNullable<AppState['roundState']>,
    options: { fromSwipe?: boolean; fromSkip?: boolean; fromDebug?: boolean } = {},
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
      if (options.fromSwipe || options.fromSkip || options.fromDebug) {
        gameScreenHandle?.updateFromRoundState(roundState);
        updateDebugPanel();
        if (options.fromSkip) {
          gameScreenHandle?.playSkipTransition();
        }
        return;
      }
      render();
    }
  };

  const clearRoundStartError = (): void => {
    state = {
      ...state,
      screen: 'start',
      roundStartError: null,
      roundState: null,
    };
    render();
  };

  const handleRoundStartFailure = (
    failure: Extract<ReturnType<typeof startPracticeRoundState>, { success: false }>,
  ): void => {
    stopRoundTimer();
    state = {
      ...state,
      screen: 'round-error',
      roundState: null,
      roundStartError: {
        reason: failure.reason,
        message: failure.message,
      },
      reviewGridIndex: 0,
      debugRevealWords: false,
      timerPaused: false,
    };
    render();
  };

  const startPracticeRound = (): void => {
    const result = startPracticeRoundState({
      language: state.selectedLanguage,
      uiLocale: state.selectedLanguage,
    });

    if (!result.success) {
      handleRoundStartFailure(result);
      return;
    }

    state = {
      ...state,
      screen: 'game',
      roundState: result.roundState,
      roundStartError: null,
      reviewGridIndex: 0,
      debugRevealWords: false,
      timerPaused: false,
    };
    render();
  };

  const resetToStartPreservingLanguage = (): AppState => ({
    ...createInitialAppState(),
    selectedLanguage: state.selectedLanguage,
    roundStartError: null,
  });

  const getGameViewOptions = () => ({
    clueListOptions: { revealWords: state.debugRevealWords, locale: state.selectedLanguage },
    timerPaused: state.timerPaused,
  });

  const updateDebugPanel = (): void => {
    if (!IS_DEV || !debugPanelRoot) {
      return;
    }

    updateDebugPanelView(debugPanelRoot, {
      locale: state.selectedLanguage,
      revealWords: state.debugRevealWords,
      timerPaused: state.timerPaused,
    });
  };

  const mountDevTools = (shell: HTMLElement): void => {
    if (!IS_DEV || state.screen !== 'game') {
      return;
    }

    debugPanelRoot = document.createElement('div');
    debugPanelRoot.className = 'debug-panel-root';
    shell.appendChild(debugPanelRoot);

    mountDebugPanel(
      debugPanelRoot,
      {
        locale: state.selectedLanguage,
        revealWords: state.debugRevealWords,
        timerPaused: state.timerPaused,
      },
      {
        onRevealWords: () => {
          state = {
            ...state,
            debugRevealWords: !state.debugRevealWords,
          };
          if (state.roundState) {
            gameScreenHandle?.updateFromRoundState(state.roundState);
          }
          updateDebugPanel();
        },
        onCompleteGrid: () => {
          if (!state.roundState) {
            return;
          }
          applyRoundState(completeCurrentGridViaEngine(state.roundState), { fromDebug: true });
        },
        onToggleTimerPause: () => {
          state = {
            ...state,
            timerPaused: !state.timerPaused,
          };

          if (state.timerPaused) {
            roundTimer?.pause();
          } else {
            roundTimer?.resume();
          }

          if (state.roundState) {
            gameScreenHandle?.updateTimer(
              state.roundState.remainingSeconds,
              state.timerPaused,
            );
          }
          updateDebugPanel();
        },
        onRegenerateRound: () => {
          startPracticeRound();
        },
        onLogState: () => {
          if (state.roundState) {
            logRoundState(state.roundState);
          }
        },
      },
    );
  };

  const render = (): void => {
    stopRoundTimer();
    destroyGameScreen();
    setDocumentLanguage(state.selectedLanguage);

    root.innerHTML = '';
    const shell = document.createElement('div');
    shell.className = 'app-shell';
    root.appendChild(shell);

    switch (state.screen) {
      case 'start':
        renderStartScreen(shell, {
          locale: state.selectedLanguage,
          selectedLanguage: state.selectedLanguage,
          onLanguageChange: (language) => {
            savePersistedLanguage(language);
            state = {
              ...state,
              selectedLanguage: language,
              roundStartError: null,
            };
            render();
          },
          onStartPracticeRound: startPracticeRound,
        });
        break;
      case 'round-error':
        if (!state.roundStartError) {
          clearRoundStartError();
          return;
        }
        renderRoundStartErrorScreen(shell, {
          locale: state.selectedLanguage,
          error: state.roundStartError,
          onTryAgain: startPracticeRound,
          onBackToStart: clearRoundStartError,
        });
        break;
      case 'game':
        if (!state.roundState) {
          state = resetToStartPreservingLanguage();
          render();
          return;
        }
        gameScreenHandle = mountGameScreen(shell, {
          roundState: state.roundState,
          locale: state.selectedLanguage,
          getViewOptions: getGameViewOptions,
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
        mountDevTools(shell);
        startRoundTimer();
        break;
      case 'end':
        if (!state.roundState) {
          state = resetToStartPreservingLanguage();
          render();
          return;
        }
        renderEndScreen(shell, {
          roundState: state.roundState,
          locale: state.selectedLanguage,
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
          state = resetToStartPreservingLanguage();
          render();
          return;
        }
        renderReviewScreen(shell, {
          roundState: state.roundState,
          reviewGridIndex: state.reviewGridIndex,
          locale: state.selectedLanguage,
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
      isPaused: () => state.timerPaused,
      onTick: (roundState) => {
        state = {
          ...state,
          roundState,
        };
        gameScreenHandle?.updateTimer(roundState.remainingSeconds, state.timerPaused);
      },
      onRoundEnded: (roundState) => {
        handleRoundEnded(roundState);
      },
    });
    roundTimer.start();

    if (state.timerPaused) {
      roundTimer.pause();
    }
  };

  render();

  return {
    getState: () => state,
  };
}
