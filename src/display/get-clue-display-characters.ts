/** Ligatures that expand to two normalized letters in French word sets. */
const LIGATURE_EXPANSIONS: Readonly<Record<string, string>> = {
  œ: 'oe',
  æ: 'ae',
};

/** Spanish vowel accents folded during normalization; ñ is excluded. */
const SPANISH_ACCENT_MAP: Readonly<Record<string, string>> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ü: 'u',
};

/**
 * Map one original-text character to its normalized letter(s).
 * Mirrors normalization rules without requiring a language code.
 */
function foldCharacterForAlignment(character: string): string {
  const lower = character.toLowerCase();
  const ligature = LIGATURE_EXPANSIONS[lower];
  if (ligature) {
    return ligature;
  }

  const mapped = SPANISH_ACCENT_MAP[lower] ?? lower;
  return mapped.normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Build one display character per normalized letter for partial clue masking.
 *
 * When original and normalized lengths match (typical English, Spanish ñ/accent
 * cases, and most French words), original graphemes are returned unchanged.
 * When French ligatures expand (for example cœur → coeur), later normalized
 * letters without their own original glyph fall back to the normalized letter.
 */
export function getClueDisplayCharacters(text: string, normalizedText: string): string[] {
  const graphemes = [...text.trim()];

  if (graphemes.length === normalizedText.length) {
    return graphemes;
  }

  const aligned: string[] = [];
  let graphemeIndex = 0;
  let pendingExpansion: string | null = null;

  for (const normalizedChar of normalizedText) {
    if (pendingExpansion !== null) {
      if (pendingExpansion.startsWith(normalizedChar)) {
        pendingExpansion = pendingExpansion.slice(1);
        aligned.push(normalizedChar);
        continue;
      }

      pendingExpansion = null;
    }

    if (graphemeIndex >= graphemes.length) {
      aligned.push(normalizedChar);
      continue;
    }

    const grapheme = graphemes[graphemeIndex];
    const expansion = LIGATURE_EXPANSIONS[grapheme.toLowerCase()];

    if (expansion) {
      aligned.push(grapheme);
      pendingExpansion = expansion.slice(1);
      graphemeIndex += 1;
      continue;
    }

    const folded = foldCharacterForAlignment(grapheme);
    if (folded === normalizedChar) {
      aligned.push(grapheme);
      graphemeIndex += 1;
      continue;
    }

    aligned.push(normalizedChar);
  }

  return aligned;
}
