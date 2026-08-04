import { Router } from 'express';
import { z } from 'zod';

import { isValidAvatarId } from '../avatars';
import { requireAuth } from '../middleware/auth';
import { settingsService } from '../services/settings-service';
import type { PublicUser } from '../types';

const updateSettingsSchema = z
  .object({
    language: z.enum(['en', 'fr', 'es']).optional(),
    avatarId: z.string().refine(isValidAvatarId, { message: 'unknown avatarId' }).optional(),
  })
  .refine((body) => body.language !== undefined || body.avatarId !== undefined, {
    message: 'language or avatarId is required',
  });

export const settingsRouter = Router();

settingsRouter.patch('/api/settings', requireAuth, (req, res, next) => {
  try {
    const body = updateSettingsSchema.parse(req.body);
    const userId = req.userId as string;

    let user: PublicUser | undefined;
    if (body.language !== undefined) {
      user = settingsService.updateLanguagePref(userId, body.language);
    }
    if (body.avatarId !== undefined) {
      user = settingsService.updateAvatar(userId, body.avatarId);
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});
