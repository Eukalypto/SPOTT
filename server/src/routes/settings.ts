import { Router } from 'express';
import { z } from 'zod';

import { requireAuth } from '../middleware/auth';
import { settingsService } from '../services/settings-service';

const updateLanguageSchema = z.object({
  language: z.enum(['en', 'fr', 'es']),
});

export const settingsRouter = Router();

settingsRouter.patch('/api/settings', requireAuth, (req, res, next) => {
  try {
    const body = updateLanguageSchema.parse(req.body);
    const user = settingsService.updateLanguagePref(req.userId as string, body.language);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});
