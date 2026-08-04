import { randomUUID } from 'node:crypto';

import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

import { JWT_SECRET } from '../config';
import { db } from '../db/client';
import { practiceStats, users } from '../db/schema';
import type { AuthSuccess, PublicUser } from '../types';
import { AuthError } from './auth-errors';

const BCRYPT_COST = 12;
const TOKEN_EXPIRY = '60m';

function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

function toPublicUser(row: typeof users.$inferSelect): PublicUser {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    languagePref: row.languagePref,
    avatarId: row.avatarId,
    createdAt: row.createdAt,
  };
}

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export async function signUp(input: {
  email: string;
  username: string;
  password: string;
}): Promise<AuthSuccess> {
  const email = input.email.toLowerCase();
  const username = input.username;

  const existingEmail = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();
  if (existingEmail) {
    throw new AuthError('email-taken', 409);
  }

  const existingUsername = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .get();
  if (existingUsername) {
    throw new AuthError('username-taken', 409);
  }

  const id = randomUUID();
  const now = nowUnix();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  db.transaction((tx) => {
    tx.insert(users)
      .values({
        id,
        email,
        passwordHash,
        username,
        languagePref: 'en',
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.insert(practiceStats)
      .values({
        userId: id,
        updatedAt: now,
      })
      .run();
  });

  const user = db.select().from(users).where(eq(users.id, id)).get();
  if (!user) {
    throw new Error('Failed to create user');
  }

  return {
    user: toPublicUser(user),
    token: signToken(user.id),
  };
}

export async function logIn(input: {
  email: string;
  password: string;
}): Promise<AuthSuccess> {
  const email = input.email.toLowerCase();
  const user = db.select().from(users).where(eq(users.email, email)).get();

  if (!user) {
    throw new AuthError('invalid-credentials', 401);
  }

  const matches = await bcrypt.compare(input.password, user.passwordHash);
  if (!matches) {
    throw new AuthError('invalid-credentials', 401);
  }

  return {
    user: toPublicUser(user),
    token: signToken(user.id),
  };
}

export function getMe(userId: string): PublicUser {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    throw new AuthError('invalid-credentials', 401);
  }
  return toPublicUser(user);
}

export const authService = {
  signUp,
  logIn,
  getMe,
};
