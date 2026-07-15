import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { AuthError } from '../services/auth-errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AuthError) {
    res.status(err.status).json({ error: err.code });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'validation-error' });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal Server Error';
  console.error(err);
  res.status(500).json({ error: message });
};
