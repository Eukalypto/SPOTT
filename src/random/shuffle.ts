/**
 * Return a new array with elements shuffled via Fisher–Yates.
 * Uses the provided RNG in [0, 1), matching `Math.random`.
 */
export function shuffleCopy<T>(items: readonly T[], random: () => number): T[] {
  const result = items.slice();

  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index];
    result[index] = result[swapIndex];
    result[swapIndex] = current;
  }

  return result;
}
