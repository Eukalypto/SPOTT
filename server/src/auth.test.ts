import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spott-auth-'));
process.env.JWT_SECRET = 'test-jwt-secret-phase5';
process.env.PORT = '3001';
process.env.DATABASE_URL = path.join(testDir, 'auth-test.sqlite');

const { createApp } = await import('./app');
const { db } = await import('./db/client');
const { practiceStats, users } = await import('./db/schema');

const app = createApp();

const signupBody = {
  email: 'Player@Example.com',
  username: 'player1',
  password: 'password123',
};

describe('auth', () => {
  beforeAll(() => {
    expect(fs.existsSync(process.env.DATABASE_URL!)).toBe(true);
  });

  beforeEach(() => {
    db.delete(practiceStats).run();
    db.delete(users).run();
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('signUp creates user + stats row', async () => {
    const res = await request(app).post('/api/auth/signup').send(signupBody);

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: 'player@example.com',
      username: 'player1',
      languagePref: 'en',
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.user).not.toHaveProperty('password_hash');

    const userRow = db
      .select()
      .from(users)
      .where(eq(users.email, 'player@example.com'))
      .get();
    expect(userRow).toBeTruthy();
    expect(userRow?.passwordHash).not.toBe(signupBody.password);

    const statsRow = db
      .select()
      .from(practiceStats)
      .where(eq(practiceStats.userId, userRow!.id))
      .get();
    expect(statsRow).toMatchObject({
      totalGames: 0,
      totalScore: 0,
      bestScore: 0,
      averageScore: 0,
    });
  });

  it('duplicate email returns 409', async () => {
    await request(app).post('/api/auth/signup').send(signupBody);

    const res = await request(app).post('/api/auth/signup').send({
      ...signupBody,
      username: 'other-user',
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'email-taken' });
  });

  it('duplicate username returns 409', async () => {
    await request(app).post('/api/auth/signup').send(signupBody);

    const res = await request(app).post('/api/auth/signup').send({
      ...signupBody,
      email: 'other@example.com',
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'username-taken' });
  });

  it('login with correct password returns token', async () => {
    await request(app).post('/api/auth/signup').send(signupBody);

    const res = await request(app).post('/api/auth/login').send({
      email: 'player@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({
      email: 'player@example.com',
      username: 'player1',
    });
  });

  it('login with wrong password returns 401', async () => {
    await request(app).post('/api/auth/signup').send(signupBody);

    const res = await request(app).post('/api/auth/login').send({
      email: 'player@example.com',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'invalid-credentials' });
  });

  it('GET /api/auth/me with valid token returns user', async () => {
    const signup = await request(app).post('/api/auth/signup').send(signupBody);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signup.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: signup.body.user.id,
      email: 'player@example.com',
      username: 'player1',
      languagePref: 'en',
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('GET /api/auth/me with no token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });
});
