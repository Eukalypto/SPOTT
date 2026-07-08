/**
 * Spott — core game engine (Phase 1 scaffold)
 *
 * Framework-agnostic TypeScript modules for a timed 7×7 word-search game.
 * UI layers (React Native, etc.) consume masked grids and dispatch round actions.
 */

export * from './config/index.js';
export * from './types/index.js';
export * from './normalization/index.js';
export * from './word-set-validation/index.js';
export * from './grid-generation/index.js';
export * from './duplicate-detection/index.js';
export * from './masking/index.js';
export * from './swipe-validation/index.js';
export * from './scoring/index.js';
export * from './round-state/index.js';
export * from './round-generation/index.js';
export * from './random/index.js';
export * from './sample-data/index.js';
export * from './display/index.js';
