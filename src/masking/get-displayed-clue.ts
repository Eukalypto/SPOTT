import { createSeededRandom } from '../random/seeded-random.js';
import type { PlacedWord } from '../types/word.js';
import { getClueDisplayCharacters } from '../display/get-clue-display-characters.js';
import { toDisplayUpperCase } from '../display/to-display-uppercase.js';

/** Cheap string hash (djb2) used to seed a per-word deterministic random offset. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Pick where the hidden block of a partial mask starts within the word.
 * Deterministic per word id, so it doesn't shift on re-render, but varies
 * from word to word instead of always starting at position 0.
 */
function getPartialMaskOffset(word: PlacedWord, maskLength: number, hiddenCount: number): number {
  const range = maskLength - hiddenCount + 1;
  if (range <= 1) {
    return 0;
  }
  const random = createSeededRandom(hashString(word.id));
  return Math.floor(random() * range);
}

/**
 * Render the clue string shown to the player for a placed word.
 *
 * Full masks use `#` repeated for the normalized word length.
 * Partial masks hide half of the letters (rounded up) as a contiguous block at a
 * random-but-stable position within the word, keeping the rest visible using the
 * original word characters (preserving ñ and accents).
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
  const offset = getPartialMaskOffset(word, maskLength, hiddenCount);

  const before = displayChars.slice(0, offset);
  const after = displayChars.slice(offset + hiddenCount);

  return `${toDisplayUpperCase(before.join(''))}${'#'.repeat(hiddenCount)}${toDisplayUpperCase(after.join(''))}`;
}
