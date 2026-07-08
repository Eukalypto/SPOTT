import type { PlacedWord } from '../types/word.js';
import { getClueDisplayCharacters } from '../display/get-clue-display-characters.js';
import { toDisplayUpperCase } from '../display/to-display-uppercase.js';

/**
 * Render the clue string shown to the player for a placed word.
 *
 * Full masks use `#` repeated for the normalized word length.
 * Partial masks hide the first half of letters (rounded up), keeping the remainder
 * visible using the original word characters (preserving ñ and accents).
 */
export function getDisplayedClue(word: PlacedWord): string {
  const maskLength = word.normalizedText.length;

  if (word.found || word.maskType === 'none') {
    return toDisplayUpperCase(word.text.trim());
  }

  if (word.maskType === 'full') {
    return '#'.repeat(maskLength);
  }

  const displayChars = getClueDisplayCharacters(word.text, word.normalizedText);
  const hiddenCount = Math.ceil(maskLength / 2);
  const visible = displayChars.slice(hiddenCount);

  return `${'#'.repeat(hiddenCount)}${toDisplayUpperCase(visible.join(''))}`;
}
