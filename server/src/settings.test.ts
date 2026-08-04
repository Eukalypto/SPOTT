import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spott-settings-'));
process.env.JWT_SECRET = 'test-jwt-secret-phase5';
process.env.PORT = '3001';
process.env.DATABASE_URL = path.join(testDir, 'settings-test.sqlite');

const { createApp } = await import('./app');
const { db } = await import('./db/client');
const { practiceRounds, practiceStats, users } = await import('./db/schema');

const app = createApp();

const signupBody = {
  email: 'settings@example.com',
  username: 'settings-user',
  password: 'password123',
};

async function signupAndToken(): Promise<string> {
  const res = await request(app).post('/api/auth/signup').send(signupBody);
  expect(res.status).toBe(201);
  return res.body.token as string;
}

describe('settings', () => {
  beforeEach(() => {
    db.delete(practiceRounds).run();
    db.delete(practiceStats).run();
    db.delete(users).run();
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('PATCH with valid language updates and returns user', async () => {
    const token = await signupAndToken();

    const res = await request(app)
      .patch('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'fr' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: 'settings@example.com',
      username: 'settings-user',
      languagePref: 'fr',
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.languagePref).toBe('fr');
  });

  it('PATCH with invalid language returns 400', async () => {
    const token = await signupAndToken();

    const res = await request(app)
      .patch('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'de' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'validation-error' });
  });

  it('PATCH without auth returns 401', async () => {
    const res = await request(app).patch('/api/settings').send({ language: 'es' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('PATCH with a valid avatarId updates and returns user', async () => {
    const token = await signupAndToken();

    const res = await request(app)
      .patch('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarId: 'Bob' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      username: 'settings-user',
      avatarId: 'Bob',
    });

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.avatarId).toBe('Bob');
  });

  it('PATCH with an unknown avatarId returns 400', async () => {
    const token = await signupAndToken();

    const res = await request(app)
      .patch('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ avatarId: 'NotARealAvatar' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'validation-error' });
  });

  it('PATCH with neither language nor avatarId returns 400', async () => {
    const token = await signupAndToken();

    const res = await request(app)
      .patch('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'validation-error' });
  });
});
