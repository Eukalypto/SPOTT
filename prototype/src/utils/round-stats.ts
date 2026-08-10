import { GAME_CONFIG, getMaskScoreMultiplier, type RoundState } from '@spott/engine';

export interface RoundStats {
  finalScore: number;
  wordsFound: number;
  totalWords: number;
  gridsCompleted: number;
  totalGrids: number;
  remainingSeconds: number;
  timeBonus: number;
}

export interface GridSummary {
  gridNumber: number;
  themeLabel: string;
  wordsFound: number;
  totalWords: number;
  completed: boolean;
}

export function getRoundStats(roundState: RoundState): RoundStats {
  const gridSummaries = getGridSummaries(roundState);

  return {
    finalScore: roundState.score.total,
    wordsFound: roundState.foundWordIds.size,
    totalWords: gridSummaries.reduce((count, grid) => count + grid.totalWords, 0),
    gridsCompleted: gridSummaries.filter((grid) => grid.completed).length,
    totalGrids: GAME_CONFIG.gridsPerRound,
    remainingSeconds: roundState.remainingSeconds,
    timeBonus: roundState.score.timeBonus,
  };
}

export function getGridSummaries(roundState: RoundState): GridSummary[] {
  return roundState.round.grids.map((grid, index) => {
    const wordsFound = grid.placedWords.filter((word) => word.found).length;

    return {
      gridNumber: index + 1,
      themeLabel: grid.themeLabel,
      wordsFound,
      totalWords: grid.placedWords.length,
      completed: wordsFound === grid.placedWords.length,
    };
  });
}

/** Time bonus is shown only after a fully completed round with bonus points earned. */
export function shouldShowTimeBonus(roundState: RoundState): boolean {
  return roundState.round.status === 'completed' && roundState.score.timeBonus > 0;
}

/**
 * The highest base score (no time bonus) this round could have produced if
 * every word had been found in the optimal order (fb#3d).
 *
 * Per grid, a word's score is `length x findOrder x maskMultiplier`. By the
 * rearrangement inequality, summing products of two sequences is maximized
 * by pairing them in the same sorted order — so the word with the smallest
 * (length x maskMultiplier) should get findOrder 1, the largest gets the
 * grid's last findOrder. In practice that means finding the longest and
 * most-hidden words last, matching how a skilled player would actually play.
 */
export function getOptimalScore(roundState: RoundState): number {
  return roundState.round.grids.reduce((total, grid) => {
    const weights = grid.placedWords
      .map((word) => word.length * getMaskScoreMultiplier(word.maskType))
      .sort((a, b) => a - b);

    const gridScore = weights.reduce((sum, weight, index) => sum + weight * (index + 1), 0);
    return total + gridScore;
  }, 0);
}
