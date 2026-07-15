import type { LanguageCode } from '@spott/engine';

import { apiRequest } from './client.js';

export type RoundStatus = 'completed' | 'expired';

export type SubmitRoundPayload = {
  language: LanguageCode;
  finalScore: number;
  wordsFound: number;
  totalWords: number;
  gridsCompleted: number;
  totalGrids: number;
  remainingSeconds: number;
  timeBonus: number;
  status: RoundStatus;
};

export type PracticeStats = {
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  totalWordsFound: number;
  totalGridsCompleted: number;
  lastPlayedAt: number | null;
};

export function submitRound(
  token: string,
  payload: SubmitRoundPayload,
): Promise<{ stats: PracticeStats }> {
  return apiRequest<{ stats: PracticeStats }>('POST', '/practice/rounds', payload, token);
}

export function getStats(token: string): Promise<{ stats: PracticeStats }> {
  return apiRequest<{ stats: PracticeStats }>('GET', '/practice/stats', undefined, token);
}
