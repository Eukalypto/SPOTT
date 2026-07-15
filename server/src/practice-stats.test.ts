import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spott-practice-'));
process.env.JWT_SECRET = 'test-jwt-secret-phase5';
process.env.PORT = '3001';
process.env.DATABASE_URL = path.join(testDir, 'practice-test.sqlite');

const { createApp } = await import('./app');
const { db } = await import('./db/client');
const { practiceRounds, practiceStats, users } = await import('./db/schema');

const app = createApp();

const signupBody = {
  email: 'practice@example.com',
  username: 'practice-user',
  password: 'password123',
};

function roundPayload(overrides: Partial<{
  finalScore: number;
  wordsFound: number;
  gridsCompleted: number;
  status: 'completed' | 'expired';
}> = {}) {
  return {
    language: 'en' as const,
    finalScore: 100,
    wordsFound: 5,
    totalWords: 10,
    gridsCompleted: 2,
    totalGrids: 3,
    remainingSeconds: 30,
    timeBonus: 10,
    status: 'completed' as const,
    ...overrides,
  };
}

async function signupAndToken(): Promise<string> {
  const res = await request(app).post('/api/auth/signup').send(signupBody);
  expect(res.status).toBe(201);
  return res.body.token as string;
}

async function submitRound(token: string, payload: ReturnType<typeof roundPayload>) {
  return request(app)
    .post('/api/practice/rounds')
    .set('Authorization', `Bearer ${token}`)
    .send(payload);
}

describe('practice stats', () => {
  beforeEach(() => {
    db.delete(practiceRounds).run();
    db.delete(practiceStats).run();
    db.delete(users).run();
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('submit first round: stats update correctly', async () => {
    const token = await signupAndToken();
    const payload = roundPayload({ finalScore: 120 });

    const res = await submitRound(token, payload);

    expect(res.status).toBe(201);
    expect(res.body.stats).toMatchObject({
      totalGames: 1,
      totalScore: 120,
      bestScore: 120,
      averageScore: 120,
      totalWordsFound: 5,
      totalGridsCompleted: 2,
    });
    expect(res.body.stats.lastPlayedAt).toEqual(expect.any(Number));
  });

  it('submit second round with higher score: best updates', async () => {
    const token = await signupAndToken();

    await submitRound(token, roundPayload({ finalScore: 100 }));
    const res = await submitRound(token, roundPayload({ finalScore: 180 }));

    expect(res.status).toBe(201);
    expect(res.body.stats).toMatchObject({
      totalGames: 2,
      totalScore: 280,
      bestScore: 180,
      averageScore: 140,
    });
  });

  it('submit second round with lower score: best stays the same', async () => {
    const token = await signupAndToken();

    await submitRound(token, roundPayload({ finalScore: 200 }));
    const res = await submitRound(token, roundPayload({ finalScore: 90 }));

    expect(res.status).toBe(201);
    expect(res.body.stats).toMatchObject({
      totalGames: 2,
      totalScore: 290,
      bestScore: 200,
      averageScore: 145,
    });
  });

  it('average_score is correct after 3 rounds', async () => {
    const token = await signupAndToken();

    await submitRound(token, roundPayload({ finalScore: 100 }));
    await submitRound(token, roundPayload({ finalScore: 200 }));
    const res = await submitRound(token, roundPayload({ finalScore: 300 }));

    expect(res.status).toBe(201);
    expect(res.body.stats).toMatchObject({
      totalGames: 3,
      totalScore: 600,
      bestScore: 300,
      averageScore: 200,
    });
  });

  it('GET /api/practice/stats returns correct totals', async () => {
    const token = await signupAndToken();

    await submitRound(
      token,
      roundPayload({ finalScore: 150, wordsFound: 4, gridsCompleted: 1 }),
    );
    await submitRound(
      token,
      roundPayload({ finalScore: 50, wordsFound: 2, gridsCompleted: 3 }),
    );

    const res = await request(app)
      .get('/api/practice/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.stats).toMatchObject({
      totalGames: 2,
      totalScore: 200,
      bestScore: 150,
      averageScore: 100,
      totalWordsFound: 6,
      totalGridsCompleted: 4,
    });
    expect(res.body.stats.lastPlayedAt).toEqual(expect.any(Number));
  });

  it('POST without auth returns 401', async () => {
    const res = await request(app).post('/api/practice/rounds').send(roundPayload());

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('GET without auth returns 401', async () => {
    const res = await request(app).get('/api/practice/stats');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });
});
