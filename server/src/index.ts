import { createApp } from './app';
import { PORT } from './config';
import './db/client';

const app = createApp();

app.listen(PORT, () => {
  console.log(`Spott server listening on http://localhost:${PORT}`);
});
