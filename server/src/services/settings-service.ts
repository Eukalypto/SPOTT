import { eq } from 'drizzle-orm';

import { db } from '../db/client';
import { users } from '../db/schema';
import type { PublicUser } from '../types';
import { AuthError } from './auth-errors';

export type LanguagePref = 'en' | 'fr' | 'es';

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    languagePref: row.languagePref,
    createdAt: row.createdAt,
  };
}

export function updateLanguagePref(userId: string, language: LanguagePref): PublicUser {
  const updated = db
    .update(users)
    .set({
      languagePref: language,
      updatedAt: nowUnix(),
    })
    .where(eq(users.id, userId))
    .returning()
    .get();

  if (!updated) {
    throw new AuthError('invalid-credentials', 401);
  }

  return toPublicUser(updated);
}

export const settingsService = {
  updateLanguagePref,
};
