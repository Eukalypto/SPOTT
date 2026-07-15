import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../middleware/auth';
import { practiceStatsService } from '../services/practice-stats-service';

const submitRoundSchema = z.object({
  language: z.enum(['en', 'fr', 'es']),
  finalScore: z.number().int(),
  wordsFound: z.number().int().nonnegative(),
  totalWords: z.number().int().nonnegative(),
  gridsCompleted: z.number().int().nonnegative(),
  totalGrids: z.number().int().nonnegative(),
  remainingSeconds: z.number().int().nonnegative(),
  timeBonus: z.number().int().nonnegative(),
  status: z.enum(['completed', 'expired']),
});

export const practiceStatsRouter = Router();

practiceStatsRouter.post('/api/practice/rounds', requireAuth, (req, res, next) => {
  try {
    const body = submitRoundSchema.parse(req.body);
    const stats = practiceStatsService.submitRound(req.userId as string, body);
    res.status(201).json({ stats });
  } catch (err) {
    next(err);
  }
});

practiceStatsRouter.get('/api/practice/stats', requireAuth, (req, res, next) => {
  try {
    const stats = practiceStatsService.getStats(req.userId as string);
    res.status(200).json({ stats });
  } catch (err) {
    next(err);
  }
});
