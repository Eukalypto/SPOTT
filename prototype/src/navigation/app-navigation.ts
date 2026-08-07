import type { AppState, AppScreen } from '../types.js';

/** Screens that do not require an active round. */
export const SHELL_SCREENS = [
  'home',
  'rules',
  'settings',
  'profile',
  'auth',
  'round-error',
] as const satisfies readonly AppScreen[];

export type ShellScreen = (typeof SHELL_SCREENS)[number];

export function isShellScreen(screen: AppScreen): screen is ShellScreen {
  return (SHELL_SCREENS as readonly AppScreen[]).includes(screen);
}

export function isRoundFlowScreen(screen: AppScreen): boolean {
  return screen === 'game' || screen === 'end' || screen === 'review';
}

/** Reset round session fields while keeping the selected language. */
export function withShellScreen(state: AppState, screen: ShellScreen): AppState {
  return {
    ...state,
    screen,
    roundState: null,
    roundStartError: null,
    reviewGridIndex: 0,
    debugRevealWords: false,
    timerPaused: false,
  };
}

export function withScreen(state: AppState, screen: AppScreen): AppState {
  return {
    ...state,
    screen,
  };
}

export function homeState(state: AppState): AppState {
  return withShellScreen(state, 'home');
}

export function rulesState(state: AppState): AppState {
  return withShellScreen(state, 'rules');
}

export function settingsState(state: AppState): AppState {
  return withShellScreen(state, 'settings');
}

export function profileState(state: AppState): AppState {
  return withShellScreen(state, 'profile');
}

export function authState(state: AppState): AppState {
  return withShellScreen(state, 'auth');
}

export function reviewState(state: AppState, reviewGridIndex = 0): AppState {
  return {
    ...state,
    screen: 'review',
    reviewGridIndex,
  };
}

export function gameState(
  state: AppState,
  roundState: NonNullable<AppState['roundState']>,
): AppState {
  return {
    ...state,
    screen: 'game',
    roundState,
    roundStartError: null,
    reviewGridIndex: 0,
    debugRevealWords: false,
    timerPaused: false,
  };
}

export function endState(
  state: AppState,
  roundState: NonNullable<AppState['roundState']>,
): AppState {
  return {
    ...state,
    screen: 'end',
    roundState,
    timerPaused: false,
  };
}

export function roundErrorState(
  state: AppState,
  error: NonNullable<AppState['roundStartError']>,
): AppState {
  return {
    ...withShellScreen(state, 'round-error'),
    roundStartError: error,
  };
}
