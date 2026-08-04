import { interruptRound, skipGrid, submitSwipe, type LanguageCode } from '@spott/engine';

import { getMe, logout, type AuthResponse } from './api/auth-api.js';
import { updateAvatar, updateLanguagePref } from './api/settings-api.js';
import { submitRound } from './api/stats-api.js';
import { clearToken, getToken, isAuthenticated, saveToken } from './auth/session.js';
import { IS_DEV } from './env.js';
import { DEFAULT_PRACTICE_LANGUAGE } from './constants.js';
import { setDocumentLanguage, t } from './i18n/index.js';
import { bindFooterNav, renderFooterNav } from './components/footer-nav.js';
import {
  authState,
  endState,
  gameState,
  homeState,
  practiceSetupState,
  profileState,
  reviewState,
  roundErrorState,
  rulesState,
  settingsState,
} from './navigation/app-navigation.js';
import { renderAuthScreen } from './screens/auth-screen.js';
import { renderEndScreen } from './screens/end-screen.js';
import { mountGameScreen, type GameScreenHandle } from './screens/game-screen.js';
import { renderHomeScreen } from './screens/home-screen.js';
import { renderPracticeSetupScreen } from './screens/practice-setup-screen.js';
import { renderProfileScreen } from './screens/profile-screen.js';
import { renderReviewScreen } from './screens/review-screen.js';
import { renderRoundStartErrorScreen } from './screens/round-start-error-screen.js';
import { normalizeRulesReturnScreen, renderRulesScreen } from './screens/rules-screen.js';
import { renderSettingsScreen } from './screens/settings-screen.js';
import { getAvatarUrl } from './utils/avatar-assets.js';
import { startPracticeRoundState } from './utils/round-setup.js';
import {
  isValidLanguageCode,
  savePersistedLanguage,
} from './utils/language-persistence.js';
import { getRoundStats } from './utils/round-stats.js';
import {
  createRoundTimerController,
  isRoundFinished,
  type RoundTimerController,
} from './utils/round-timer.js';
import { createInitialAppState, type AppState, type AuthUser } from './types.js';

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

    if (state.auth.status === 'loading') {
      shell.innerHTML = `
        <section class="screen screen--home" aria-busy="true">
          <div class="home-hero">
            <p class="app-loading" role="status">…</p>
          </div>
        </section>
      `;
      return;
    }

    switch (state.screen) {
      case 'home':
        renderHomeScreen(shell, {
          locale: state.selectedLanguage,
          selectedLanguage: state.selectedLanguage,
          onLanguageChange: applyLanguageChange,
          onPlaySolo: goToPracticeSetup,
          onRules: () => goToRules('home'),
          onSettings: goToSettings,
        });
        mountFooter(shell, 'play');
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
          onBack: goHome,
        });
        break;
      case 'profile':
        renderProfileScreen(shell, {
          locale: state.selectedLanguage,
          authStatus: state.auth.status,
          username: state.auth.user?.username ?? null,
          avatarId: state.auth.user?.avatarId ?? null,
          authToken: state.auth.token,
          onGoToAuth: goToAuth,
          onLogout: handleLogout,
          onOpenSettings: goToSettings,
          onGoHome: goHome,
          onSelectAvatar: applyAvatarChange,
        });
        break;
      case 'auth':
        renderAuthScreen(shell, {
          locale: state.selectedLanguage,
          onAuthenticated: handleAuthenticated,
          onContinueAsGuest: goHome,
          onBack: goToProfile,
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
          playerName: getPlayerName(),
          playerAvatarUrl: getPlayerAvatarUrl(),
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
          onStopGame: () => {
            if (!state.roundState) {
              return;
            }
            const interrupted = interruptRound(state.roundState);
            if (interrupted === state.roundState) {
              return;
            }
            handleRoundEnded(interrupted);
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
          playerName: getPlayerName(),
          playerAvatarUrl: getPlayerAvatarUrl(),
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

  const goToProfile = (): void => {
    stopRoundTimer();
    state = profileState(state);
    render();
  };

  const mountFooter = (shell: HTMLElement, activeTab: 'play' | 'profile'): void => {
    shell.classList.add('app-shell--with-footer');
    shell.insertAdjacentHTML(
      'beforeend',
      renderFooterNav(activeTab, state.selectedLanguage),
    );
    bindFooterNav(shell, (screen) => {
      if (screen === 'home') {
        goHome();
        return;
      }
      goToProfile();
    });
  };

  const toAuthUser = (user: {
    id: string;
    email: string;
    username: string;
    languagePref: string;
    avatarId: string | null;
  }): AuthUser => {
    const languagePref: LanguageCode = isValidLanguageCode(user.languagePref)
      ? user.languagePref
      : DEFAULT_PRACTICE_LANGUAGE;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      languagePref,
      avatarId: user.avatarId,
    };
  };

  const applyAuthenticatedSession = (token: string, user: AuthUser): void => {
    savePersistedLanguage(user.languagePref);
    state = {
      ...state,
      selectedLanguage: user.languagePref,
      auth: {
        status: 'authenticated',
        user,
        token,
      },
    };
  };

  const applyGuestSession = (): void => {
    state = {
      ...state,
      auth: {
        status: 'guest',
        user: null,
        token: null,
      },
    };
  };

  const goToAuth = (): void => {
    stopRoundTimer();
    state = authState(state);
    render();
  };

  const handleAuthenticated = (result: AuthResponse): void => {
    saveToken(result.token);
    applyAuthenticatedSession(result.token, toAuthUser(result.user));
    goToProfile();
  };

  const handleLogout = (): void => {
    const token = state.auth.token;
    if (token) {
      void logout(token).catch(() => {
        // Fire-and-forget; local session is cleared regardless.
      });
    }
    clearToken();
    applyGuestSession();
    goToProfile();
  };

  const syncLanguagePrefIfAuthenticated = (language: LanguageCode): void => {
    if (!isAuthenticated(state) || !state.auth.token) {
      return;
    }

    const token = state.auth.token;
    void updateLanguagePref(token, language).catch((error: unknown) => {
      console.warn('[Spott] Failed to sync language preference', error);
    });
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
    syncLanguagePrefIfAuthenticated(language);
    render();
  };

  const applyAvatarChange = (avatarId: string): void => {
    if (!isAuthenticated(state) || !state.auth.user || !state.auth.token) {
      return;
    }

    const token = state.auth.token;
    state = {
      ...state,
      auth: {
        ...state.auth,
        user: { ...state.auth.user, avatarId },
      },
    };
    render();

    void updateAvatar(token, avatarId).catch((error: unknown) => {
      console.warn('[Spott] Failed to sync avatar', error);
    });
  };

  const goToReview = (): void => {
    if (!state.roundState) {
      return;
    }
    state = reviewState(state, 0);
    render();
  };

  const syncPracticeRoundIfAuthenticated = async (
    roundState: NonNullable<AppState['roundState']>,
  ): Promise<void> => {
    if (!isAuthenticated(state) || !state.auth.token) {
      return;
    }

    const token = state.auth.token;
    const stats = getRoundStats(roundState);

    try {
      await submitRound(token, {
        language: roundState.round.language,
        finalScore: stats.finalScore,
        wordsFound: stats.wordsFound,
        totalWords: stats.totalWords,
        gridsCompleted: stats.gridsCompleted,
        totalGrids: stats.totalGrids,
        remainingSeconds: stats.remainingSeconds,
        timeBonus: stats.timeBonus,
        status: roundState.round.status === 'completed' ? 'completed' : 'expired',
      });
    } catch (error: unknown) {
      console.warn('[Spott] Failed to sync practice round', error);
    }
  };

  const handleRoundEnded = (roundState: NonNullable<AppState['roundState']>): void => {
    stopRoundTimer();
    state = endState(state, roundState);
    render();
    void syncPracticeRoundIfAuthenticated(roundState);
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

  const getPlayerName = (): string =>
    state.auth.status === 'authenticated' && state.auth.user
      ? state.auth.user.username
      : t('guestPlayerLabel', state.selectedLanguage);

  const getPlayerAvatarUrl = (): string | undefined =>
    state.auth.status === 'authenticated' && state.auth.user
      ? getAvatarUrl(state.auth.user.avatarId)
      : undefined;

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

  const resolveAuthSession = async (): Promise<void> => {
    const token = getToken();
    if (!token) {
      applyGuestSession();
      render();
      return;
    }

    state = {
      ...state,
      auth: {
        status: 'loading',
        user: null,
        token,
      },
    };
    render();

    try {
      const { user } = await getMe(token);
      applyAuthenticatedSession(token, toAuthUser(user));
    } catch {
      clearToken();
      applyGuestSession();
    }

    render();
  };

  void resolveAuthSession();

  return {
    getState: () => state,
  };
}
