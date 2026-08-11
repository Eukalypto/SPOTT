import { WORD_LENGTH_COMPOSITION } from './game-config.js';
import type { WordLengthCompositionEntry } from './game-config.js';
import type { WordLength } from '../types/word.js';
import { WORD_LENGTHS } from '../types/word.js';

/** Available word count per length for a single theme. */
export type WordLengthCounts = Readonly<Record<WordLength, number>>;

const BASELINE: Readonly<Record<WordLength, number>> = Object.fromEntries(
  WORD_LENGTH_COMPOSITION.map(({ length, count }) => [length, count]),
) as Record<WordLength, number>;

const WORDS_PER_GRID = WORD_LENGTH_COMPOSITION.reduce((sum, entry) => sum + entry.count, 0);

/**
 * Per-grid ceiling for how many words of a single length can coexist, derived
 * empirically from the 7×7/6-direction placement geometry (src/grid-generation):
 * three or more simultaneous length-7 words, for example, always produce an
 * unavoidable overlap. These caps keep computeWordLengthComposition from
 * proposing arithmetically-valid but geometrically-impossible shapes.
 */
export const MAX_WORDS_PER_LENGTH: Readonly<Record<WordLength, number>> = {
  4: 6,
  5: 4,
  6: 3,
  7: 2,
};

const MAX_PER_LENGTH = MAX_WORDS_PER_LENGTH;

/**
 * Derive a per-theme word-length composition (fb#3e) from the words a theme
 * actually has available, instead of assuming every theme fits the standard
 * 2×4/2×5/1×6/1×7 shape.
 *
 * Rules:
 * - e1: a length with zero available words is dropped; its baseline slot(s)
 *   are redistributed to other lengths.
 * - e2: a length with only as many words as the baseline requires (no spare
 *   for variety — every game would place the identical word(s)) is merged
 *   away the same as a zero-count length, so its slot moves to a length with
 *   real variety instead of a deterministic pair/singleton.
 * - e3: redistribution is spread round-robin across every length with spare
 *   capacity (bounded by MAX_PER_LENGTH) rather than dumped into one length,
 *   so very small categories still get the best obtainable shape.
 *
 * Returns null when no composition summing to the required word count can be
 * assembled from the available words — the theme cannot produce a valid grid
 * at all, standard or otherwise, and must be excluded.
 *
 * This is a build-time tool, not a runtime one: it's a necessary but not
 * sufficient feasibility check — it only reasons about word counts, not grid
 * placement geometry. Callers must empirically validate the result by
 * attempting real grid generation (see scripts/generate-word-lists.mjs)
 * before it's ever used for live gameplay — generateGrid always uses a
 * theme's pre-validated, baked-in composition
 * (ThemeWordSet.wordLengthComposition) rather than calling this function
 * itself, so a slow-to-place or buggy shape can never reach a real round.
 */
export function computeWordLengthComposition(
  available: WordLengthCounts,
): WordLengthCompositionEntry[] | null {
  const required: Record<WordLength, number> = { ...BASELINE };
  // Lengths merged away under e2 (exactly-at-minimum, no variety) keep their
  // available count on hand as a fallback — restored under e3 if the primary
  // redistribution pass can't otherwise reach the required word count.
  const restorable: Partial<Record<WordLength, number>> = {};
  let deficit = 0;

  for (const length of WORD_LENGTHS) {
    const count = available[length] ?? 0;

    if (count < required[length]) {
      // e1: hard shortfall — use whatever's available, backfill the rest elsewhere.
      deficit += required[length] - count;
      required[length] = count;
    } else if (count === required[length]) {
      // e2: exactly at minimum, no variety — prefer to merge away, keep as a
      // restorable fallback in case nothing else can absorb the deficit.
      restorable[length] = count;
      deficit += required[length];
      required[length] = 0;
    }
    // count > required[length]: genuine surplus, left as-is and available below.
  }

  // Compared against the original baseline, not the (possibly already-zeroed)
  // mutated `required` — otherwise a length merged away by e1/e2 would look
  // like it has surplus relative to its own zeroed requirement and could be
  // handed slots back through the round-robin below instead of through the
  // deliberate e3 restore fallback.
  const surplusLengths = WORD_LENGTHS.filter((length) => (available[length] ?? 0) > BASELINE[length]);

  let roundRobinIndex = 0;
  let stalledPasses = 0;
  while (deficit > 0 && surplusLengths.length > 0 && stalledPasses < surplusLengths.length) {
    const length = surplusLengths[roundRobinIndex % surplusLengths.length];
    roundRobinIndex += 1;

    const hasCapacity =
      required[length] < MAX_PER_LENGTH[length] && required[length] < (available[length] ?? 0);
    if (hasCapacity) {
      required[length] += 1;
      deficit -= 1;
      stalledPasses = 0;
    } else {
      stalledPasses += 1;
    }
  }

  // e3: redistribution alone couldn't reach the required count (e.g. a surplus
  // length hit its placement cap) — fall back to the merged-away e2 buckets
  // even though they offer no variety, since some words beat none. Round-robin
  // rather than fill one length fully before the next — a fixed fill order
  // could exhaust the whole deficit on the first couple of lengths and leave
  // a later, equally-available length at zero for no reason.
  if (deficit > 0) {
    const restorableLengths = WORD_LENGTHS.filter((length) => restorable[length] !== undefined);
    let restoreIndex = 0;
    let restoreStalledPasses = 0;

    while (
      deficit > 0 &&
      restorableLengths.length > 0 &&
      restoreStalledPasses < restorableLengths.length
    ) {
      const length = restorableLengths[restoreIndex % restorableLengths.length];
      restoreIndex += 1;

      const max = restorable[length]!;
      if (required[length] < max) {
        required[length] += 1;
        deficit -= 1;
        restoreStalledPasses = 0;
      } else {
        restoreStalledPasses += 1;
      }
    }
  }

  if (deficit > 0) {
    return null;
  }

  const composition = WORD_LENGTHS.filter((length) => required[length] > 0).map((length) => ({
    length,
    count: required[length],
  }));

  const total = composition.reduce((sum, entry) => sum + entry.count, 0);
  if (total !== WORDS_PER_GRID) {
    return null;
  }

  return composition;
}
