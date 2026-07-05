/**
 * Returns true when a **normalized** word reads the same forward and backward.
 *
 * Call {@link normalizeWord} first so language-specific rules are applied.
 * Character length is measured on that normalized string (Spanish ñ counts as one character).
 */
export function isPalindromeNormalized(normalized: string): boolean {
  if (normalized.length === 0) {
    return false;
  }

  const chars = [...normalized];
  return chars.every((char, index) => char === chars[chars.length - 1 - index]);
}
