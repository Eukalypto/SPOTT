import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  username: text('username').notNull().unique(),
  languagePref: text('language_pref').notNull().default('en'),
  avatarId: text('avatar_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const practiceStats = sqliteTable('practice_stats', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  totalGames: integer('total_games').notNull().default(0),
  totalScore: integer('total_score').notNull().default(0),
  bestScore: integer('best_score').notNull().default(0),
  averageScore: real('average_score').notNull().default(0),
  totalWordsFound: integer('total_words_found').notNull().default(0),
  totalGridsCompleted: integer('total_grids_completed').notNull().default(0),
  lastPlayedAt: integer('last_played_at'),
  updatedAt: integer('updated_at').notNull(),
});

export const practiceRounds = sqliteTable(
  'practice_rounds',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    language: text('language').notNull(),
    finalScore: integer('final_score').notNull(),
    wordsFound: integer('words_found').notNull(),
    totalWords: integer('total_words').notNull(),
    gridsCompleted: integer('grids_completed').notNull(),
    totalGrids: integer('total_grids').notNull(),
    remainingSeconds: integer('remaining_seconds').notNull(),
    timeBonus: integer('time_bonus').notNull(),
    status: text('status').notNull(),
    playedAt: integer('played_at').notNull(),
  },
  (table) => [index('practice_rounds_user_id_idx').on(table.userId)],
);

export const challenges = sqliteTable('challenges', {
  id: text('id').primaryKey(),
  status: text('status').notNull().default('pending'),
  language: text('language').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const challengePlayers = sqliteTable(
  'challenge_players',
  {
    challengeId: text('challenge_id')
      .notNull()
      .references(() => challenges.id),
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    score: integer('score'),
    joinedAt: integer('joined_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.challengeId, table.userId] }),
  ],
);
