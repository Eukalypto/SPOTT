export interface WordScoreEntry {
  wordId: string;
  gridIndex: number;
  findOrder: number;
  colorIndex: number;
  points: number;
}

export interface RoundScore {
  entries: WordScoreEntry[];
  wordPoints: number;
  timeBonus: number;
  total: number;
}
