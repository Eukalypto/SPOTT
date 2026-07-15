import express, { type Express } from 'express';

import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(authRouter);

  app.use(errorHandler);

  return app;
}
