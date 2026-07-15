import type { LanguageCode, RoundState } from '@spott/engine';

import { loadPersistedLanguage } from './utils/language-persistence.js';
import type { RoundStartError } from './utils/round-start-error.js';

export type AppScreen =
  | 'home'
  | 'practice-setup'
  | 'game'
  | 'end'
  | 'review'
  | 'rules'
  | 'settings'
  | 'profile'
  | 'auth'
  | 'round-error';

export type RulesReturnScreen = 'home' | 'practice-setup';

export type AuthStatus = 'guest' | 'authenticated' | 'loading';

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  languagePref: LanguageCode;
};

export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
};

export const DEFAULT_AUTH_STATE: AuthState = {
  status: 'guest',
  user: null,
  token: null,
};

export type SessionStats = {
  gamesPlayed: number;
  bestScore: number;
  totalScore: number;
};

export const DEFAULT_SESSION_STATS: SessionStats = {
  gamesPlayed: 0,
  bestScore: 0,
  totalScore: 0,
};

export interface AppState {
  screen: AppScreen;
  roundState: RoundState | null;
  roundStartError: RoundStartError | null;
  selectedLanguage: LanguageCode;
  reviewGridIndex: number;
  /** Screen to return to when leaving Rules. */
  rulesReturnScreen: RulesReturnScreen;
  /** Dev-only: show full words in the clue list for the current grid. */
  debugRevealWords: boolean;
  /** Dev-only: pause the round timer without ending the round. */
  timerPaused: boolean;
  auth: AuthState;
  /** In-memory session stats for the current app load (guest Profile). */
  sessionStats: SessionStats;
}

export function createInitialAppState(): AppState {
  return {
    screen: 'home',
    roundState: null,
    roundStartError: null,
    selectedLanguage: loadPersistedLanguage(),
    reviewGridIndex: 0,
    rulesReturnScreen: 'home',
    debugRevealWords: false,
    timerPaused: false,
    auth: { ...DEFAULT_AUTH_STATE },
    sessionStats: { ...DEFAULT_SESSION_STATS },
  };
}
