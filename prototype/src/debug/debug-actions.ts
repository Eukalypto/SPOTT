import { submitSwipe, type RoundState } from '@spott/engine';

/** Apply engine swipes until every word on the current grid is found. */
export function completeCurrentGridViaEngine(state: RoundState): RoundState {
  if (state.round.status !== 'active') {
    return state;
  }

  const targetGridIndex = state.currentGridIndex;
  let nextState = state;

  while (
    nextState.round.status === 'active' &&
    nextState.currentGridIndex === targetGridIndex
  ) {
    const grid = nextState.round.grids[targetGridIndex];
    const nextWord = grid.placedWords.find((word) => !word.found);
    if (!nextWord) {
      break;
    }

    const result = submitSwipe(nextState, nextWord.cells);
    if (!result.applied) {
      break;
    }
    nextState = result.state;
  }

  return nextState;
}

export function serializeRoundStateForLog(state: RoundState): Record<string, unknown> {
  return {
    round: {
      ...state.round,
      grids: state.round.grids.map((grid) => ({
        ...grid,
        placedWords: grid.placedWords.map((word) => ({ ...word })),
      })),
    },
    currentGridIndex: state.currentGridIndex,
    activeGridIndices: [...state.activeGridIndices],
    remainingSeconds: state.remainingSeconds,
    foundWordIds: [...state.foundWordIds],
    score: { ...state.score, entries: [...state.score.entries] },
  };
}

export function logRoundState(state: RoundState): void {
  console.group('[Spott debug] RoundState');
  console.log(serializeRoundStateForLog(state));
  console.groupEnd();
}
