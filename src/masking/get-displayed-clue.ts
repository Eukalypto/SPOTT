import type { PlacedWord } from '../types/word.js';

/**
 * Render the clue string shown to the player for a placed word.
 *
 * Full masks use `#` repeated for the normalized word length.
 * Partial masks hide the first half of letters (rounded up), keeping the remainder
 * visible using the original word characters (preserving ñ and accents).
 */
export function getDisplayedClue(word: PlacedWord): string {
  const displayChars = [...word.text];
  const maskLength = word.normalizedText.length;

  if (word.found || word.maskType === 'none') {
    return displayChars.join('').toUpperCase();
  }

  if (word.maskType === 'full') {
    return '#'.repeat(maskLength);
  }

  const hiddenCount = Math.ceil(maskLength / 2);
  const visible = displayChars.slice(hiddenCount);

  return `${'#'.repeat(hiddenCount)}${visible.join('').toUpperCase()}`;
}
