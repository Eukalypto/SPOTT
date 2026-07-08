import { GAME_CONFIG, type RoundState } from '@spott/engine';

import { t, tFormat, type UiLocale } from '../i18n/index.js';

/** Whether the player can skip away from the current unfinished grid. */
export function canSkipGrid(roundState: RoundState): boolean {
  return roundState.round.status === 'active' && roundState.activeGridIndices.length > 1;
}

/** Absolute grid position in the round, e.g. `3/7`. */
export function getGridDisplayLabel(roundState: RoundState): string {
  return `${roundState.currentGridIndex + 1}/${GAME_CONFIG.gridsPerRound}`;
}

export function getUnfinishedGridCount(roundState: RoundState): number {
  return roundState.activeGridIndices.length;
}

export function getGridNavigationHint(roundState: RoundState, locale: UiLocale): string {
  const remaining = getUnfinishedGridCount(roundState);
  if (remaining <= 1) {
    return t('lastGrid', locale);
  }
  return tFormat('unfinishedGrids', locale, { count: remaining });
}
