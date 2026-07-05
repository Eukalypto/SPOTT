import { DIRECTIONS } from '../config/index.js';
import type { DirectionDefinition, DirectionName } from '../types/direction.js';
import type { Coordinate } from '../types/coordinate.js';
import type { GridData } from '../types/grid.js';
import type { PlacedWord, WordLength } from '../types/word.js';

export interface TargetWordOccurrence {
  normalizedText: string;
  direction: DirectionName;
  start: Coordinate;
  cells: Coordinate[];
}

export interface DuplicateTargetDetail {
  normalizedText: string;
  count: number;
  occurrences: TargetWordOccurrence[];
}

export interface TargetWordDuplicateReport {
  isValid: boolean;
  /** Occurrence count per target normalized text. */
  countsByTarget: Readonly<Record<string, number>>;
  /** Targets whose occurrence count is not exactly one. */
  duplicateTargets: DuplicateTargetDetail[];
}

const TARGET_LENGTHS: WordLength[] = [4, 5, 6, 7];

/**
 * Scan a filled grid for target-word occurrences along all configured directions.
 *
 * Uses each placed word's {@link PlacedWord.normalizedText} as the comparison key,
 * so English, French, and Spanish rules stay consistent with normalization.
 */
export function detectTargetWordDuplicates(
  grid: GridData,
  directions: readonly DirectionDefinition[] = DIRECTIONS,
): TargetWordDuplicateReport {
  const targetTexts = grid.placedWords.map((word) => word.normalizedText);
  const targetSet = new Set(targetTexts);
  const occurrencesByTarget = new Map<string, TargetWordOccurrence[]>();

  for (const normalizedText of targetSet) {
    occurrencesByTarget.set(normalizedText, []);
  }

  for (const direction of directions) {
    for (const length of TARGET_LENGTHS) {
      for (const occurrence of scanDirection(grid, direction, length)) {
        if (!targetSet.has(occurrence.normalizedText)) {
          continue;
        }
        occurrencesByTarget.get(occurrence.normalizedText)?.push(occurrence);
      }
    }
  }

  const countsByTarget: Record<string, number> = {};
  const duplicateTargets: DuplicateTargetDetail[] = [];

  for (const normalizedText of targetTexts) {
    const occurrences = occurrencesByTarget.get(normalizedText) ?? [];
    countsByTarget[normalizedText] = occurrences.length;

    if (occurrences.length !== 1) {
      duplicateTargets.push({
        normalizedText,
        count: occurrences.length,
        occurrences,
      });
    }
  }

  return {
    isValid: duplicateTargets.length === 0,
    countsByTarget,
    duplicateTargets,
  };
}

export function hasUniqueTargetWordOccurrences(
  grid: GridData,
  directions: readonly DirectionDefinition[] = DIRECTIONS,
): boolean {
  return detectTargetWordDuplicates(grid, directions).isValid;
}

function scanDirection(
  grid: GridData,
  direction: DirectionDefinition,
  length: number,
): TargetWordOccurrence[] {
  const occurrences: TargetWordOccurrence[] = [];
  const size = grid.size;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cells = buildCellPath({ row, col }, direction, length, size);
      if (!cells) {
        continue;
      }

      const normalizedText = cells
        .map(({ row: cellRow, col: cellCol }) =>
          readNormalizedLetter(grid.cells[cellRow][cellCol].letter),
        )
        .join('');

      occurrences.push({
        normalizedText,
        direction: direction.name,
        start: { row, col },
        cells,
      });
    }
  }

  return occurrences;
}

function buildCellPath(
  start: Coordinate,
  direction: DirectionDefinition,
  length: number,
  gridSize: number,
): Coordinate[] | null {
  const cells: Coordinate[] = [];

  for (let step = 0; step < length; step++) {
    const row = start.row + step * direction.rowDelta;
    const col = start.col + step * direction.colDelta;

    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
      return null;
    }

    cells.push({ row, col });
  }

  return cells;
}

function readNormalizedLetter(letter: string): string {
  return letter.toLowerCase();
}

/** Returns true when a swipe path exactly matches a placed word path (forward or reverse). */
export function pathMatchesPlacedWord(path: Coordinate[], placedWord: PlacedWord): boolean {
  if (path.length !== placedWord.cells.length) {
    return false;
  }

  const forward = placedWord.cells.every(
    (cell, index) => cell.row === path[index].row && cell.col === path[index].col,
  );
  if (forward) {
    return true;
  }

  return placedWord.cells.every((_, index) => {
    const reversed = placedWord.cells[placedWord.cells.length - 1 - index];
    return reversed.row === path[index].row && reversed.col === path[index].col;
  });
}
