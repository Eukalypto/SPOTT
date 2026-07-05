import { GAME_CONFIG, ROUND_DURATION_MS } from '../config/index.js';
import { getDifficultyForGridIndex, getGridMaskingPolicy } from '../config/index.js';
import {
  calculateFinalScore,
  calculateTimeBonus,
  calculateWordScore,
} from '../scoring/index.js';
import { validateSwipe } from '../swipe-validation/index.js';
import type { Coordinate } from '../types/coordinate.js';
import type { GridData } from '../types/grid.js';
import type { RoundData } from '../types/round.js';
import { createEmptyRoundScore } from '../types/round-state.js';
import type { RoundState } from '../types/round-state.js';
import type { SwipeInvalidReason } from '../types/swipe.js';

export type SubmitSwipeResult =
  | { applied: true; state: RoundState; wordId: string; points: number }
  | { applied: false; state: RoundState; reason: SwipeInvalidReason | 'round-not-active' };

export function createInitialRoundState(round: RoundData): RoundState {
  return {
    round: {
      ...round,
      status: round.status === 'pending' ? 'pending' : round.status,
    },
    currentGridIndex: 0,
    activeGridIndices: round.grids.map((_, index) => index),
    remainingSeconds: GAME_CONFIG.roundDurationSeconds,
    foundWordIds: new Set<string>(),
    score: createEmptyRoundScore(),
  };
}

export function startRound(state: RoundState, timestampMs: number): RoundState {
  if (state.round.status !== 'pending') {
    return state;
  }

  const expiresAtMs = timestampMs + ROUND_DURATION_MS;

  return {
    ...state,
    remainingSeconds: GAME_CONFIG.roundDurationSeconds,
    round: {
      ...state.round,
      status: 'active',
      startedAtMs: timestampMs,
      expiresAtMs,
    },
  };
}

export function submitSwipe(
  state: RoundState,
  selectedCoordinates: Coordinate[],
): SubmitSwipeResult {
  if (state.round.status !== 'active') {
    return { applied: false, state, reason: 'round-not-active' };
  }

  const grid = state.round.grids[state.currentGridIndex];
  const swipeResult = validateSwipe(grid, selectedCoordinates);

  if (!swipeResult.isValid) {
    return { applied: false, state, reason: swipeResult.reason };
  }

  const placedWord = grid.placedWords.find((word) => word.id === swipeResult.wordId);
  if (!placedWord) {
    return { applied: false, state, reason: 'word-not-found' };
  }

  const findOrder = grid.placedWords.filter((word) => word.found).length + 1;
  const colorIndex = findOrder - 1;
  const points = calculateWordScore(placedWord, findOrder);

  const updatedGrids = state.round.grids.map((entry, index) =>
    index === state.currentGridIndex ? markWordFound(entry, swipeResult.wordId, findOrder, colorIndex) : entry,
  );

  const foundWordIds = new Set(state.foundWordIds);
  foundWordIds.add(swipeResult.wordId);

  const wordPoints = state.score.wordPoints + points;
  let nextState: RoundState = {
    ...state,
    round: {
      ...state.round,
      grids: updatedGrids,
    },
    foundWordIds,
    score: {
      entries: [
        ...state.score.entries,
        {
          wordId: swipeResult.wordId,
          gridIndex: state.currentGridIndex,
          findOrder,
          colorIndex,
          points,
        },
      ],
      wordPoints,
      timeBonus: state.score.timeBonus,
      total: wordPoints,
    },
  };

  const updatedGrid = updatedGrids[state.currentGridIndex];
  if (isGridComplete(updatedGrid)) {
    nextState = removeCompletedGrid(nextState, state.currentGridIndex);

    if (nextState.activeGridIndices.length === 0) {
      nextState = completeRound(nextState);
    }
  }

  return {
    applied: true,
    state: nextState,
    wordId: swipeResult.wordId,
    points,
  };
}

export function skipGrid(state: RoundState): RoundState {
  if (state.round.status !== 'active' || state.activeGridIndices.length <= 1) {
    return state;
  }

  const [current, ...rest] = state.activeGridIndices;
  const activeGridIndices = [...rest, current];

  return {
    ...state,
    activeGridIndices,
    currentGridIndex: activeGridIndices[0],
  };
}

export function tickTimer(state: RoundState, currentTimestampMs: number): RoundState {
  if (state.round.status !== 'active' || state.round.expiresAtMs === null) {
    return state;
  }

  const remainingMs = Math.max(0, state.round.expiresAtMs - currentTimestampMs);
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  if (remainingSeconds <= 0) {
    return expireRound({
      ...state,
      remainingSeconds: 0,
    });
  }

  return {
    ...state,
    remainingSeconds,
  };
}

export function completeRound(state: RoundState): RoundState {
  if (state.round.status === 'completed') {
    return state;
  }

  const timeBonus =
    state.activeGridIndices.length === 0 && state.remainingSeconds > 0
      ? calculateTimeBonus(state.remainingSeconds)
      : 0;

  return {
    ...state,
    round: {
      ...state.round,
      status: 'completed',
    },
    score: {
      ...state.score,
      timeBonus,
      total: calculateFinalScore(state.score.wordPoints, timeBonus),
    },
  };
}

export function expireRound(state: RoundState): RoundState {
  if (state.round.status === 'expired' || state.round.status === 'completed') {
    return state;
  }

  return {
    ...state,
    remainingSeconds: 0,
    round: {
      ...state.round,
      status: 'expired',
    },
    score: {
      ...state.score,
      timeBonus: 0,
      total: state.score.wordPoints,
    },
  };
}

function markWordFound(
  grid: GridData,
  wordId: string,
  findOrder: number,
  colorIndex: number,
): GridData {
  return {
    ...grid,
    placedWords: grid.placedWords.map((word) =>
      word.id === wordId
        ? {
            ...word,
            found: true,
            findOrder,
            colorIndex,
          }
        : word,
    ),
  };
}

function isGridComplete(grid: GridData): boolean {
  return grid.placedWords.every((word) => word.found);
}

function removeCompletedGrid(state: RoundState, completedGridIndex: number): RoundState {
  const activeGridIndices = state.activeGridIndices.filter(
    (index) => index !== completedGridIndex,
  );

  return {
    ...state,
    activeGridIndices,
    currentGridIndex: activeGridIndices[0] ?? state.currentGridIndex,
  };
}

/** @deprecated Use {@link createInitialRoundState} */
export function createRoundState(options: {
  id: string;
  language: RoundData['language'];
  themeIds: readonly string[];
  grids: GridData[];
}): RoundState {
  return createInitialRoundState({
    id: options.id,
    language: options.language,
    status: 'pending',
    grids: options.grids,
    themeIds: options.themeIds,
    startedAtMs: null,
    expiresAtMs: null,
  });
}

export function difficultyForGridIndex(index: number) {
  return getDifficultyForGridIndex(index);
}

export function maskingPolicyForGridIndex(index: number) {
  return getGridMaskingPolicy(index);
}

export type { RoundState };
