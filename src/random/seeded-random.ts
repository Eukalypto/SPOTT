/**
 * Deterministic pseudo-random number generator for tests and reproducible generation.
 *
 * Returns values in the half-open interval [0, 1), matching `Math.random`.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}
