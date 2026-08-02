import { describe, expect, it } from 'vitest';
import { GAME_CONFIG, ROUND_DURATION_MS } from '../config/index.js';
import { generateRound } from '../round-generation/index.js';
import { calculateTimeBonus, calculateWordScore } from '../scoring/index.js';
import type { Coordinate } from '../types/coordinate.js';
import type { GridData } from '../types/grid.js';
import type { RoundState } from '../types/round-state.js';
import {
  completeRound,
  createInitialRoundState,
  expireRound,
  interruptRound,
  skipGrid,
  startRound,
  submitSwipe,
  tickTimer,
} from './round-state-manager.js';

const START_MS = 1_000_000;

function buildRound() {
  const result = generateRound({ id: 'round-state-test', language: 'en' });
  if (!result.success) {
    throw new Error(`Round generation failed: ${result.reason}`);
  }
  return result.round;
}

function activateRound(timestampMs = START_MS): RoundState {
  return startRound(createInitialRoundState(buildRound()), timestampMs);
}

function unfoundWords(grid: GridData) {
  return grid.placedWords.filter((word) => !word.found);
}

function swipeWord(state: RoundState, coordinates: readonly Coordinate[]) {
  return submitSwipe(
    state,
    coordinates.map((coordinate) => ({ ...coordinate })),
  );
}

function findNextWordOnCurrentGrid(state: RoundState) {
  const grid = state.round.grids[state.currentGridIndex];
  const word = unfoundWords(grid)[0];
  if (!word) {
    throw new Error('No unfound words on current grid');
  }
  return swipeWord(state, word.cells);
}

function completeGridByIndex(state: RoundState, gridIndex: number): RoundState {
  let current = state;

  while (current.currentGridIndex !== gridIndex && current.activeGridIndices.includes(gridIndex)) {
    current = skipGrid(current);
  }

  while (
    current.activeGridIndices.includes(gridIndex) &&
    unfoundWords(current.round.grids[gridIndex]).length > 0
  ) {
    const word = unfoundWords(current.round.grids[gridIndex])[0];
    const result = swipeWord(current, word.cells);
    expect(result.applied).toBe(true);
    if (!result.applied) {
      break;
    }
    current = result.state;
  }

  return current;
}

function completeCurrentGrid(state: RoundState): RoundState {
  let current = state;
  while (unfoundWords(current.round.grids[current.currentGridIndex]).length > 0) {
    const result = findNextWordOnCurrentGrid(current);
    expect(result.applied).toBe(true);
    current = result.state;
  }
  return current;
}

describe('createInitialRoundState', () => {
  it('builds pending state with all grids active and empty score', () => {
    const round = buildRound();
    const state = createInitialRoundState(round);

    expect(state.round.status).toBe('pending');
    expect(state.currentGridIndex).toBe(0);
    expect(state.activeGridIndices).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(state.remainingSeconds).toBe(GAME_CONFIG.roundDurationSeconds);
    expect(state.foundWordIds.size).toBe(0);
    expect(state.score).toEqual({
      entries: [],
      wordPoints: 0,
      timeBonus: 0,
      total: 0,
    });
  });
});

describe('startRound', () => {
  it('activates the round and sets the expiry timestamp', () => {
    const state = activateRound(START_MS);

    expect(state.round.status).toBe('active');
    expect(state.round.startedAtMs).toBe(START_MS);
    expect(state.round.expiresAtMs).toBe(START_MS + ROUND_DURATION_MS);
    expect(state.remainingSeconds).toBe(GAME_CONFIG.roundDurationSeconds);
  });
});

describe('submitSwipe', () => {
  it('marks a found word with order, color, and score entry', () => {
    let state = activateRound();
    const grid = state.round.grids[state.currentGridIndex];
    const word = unfoundWords(grid)[0];

    const result = swipeWord(state, word.cells);
    expect(result.applied).toBe(true);

    if (!result.applied) {
      return;
    }

    const updatedWord = result.state.round.grids[state.currentGridIndex].placedWords.find(
      (entry) => entry.id === word.id,
    );

    expect(updatedWord?.found).toBe(true);
    expect(updatedWord?.findOrder).toBe(1);
    expect(updatedWord?.colorIndex).toBe(0);
    expect(result.state.foundWordIds.has(word.id)).toBe(true);
    expect(result.state.score.entries).toHaveLength(1);
    expect(result.state.score.entries[0]).toMatchObject({
      wordId: word.id,
      gridIndex: state.currentGridIndex,
      findOrder: 1,
      colorIndex: 0,
      points: calculateWordScore(word, 1),
    });
  });

  it('updates cumulative word score on each find', () => {
    let state = activateRound();
    const grid = state.round.grids[state.currentGridIndex];
    const [first, second] = unfoundWords(grid);

    const firstResult = swipeWord(state, first.cells);
    expect(firstResult.applied).toBe(true);
    if (!firstResult.applied) {
      return;
    }

    state = firstResult.state;
    const secondResult = swipeWord(state, second.cells);
    expect(secondResult.applied).toBe(true);
    if (!secondResult.applied) {
      return;
    }

    const firstPoints = calculateWordScore(first, 1);
    const secondPoints = calculateWordScore(second, 2);

    expect(secondResult.state.score.wordPoints).toBe(firstPoints + secondPoints);
    expect(secondResult.state.score.total).toBe(firstPoints + secondPoints);
  });
});

describe('grid completion', () => {
  it('removes a completed grid from the active loop', () => {
    let state = activateRound();
    expect(state.activeGridIndices[0]).toBe(0);
    expect(state.activeGridIndices).toContain(0);

    state = completeGridByIndex(state, 0);

    expect(state.activeGridIndices).not.toContain(0);
    expect(state.activeGridIndices[0]).toBe(1);
    expect(state.currentGridIndex).toBe(1);
    expect(state.round.status).toBe('active');
  });
});

describe('skipGrid', () => {
  it('rotates the current grid to the back without removing it', () => {
    let state = activateRound();
    const skippedIndex = state.currentGridIndex;

    state = skipGrid(state);

    expect(state.currentGridIndex).toBe(1);
    expect(state.activeGridIndices[0]).toBe(1);
    expect(state.activeGridIndices[state.activeGridIndices.length - 1]).toBe(skippedIndex);
    expect(state.activeGridIndices).toHaveLength(7);
  });

  it('returns to a skipped grid only after cycling through the others', () => {
    let state = activateRound();
    const startIndex = state.currentGridIndex;

    for (let step = 0; step < 7; step += 1) {
      state = skipGrid(state);
    }

    expect(state.currentGridIndex).toBe(startIndex);
    expect(state.activeGridIndices[0]).toBe(startIndex);
    expect(state.activeGridIndices).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('does not skip when only one grid remains', () => {
    let state = activateRound();

    for (let gridIndex = 0; gridIndex < 6; gridIndex += 1) {
      state = completeGridByIndex(state, gridIndex);
    }

    expect(state.activeGridIndices).toHaveLength(1);
    const before = state.currentGridIndex;
    const after = skipGrid(state);

    expect(after.currentGridIndex).toBe(before);
    expect(after.activeGridIndices).toEqual(state.activeGridIndices);
  });
});

describe('tickTimer', () => {
  it('decrements remaining seconds while the round is active', () => {
    let state = activateRound(START_MS);

    state = tickTimer(state, START_MS + 30_000);

    expect(state.round.status).toBe('active');
    expect(state.remainingSeconds).toBe(GAME_CONFIG.roundDurationSeconds - 30);
  });

  it('expires the round when time reaches zero', () => {
    let state = activateRound(START_MS);

    state = tickTimer(state, START_MS + ROUND_DURATION_MS);

    expect(state.round.status).toBe('expired');
    expect(state.remainingSeconds).toBe(0);
    expect(state.score.timeBonus).toBe(0);
    expect(state.score.total).toBe(state.score.wordPoints);
  });
});

describe('expireRound', () => {
  it('freezes score without a time bonus', () => {
    let state = activateRound();
    const findResult = findNextWordOnCurrentGrid(state);
    expect(findResult.applied).toBe(true);
    if (!findResult.applied) {
      return;
    }

    state = expireRound(findResult.state);

    expect(state.round.status).toBe('expired');
    expect(state.remainingSeconds).toBe(0);
    expect(state.score.timeBonus).toBe(0);
    expect(state.score.total).toBe(state.score.wordPoints);
  });
});

describe('interruptRound', () => {
  it('freezes score without a time bonus and keeps remaining time as-is', () => {
    let state = activateRound();
    const findResult = findNextWordOnCurrentGrid(state);
    expect(findResult.applied).toBe(true);
    if (!findResult.applied) {
      return;
    }

    state = tickTimer(findResult.state, START_MS + 10_000);
    const remainingBeforeInterrupt = state.remainingSeconds;
    state = interruptRound(state);

    expect(state.round.status).toBe('interrupted');
    expect(state.remainingSeconds).toBe(remainingBeforeInterrupt);
    expect(state.score.timeBonus).toBe(0);
    expect(state.score.total).toBe(state.score.wordPoints);
  });

  it('is a no-op when the round is not active', () => {
    const pending = createInitialRoundState(buildRound());
    expect(interruptRound(pending)).toBe(pending);

    const expired = expireRound(activateRound());
    expect(interruptRound(expired)).toBe(expired);
  });
});

describe('completeRound', () => {
  it('adds a time bonus when all grids finish before expiry', () => {
    let state = activateRound(START_MS);
    state = tickTimer(state, START_MS + 10_000);

    const completed = completeRound({
      ...state,
      activeGridIndices: [],
    });

    expect(completed.round.status).toBe('completed');
    expect(completed.score.timeBonus).toBe(calculateTimeBonus(completed.remainingSeconds));
    expect(completed.score.total).toBe(
      completed.score.wordPoints + completed.score.timeBonus,
    );
  });

  it('completes the full round when every grid is solved', () => {
    let state = activateRound();

    while (state.round.status === 'active') {
      if (unfoundWords(state.round.grids[state.currentGridIndex]).length === 0) {
        break;
      }
      const result = findNextWordOnCurrentGrid(state);
      expect(result.applied).toBe(true);
      if (!result.applied) {
        break;
      }
      state = result.state;
    }

    expect(state.round.status).toBe('completed');
    expect(state.activeGridIndices).toHaveLength(0);
    expect(state.foundWordIds.size).toBe(42);
    expect(state.score.timeBonus).toBe(
      calculateTimeBonus(GAME_CONFIG.roundDurationSeconds),
    );
    expect(state.score.total).toBe(state.score.wordPoints + state.score.timeBonus);
  });
});

function navigateToGrid(state: RoundState, gridIndex: number): RoundState {
  let current = state;
  while (current.currentGridIndex !== gridIndex) {
    current = skipGrid(current);
  }
  return current;
}

describe('submitSwipe edge cases', () => {
  it('rejects reverse swipes through round state', () => {
    let state = activateRound();
    const word = state.round.grids[0].placedWords[0];
    const reversePath = [...word.cells].reverse();

    const result = submitSwipe(state, reversePath);
    expect(result.applied).toBe(false);
    if (!result.applied) {
      expect(result.reason).toBe('reverse-not-allowed');
    }
  });

  it('rejects swipes when the round is expired or completed', () => {
    let state = activateRound();
    const word = state.round.grids[0].placedWords[0];

    const expired = expireRound(state);
    expect(submitSwipe(expired, word.cells)).toEqual({
      applied: false,
      state: expired,
      reason: 'round-not-active',
    });

    const completed = completeRound({
      ...state,
      activeGridIndices: [],
      remainingSeconds: 30,
    });
    expect(submitSwipe(completed, word.cells)).toEqual({
      applied: false,
      state: completed,
      reason: 'round-not-active',
    });
  });

  it('scores masked words using mask multipliers', () => {
    let state = navigateToGrid(activateRound(), 4);
    const grid = state.round.grids[4];
    const maskedWord = grid.placedWords.find((word) => word.maskType !== 'none');
    expect(maskedWord).toBeDefined();
    if (!maskedWord) {
      return;
    }

    const findOrder = grid.placedWords.filter((word) => word.found).length + 1;
    const result = swipeWord(state, maskedWord.cells);

    expect(result.applied).toBe(true);
    if (!result.applied) {
      return;
    }

    expect(result.points).toBe(calculateWordScore(maskedWord, findOrder));
    expect(result.state.score.entries.at(-1)?.points).toBe(result.points);
  });
});

describe('round lifecycle guards', () => {
  it('does not restart an already active round', () => {
    const pending = createInitialRoundState(buildRound());
    const started = startRound(pending, START_MS);
    const again = startRound(started, START_MS + 5_000);

    expect(again).toBe(started);
    expect(again.round.startedAtMs).toBe(START_MS);
  });

  it('does not skip grids when the round is inactive', () => {
    let state = expireRound(activateRound());
    expect(skipGrid(state)).toBe(state);
  });

  it('does not apply time bonus when grids remain unfinished', () => {
    const state = activateRound();
    const completed = completeRound({
      ...state,
      activeGridIndices: [0, 1, 2],
      remainingSeconds: 45,
    });

    expect(completed.score.timeBonus).toBe(0);
    expect(completed.score.total).toBe(completed.score.wordPoints);
  });

  it('is idempotent when completing or expiring twice', () => {
    let state = completeRound({
      ...activateRound(),
      activeGridIndices: [],
      remainingSeconds: 20,
    });
    const completedAgain = completeRound(state);
    expect(completedAgain).toEqual(state);

    state = expireRound(activateRound());
    const expiredAgain = expireRound(state);
    expect(expiredAgain).toEqual(state);
  });
});

describe('tickTimer edge cases', () => {
  it('rounds partial seconds up while time remains', () => {
    let state = activateRound(START_MS);
    state = tickTimer(state, START_MS + ROUND_DURATION_MS - 500);
    expect(state.remainingSeconds).toBe(1);
    expect(state.round.status).toBe('active');
  });

  it('is a no-op when the round is not active', () => {
    const expired = expireRound(activateRound(START_MS));
    expect(tickTimer(expired, START_MS + 1_000)).toBe(expired);
  });
});
