import { skipGrid, submitSwipe, type LanguageCode } from '@spott/engine';

import { IS_DEV } from './env.js';
import { DEFAULT_PRACTICE_LANGUAGE } from './constants.js';
import { setDocumentLanguage } from './i18n/index.js';
import {
  endState,
  gameState,
  homeState,
  practiceSetupState,
  reviewState,
  roundErrorState,
  rulesState,
  settingsState,
} from './navigation/app-navigation.js';
import { renderEndScreen } from './screens/end-screen.js';
import { mountGameScreen, type GameScreenHandle } from './screens/game-screen.js';
import { renderHomeScreen } from './screens/home-screen.js';
import { renderPracticeSetupScreen } from './screens/practice-setup-screen.js';
import { renderReviewScreen } from './screens/review-screen.js';
import { renderRoundStartErrorScreen } from './screens/round-start-error-screen.js';
import { normalizeRulesReturnScreen, renderRulesScreen } from './screens/rules-screen.js';
import { renderSettingsScreen } from './screens/settings-screen.js';
import { startPracticeRoundState } from './utils/round-setup.js';
import { savePersistedLanguage, resetPersistedLanguage } from './utils/language-persistence.js';
import {
  createRoundTimerController,
  isRoundFinished,
  type RoundTimerController,
} from './utils/round-timer.js';
import { createInitialAppState, type AppState } from './types.js';

type DevToolsHandle = {
  update: () => void;
  destroy: () => void;
};

export function createApp(root: HTMLElement): { getState: () => AppState } {
  let state = createInitialAppState();
  let gameScreenHandle: GameScreenHandle | null = null;
  let roundTimer: RoundTimerController | null = null;
  let devToolsHandle: DevToolsHandle | null = null;
  let renderGeneration = 0;

  const destroyDevTools = (): void => {
    devToolsHandle?.destroy();
    devToolsHandle = null;
  };

  const destroyGameScreen = (): void => {
    gameScreenHandle?.destroy();
    gameScreenHandle = null;
    destroyDevTools();
  };

  const stopRoundTimer = (): void => {
    roundTimer?.stop();
    roundTimer = null;
  };

  const render = (): void => {
    stopRoundTimer();
    destroyGameScreen();
    setDocumentLanguage(state.selectedLanguage);

    const generation = ++renderGeneration;

    root.innerHTML = '';
    const shell = document.createElement('div');
    shell.className = 'app-shell';
    root.appendChild(shell);

    switch (state.screen) {
      case 'home':
        renderHomeScreen(shell, {
          locale: state.selectedLanguage,
          onPractice: goToPracticeSetup,
          onRules: () => goToRules('home'),
          onSettings: goToSettings,
        });
        break;
      case 'practice-setup':
        renderPracticeSetupScreen(shell, {
          locale: state.selectedLanguage,
          selectedLanguage: state.selectedLanguage,
          onLanguageChange: applyLanguageChange,
          onStartPracticeRound: startPracticeRound,
          onRules: () => goToRules('practice-setup'),
          onBack: goHome,
        });
        break;
      case 'rules':
        renderRulesScreen(shell, {
          locale: state.selectedLanguage,
          returnScreen: state.rulesReturnScreen,
          onBack:
            state.rulesReturnScreen === 'practice-setup' ? goToPracticeSetup : goHome,
        });
        break;
      case 'settings':
        renderSettingsScreen(shell, {
          locale: state.selectedLanguage,
          selectedLanguage: state.selectedLanguage,
          onLanguageChange: applyLanguageChange,
          onResetLanguage: resetLanguageToDefault,
          onBack: goHome,
        });
        break;
      case 'round-error':
        if (!state.roundStartError) {
          goHome();
          return;
        }
        renderRoundStartErrorScreen(shell, {
          locale: state.selectedLanguage,
          error: state.roundStartError,
          onTryAgain: startPracticeRound,
          onBackToStart: goHome,
        });
        break;
      case 'game':
        if (!state.roundState) {
          goHome();
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
        mountDevTools(shell, generation);
        startRoundTimer();
        break;
      case 'end':
        if (!state.roundState) {
          goHome();
          return;
        }
        renderEndScreen(shell, {
          roundState: state.roundState,
          locale: state.selectedLanguage,
          onReviewGrids: goToReview,
          onStartAnotherRound: startNewRound,
          onBackToStart: goHome,
        });
        break;
      case 'review':
        if (!state.roundState) {
          goHome();
          return;
        }
        renderReviewScreen(shell, {
          roundState: state.roundState,
          reviewGridIndex: state.reviewGridIndex,
          locale: state.selectedLanguage,
          onChangeGrid: (index) => {
            state = reviewState(state, index);
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

  const goHome = (): void => {
    stopRoundTimer();
    state = homeState(state);
    render();
  };

  const goToPracticeSetup = (): void => {
    stopRoundTimer();
    state = practiceSetupState(state);
    render();
  };

  const goToRules = (returnScreen: unknown = 'home'): void => {
    stopRoundTimer();
    state = rulesState(state, normalizeRulesReturnScreen(returnScreen));
    render();
  };

  const goToSettings = (): void => {
    stopRoundTimer();
    state = settingsState(state);
    render();
  };

  const applyLanguageChange = (language: LanguageCode): void => {
    if (language === state.selectedLanguage) {
      return;
    }

    savePersistedLanguage(language);
    state = {
      ...state,
      selectedLanguage: language,
      roundStartError: null,
    };
    render();
  };

  const resetLanguageToDefault = (): void => {
    resetPersistedLanguage();
    state = {
      ...state,
      selectedLanguage: DEFAULT_PRACTICE_LANGUAGE,
      roundStartError: null,
    };
    render();
  };

  const goToReview = (): void => {
    if (!state.roundState) {
      return;
    }
    state = reviewState(state, 0);
    render();
  };

  const handleRoundEnded = (roundState: NonNullable<AppState['roundState']>): void => {
    stopRoundTimer();
    state = endState(state, roundState);
    render();
  };

  const handleRoundStartFailure = (
    failure: Extract<ReturnType<typeof startPracticeRoundState>, { success: false }>,
  ): void => {
    stopRoundTimer();
    state = roundErrorState(state, {
      reason: failure.reason,
      message: failure.message,
    });
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

    state = gameState(state, result.roundState);
    render();
  };

  const startNewRound = (): void => {
    startPracticeRound();
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

  const getGameViewOptions = () => ({
    clueListOptions: {
      revealWords: IS_DEV && state.debugRevealWords,
      locale: state.selectedLanguage,
    },
    timerPaused: IS_DEV && state.timerPaused,
  });

  const updateDebugPanel = (): void => {
    devToolsHandle?.update();
  };

  const mountDevTools = (shell: HTMLElement, generation: number): void => {
    if (!IS_DEV || state.screen !== 'game') {
      return;
    }

    void import('./debug/dev-tools-setup.js').then(
      ({ attachDevTools, completeCurrentGridViaEngine, logRoundState }) => {
        if (generation !== renderGeneration || state.screen !== 'game') {
          return;
        }

        devToolsHandle = attachDevTools(shell, {
          getLocale: () => state.selectedLanguage,
          getRevealWords: () => state.debugRevealWords,
          getTimerPaused: () => state.timerPaused,
          onRevealWords: () => {
            state = {
              ...state,
              debugRevealWords: !state.debugRevealWords,
            };
            if (state.roundState) {
              gameScreenHandle?.updateFromRoundState(state.roundState);
            }
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
          },
          onRegenerateRound: () => {
            startPracticeRound();
          },
          onLogState: () => {
            if (state.roundState) {
              logRoundState(state.roundState);
            }
          },
        });
      },
    );
  };

  const startRoundTimer = (): void => {
    roundTimer = createRoundTimerController({
      getRoundState: () => state.roundState,
      isGameScreenActive: () => state.screen === 'game',
      isPaused: () => IS_DEV && state.timerPaused,
      onTick: (roundState) => {
        state = {
          ...state,
          roundState,
        };
        gameScreenHandle?.updateTimer(
          roundState.remainingSeconds,
          IS_DEV && state.timerPaused,
        );
      },
      onRoundEnded: (roundState) => {
        handleRoundEnded(roundState);
      },
    });
    roundTimer.start();

    if (IS_DEV && state.timerPaused) {
      roundTimer.pause();
    }
  };

  render();

  return {
    getState: () => state,
  };
}
