import type { RoundState } from '@spott/engine';

export type AppScreen = 'start' | 'game' | 'end' | 'review';

export interface AppState {
  screen: AppScreen;
  roundState: RoundState | null;
  errorMessage: string | null;
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
    errorMessage: null,
    reviewGridIndex: 0,
    debugRevealWords: false,
    timerPaused: false,
  };
}
