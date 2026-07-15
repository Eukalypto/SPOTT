import { randomUUID } from 'node:crypto';

import { eq } from 'drizzle-orm';

import { db } from '../db/client';
import { practiceRounds, practiceStats } from '../db/schema';
import { AuthError } from './auth-errors';

export type RoundStatus = 'completed' | 'expired';

export type RoundPayload = {
  language: string;
  finalScore: number;
  wordsFound: number;
  totalWords: number;
  gridsCompleted: number;
  totalGrids: number;
  remainingSeconds: number;
  timeBonus: number;
  status: RoundStatus;
};

export type PublicPracticeStats = {
  totalGames: number;
  totalScore: number;
  bestScore: number;
  averageScore: number;
  totalWordsFound: number;
  totalGridsCompleted: number;
  lastPlayedAt: number | null;
};

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

function toPublicStats(row: typeof practiceStats.$inferSelect): PublicPracticeStats {
  return {
    totalGames: row.totalGames,
    totalScore: row.totalScore,
    bestScore: row.bestScore,
    averageScore: row.averageScore,
    totalWordsFound: row.totalWordsFound,
    totalGridsCompleted: row.totalGridsCompleted,
    lastPlayedAt: row.lastPlayedAt,
  };
}

export function getStats(userId: string): PublicPracticeStats {
  const row = db
    .select()
    .from(practiceStats)
    .where(eq(practiceStats.userId, userId))
    .get();

  if (!row) {
    throw new AuthError('invalid-credentials', 401);
  }

  return toPublicStats(row);
}

export function submitRound(userId: string, round: RoundPayload): PublicPracticeStats {
  const now = nowUnix();

  const updated = db.transaction((tx) => {
    const current = tx
      .select()
      .from(practiceStats)
      .where(eq(practiceStats.userId, userId))
      .get();

    if (!current) {
      throw new AuthError('invalid-credentials', 401);
    }

    tx.insert(practiceRounds)
      .values({
        id: randomUUID(),
        userId,
        language: round.language,
        finalScore: round.finalScore,
        wordsFound: round.wordsFound,
        totalWords: round.totalWords,
        gridsCompleted: round.gridsCompleted,
        totalGrids: round.totalGrids,
        remainingSeconds: round.remainingSeconds,
        timeBonus: round.timeBonus,
        status: round.status,
        playedAt: now,
      })
      .run();

    const totalGames = current.totalGames + 1;
    const totalScore = current.totalScore + round.finalScore;
    const bestScore = Math.max(current.bestScore, round.finalScore);
    const averageScore = totalScore / totalGames;

    return tx
      .update(practiceStats)
      .set({
        totalGames,
        totalScore,
        bestScore,
        averageScore,
        totalWordsFound: current.totalWordsFound + round.wordsFound,
        totalGridsCompleted: current.totalGridsCompleted + round.gridsCompleted,
        lastPlayedAt: now,
        updatedAt: now,
      })
      .where(eq(practiceStats.userId, userId))
      .returning()
      .get();
  });

  if (!updated) {
    throw new AuthError('invalid-credentials', 401);
  }

  return toPublicStats(updated);
}

export const practiceStatsService = {
  getStats,
  submitRound,
};
