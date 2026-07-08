import type { LanguageCode, RoundState } from '@spott/engine';

import { loadPersistedLanguage } from './utils/language-persistence.js';
import type { RoundStartError } from './utils/round-start-error.js';

export type AppScreen = 'start' | 'game' | 'end' | 'review' | 'round-error';

export interface AppState {
  screen: AppScreen;
  roundState: RoundState | null;
  roundStartError: RoundStartError | null;
  selectedLanguage: LanguageCode;
  reviewGridIndex: number;
  /** Dev-only: show full words in the clue list for the current grid. */
  debugRevealWords: boolean;
  /** Dev-only: pause the round timer without ending the round. */
  timerPaused: boolean;
}

export function createInitialAppState(): AppState {
  return {
    screen: 'start',
    roundState: null,
    roundStartError: null,
    selectedLanguage: loadPersistedLanguage(),
    reviewGridIndex: 0,
    debugRevealWords: false,
    timerPaused: false,
  };
}
