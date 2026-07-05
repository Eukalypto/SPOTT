import type { Coordinate } from '../types/index.js';
import type { PlacedWord } from '../types/index.js';

export interface OverlapReport {
  hasOverlap: boolean;
  /** Pairs of placement indices that share at least one cell. */
  overlappingPairs: Array<[number, number]>;
}

function coordinateKey({ row, col }: Coordinate): string {
  return `${row},${col}`;
}

/**
 * Detect whether any two placed words share a grid cell.
 */
export function detectOverlaps(placedWords: PlacedWord[]): OverlapReport {
  const cellOwners = new Map<string, number[]>();

  placedWords.forEach((placedWord, index) => {
    for (const cell of placedWord.cells) {
      const key = coordinateKey(cell);
      const owners = cellOwners.get(key) ?? [];
      owners.push(index);
      cellOwners.set(key, owners);
    }
  });

  const overlappingPairs: Array<[number, number]> = [];
  const seenPairs = new Set<string>();

  for (const owners of cellOwners.values()) {
    if (owners.length < 2) continue;
    for (let i = 0; i < owners.length; i++) {
      for (let j = i + 1; j < owners.length; j++) {
        const a = Math.min(owners[i], owners[j]);
        const b = Math.max(owners[i], owners[j]);
        const pairKey = `${a}:${b}`;
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          overlappingPairs.push([a, b]);
        }
      }
    }
  }

  return {
    hasOverlap: overlappingPairs.length > 0,
    overlappingPairs,
  };
}

export function hasOverlappingPlacements(placedWords: PlacedWord[]): boolean {
  return detectOverlaps(placedWords).hasOverlap;
}
