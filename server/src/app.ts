import express, { type Express } from 'express';

import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth';
import { practiceStatsRouter } from './routes/practice-stats';
import { settingsRouter } from './routes/settings';

export function createApp(): Express {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(authRouter);
  app.use(settingsRouter);
  app.use(practiceStatsRouter);

  app.use(errorHandler);

  return app;
}
