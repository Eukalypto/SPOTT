import type { GridData } from '../types/grid.js';
import type { MaskType } from '../types/masking.js';
import type { PlacedWord } from '../types/word.js';

/**
 * Assign Classic clue mask types to placed words using the grid's masking policy.
 *
 * Word selection is deterministic: placed words are sorted by id, then the first
 * `fullCount` receive `full`, the next `partialCount` receive `partial`, and the
 * remainder stay `none`.
 */
export function applyMasking(grid: GridData): GridData {
  const { fullCount, partialCount } = grid.maskingPolicy;
  const maskByWordId = assignMaskTypes(grid.placedWords, fullCount, partialCount);

  return {
    ...grid,
    placedWords: grid.placedWords.map((word) => ({
      ...word,
      maskType: maskByWordId.get(word.id) ?? 'none',
    })),
  };
}

export function assignMaskTypes(
  placedWords: readonly PlacedWord[],
  fullCount: number,
  partialCount: number,
): Map<string, MaskType> {
  const sorted = [...placedWords].sort((left, right) => left.id.localeCompare(right.id));
  const maskByWordId = new Map<string, MaskType>();

  sorted.forEach((word, index) => {
    if (index < fullCount) {
      maskByWordId.set(word.id, 'full');
      return;
    }

    if (index < fullCount + partialCount) {
      maskByWordId.set(word.id, 'partial');
      return;
    }

    maskByWordId.set(word.id, 'none');
  });

  return maskByWordId;
}
