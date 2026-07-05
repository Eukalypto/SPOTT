import {
  GAME_CONFIG,
  getDisplayedClue,
  skipGrid,
  submitSwipe,
  tickTimer,
  type RoundState,
} from '@spott/engine';
import { describe, expect, it } from 'vitest';

import { buildClueListHtml } from './components/clue-list.js';
import { revealWordText } from './components/grid-review.js';
import { buildGaugeHtml } from './components/word-gauge.js';
import { getPlayableLanguages, PROTOTYPE_LANGUAGE } from './constants.js';
import { getGridSummaries, getRoundStats } from './utils/round-stats.js';
import { ROUND_DURATION_SECONDS } from './utils/round-timer.js';
import { startPracticeRoundState } from './utils/round-setup.js';

function swipeWord(state: RoundState, wordIndex = 0): RoundState {
  const grid = state.round.grids[state.currentGridIndex];
  const word = grid.placedWords.filter((entry) => !entry.found)[wordIndex];
  if (!word) {
    throw new Error('No unfound word available');
  }
  const result = submitSwipe(state, word.cells);
  expect(result.applied).toBe(true);
  return result.state;
}

describe('Phase 2 prototype requirements', () => {
  it('starts a Classic round with seven grids and a ninety-second timer', () => {
    const result = startPracticeRoundState({ roundId: 'requirements-classic' });
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.roundState.round.status).toBe('active');
    expect(result.roundState.round.grids).toHaveLength(GAME_CONFIG.gridsPerRound);
    expect(result.roundState.remainingSeconds).toBe(ROUND_DURATION_SECONDS);
    expect(ROUND_DURATION_SECONDS).toBe(90);
    expect(result.roundState.activeGridIndices).toHaveLength(7);
  });

  it('validates correct swipes, rejects reverse swipes, and updates score', () => {
    const started = startPracticeRoundState({ roundId: 'requirements-swipe' });
    expect(started.success).toBe(true);
    if (!started.success) {
      return;
    }

    const state = started.roundState;
    const grid = state.round.grids[state.currentGridIndex];
    const word = grid.placedWords.find((entry) => !entry.found);
    expect(word).toBeDefined();

    const initialScore = state.score.total;
    const valid = submitSwipe(state, word!.cells);
    expect(valid.applied).toBe(true);
    expect(valid.state.score.total).toBeGreaterThan(initialScore);

    const afterGrid = valid.state.round.grids[valid.state.currentGridIndex];
    const unfoundWord = afterGrid.placedWords.find((entry) => !entry.found);
    expect(unfoundWord).toBeDefined();
    const reversed = submitSwipe(valid.state, [...unfoundWord!.cells].reverse());
    expect(reversed.applied).toBe(false);
    expect(reversed.reason).toBe('reverse-not-allowed');
    expect(reversed.state.score.total).toBe(valid.state.score.total);
  });

  it('renders masked clues and updates clues and gauge after finds', () => {
    const started = startPracticeRoundState({ roundId: 'requirements-clues' });
    expect(started.success).toBe(true);
    if (!started.success) {
      return;
    }

    let state = started.roundState;
    while (state.currentGridIndex < 2) {
      state = skipGrid(state);
    }

    const grid = state.round.grids[state.currentGridIndex];
    const maskedWord = grid.placedWords.find((word) => word.maskType === 'full' && !word.found);
    expect(maskedWord).toBeDefined();

    const beforeHtml = buildClueListHtml(grid);
    expect(beforeHtml).toContain('#');
    expect(beforeHtml).not.toContain(revealWordText(maskedWord!));

    const afterState = swipeWord(state);
    const afterGrid = afterState.round.grids[afterState.currentGridIndex];
    const afterHtml = buildClueListHtml(afterGrid);
    expect(afterHtml).toContain('clue-item--found');
    expect(buildGaugeHtml(afterGrid)).toContain('gauge-notch--filled');
  });

  it('skips unfinished grids, removes completed grids, and returns skipped grids later', () => {
    const started = startPracticeRoundState({ roundId: 'requirements-skip' });
    expect(started.success).toBe(true);
    if (!started.success) {
      return;
    }

    let state = started.roundState;
    const startIndex = state.currentGridIndex;
    expect(state.activeGridIndices).toHaveLength(7);

    state = skipGrid(state);
    expect(state.currentGridIndex).not.toBe(startIndex);
    expect(state.activeGridIndices[state.activeGridIndices.length - 1]).toBe(startIndex);

    const completedGridIndex = state.currentGridIndex;
    state = completeCurrentGridViaEngine(state);
    expect(state.activeGridIndices).not.toContain(completedGridIndex);
    expect(state.activeGridIndices.length).toBeLessThan(7);

    let cycles = 0;
    const maxCycles = state.activeGridIndices.length + 1;
    while (state.currentGridIndex !== startIndex && cycles < maxCycles) {
      state = skipGrid(state);
      cycles += 1;
    }
    expect(state.currentGridIndex).toBe(startIndex);
  });

  it('ends on timeout without a time bonus and ends early with a time bonus', () => {
    const started = startPracticeRoundState({ roundId: 'requirements-timeout' });
    expect(started.success).toBe(true);
    if (!started.success) {
      return;
    }

    const expired = tickTimer(started.roundState, Date.now() + 91_000);
    expect(expired.round.status).toBe('expired');
    expect(expired.score.timeBonus).toBe(0);
    expect(expired.score.total).toBe(expired.score.wordPoints);

    const earlyStart = startPracticeRoundState({ roundId: 'requirements-complete' });
    expect(earlyStart.success).toBe(true);
    if (!earlyStart.success) {
      return;
    }

    let completed = earlyStart.roundState;
    while (completed.round.status === 'active') {
      const grid = completed.round.grids[completed.currentGridIndex];
      const word = grid.placedWords.find((entry) => !entry.found);
      if (!word) {
        completed = skipGrid(completed);
        continue;
      }
      const result = submitSwipe(completed, word.cells);
      expect(result.applied).toBe(true);
      completed = result.state;
    }

    expect(completed.round.status).toBe('completed');
    expect(completed.remainingSeconds).toBeGreaterThan(0);
    expect(completed.score.timeBonus).toBeGreaterThan(0);
    expect(completed.score.total).toBe(completed.score.wordPoints + completed.score.timeBonus);
  });

  it('builds an accurate end-of-game summary and review word reveal', () => {
    const started = startPracticeRoundState({ roundId: 'requirements-summary' });
    expect(started.success).toBe(true);
    if (!started.success) {
      return;
    }

    const state = swipeWord(started.roundState);
    const stats = getRoundStats(state);
    const summaries = getGridSummaries(state);

    expect(stats.wordsFound).toBe(1);
    expect(stats.totalWords).toBe(GAME_CONFIG.gridsPerRound * GAME_CONFIG.wordsPerGrid);
    expect(stats.totalGrids).toBe(7);
    expect(summaries).toHaveLength(7);
    expect(summaries.some((entry) => entry.wordsFound > 0)).toBe(true);

    const grid = state.round.grids[0];
    for (const word of grid.placedWords) {
      expect(revealWordText(word)).toBe(word.text.toUpperCase());
    }

    const maskedWord = grid.placedWords.find((word) => !word.found && word.maskType !== 'none');
    if (maskedWord) {
      expect(getDisplayedClue(maskedWord)).not.toBe(revealWordText(maskedWord));
    }
  });

  it('keeps language selection ready for future French and Spanish word sets', () => {
    expect(getPlayableLanguages()).toContain('en');
    expect(getPlayableLanguages()).toContain(PROTOTYPE_LANGUAGE);

    const english = startPracticeRoundState({
      roundId: 'requirements-en',
      language: 'en',
    });
    expect(english.success).toBe(true);

    const french = startPracticeRoundState({
      roundId: 'requirements-fr',
      language: 'fr',
    });
    expect(french.success).toBe(false);
    if (!french.success) {
      expect(french.reason).toBe('missing-word-set');
    }
  });
});

function completeCurrentGridViaEngine(state: RoundState): RoundState {
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
