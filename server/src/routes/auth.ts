import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../middleware/auth';
import { authService } from '../services/auth-service';

const signUpSchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(8),
});

const logInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authRouter = Router();

authRouter.post('/api/auth/signup', async (req, res, next) => {
  try {
    const body = signUpSchema.parse(req.body);
    const result = await authService.signUp(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/api/auth/login', async (req, res, next) => {
  try {
    const body = logInSchema.parse(req.body);
    const result = await authService.logIn(body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.get('/api/auth/me', requireAuth, (req, res, next) => {
  try {
    const user = authService.getMe(req.userId as string);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/api/auth/logout', (_req, res) => {
  res.status(200).json({ ok: true });
});
