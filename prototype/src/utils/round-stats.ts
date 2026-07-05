import { GAME_CONFIG, type RoundState } from '@spott/engine';

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
