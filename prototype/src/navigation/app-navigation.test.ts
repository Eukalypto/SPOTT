import { describe, expect, it } from 'vitest';

import { createInitialAppState } from '../types.js';
import {
  gameState,
  homeState,
  practiceSetupState,
  reviewState,
  rulesState,
  settingsState,
} from './app-navigation.js';

describe('app navigation state helpers', () => {
  it('starts on the home screen', () => {
    expect(createInitialAppState().screen).toBe('home');
  });

  it('preserves selected language when returning home', () => {
    const next = homeState({
      ...createInitialAppState(),
      selectedLanguage: 'fr',
      screen: 'game',
      roundState: {} as never,
    });

    expect(next.screen).toBe('home');
    expect(next.selectedLanguage).toBe('fr');
    expect(next.roundState).toBeNull();
  });

  it('moves between shell screens without a round', () => {
    const base = { ...createInitialAppState(), selectedLanguage: 'es' as const };

    expect(practiceSetupState(base).screen).toBe('practice-setup');
    expect(rulesState(base).screen).toBe('rules');
    expect(rulesState(base, 'practice-setup').rulesReturnScreen).toBe('practice-setup');
    expect(settingsState(base).screen).toBe('settings');
  });

  it('enters and leaves round flow screens', () => {
    const roundState = { round: { status: 'active' } } as never;
    const playing = gameState(createInitialAppState(), roundState);

    expect(playing.screen).toBe('game');
    expect(playing.roundState).toBe(roundState);

    const reviewing = reviewState(playing, 2);
    expect(reviewing.screen).toBe('review');
    expect(reviewing.reviewGridIndex).toBe(2);
  });
});
