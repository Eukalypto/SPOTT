import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Builds the full Spott prototype into one self-contained HTML file
 * under ../demo/spott-playable.html for phone testing (no separate JS/CSS).
 */
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  resolve: {
    alias: {
      '@spott/engine': path.resolve(__dirname, '../src/index.ts'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../demo/playable'),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
