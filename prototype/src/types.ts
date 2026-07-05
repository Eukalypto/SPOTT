import type { RoundState } from '@spott/engine';

export type AppScreen = 'start' | 'game' | 'end' | 'review';

export interface AppState {
  screen: AppScreen;
  roundState: RoundState | null;
  errorMessage: string | null;
  reviewGridIndex: number;
}

export function createInitialAppState(): AppState {
  return {
    screen: 'start',
    roundState: null,
    errorMessage: null,
    reviewGridIndex: 0,
  };
}
