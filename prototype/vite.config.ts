import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@spott/engine': path.resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});
