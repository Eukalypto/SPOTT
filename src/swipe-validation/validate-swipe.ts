import { DIRECTIONS, GAME_CONFIG } from '../config/index.js';
import type { DirectionDefinition } from '../types/direction.js';
import type { Coordinate, GridData } from '../types/index.js';
import type { SwipeInvalidReason, SwipePath, SwipeValidationResult } from '../types/swipe.js';

export interface SwipeValidationConfig {
  allowOvershoot: boolean;
  directions: readonly DirectionDefinition[];
}

export const DEFAULT_SWIPE_VALIDATION_CONFIG: SwipeValidationConfig = {
  allowOvershoot: GAME_CONFIG.allowOvershoot,
  directions: DIRECTIONS,
};

/**
 * Validate a player swipe against placed words using coordinate paths.
 *
 * Only the intended forward coordinate path of an unfound word validates.
 * Duplicate text elsewhere on the grid is ignored.
 */
export function validateSwipe(
  grid: GridData,
  selectedCoordinates: Coordinate[],
  config: SwipeValidationConfig = DEFAULT_SWIPE_VALIDATION_CONFIG,
): SwipeValidationResult {
  const pathResult = validatePathGeometry(grid, selectedCoordinates, config.directions);
  if (!pathResult.ok) {
    return { isValid: false, reason: pathResult.reason };
  }

  let matchedFoundWord = false;
  let matchedReverse = false;

  for (const placedWord of grid.placedWords) {
    if (pathMatchesWordForward(selectedCoordinates, placedWord.cells, config.allowOvershoot)) {
      if (placedWord.found) {
        matchedFoundWord = true;
        continue;
      }
      return { isValid: true, wordId: placedWord.id };
    }

    if (pathMatchesWordReverse(selectedCoordinates, placedWord.cells, config.allowOvershoot)) {
      if (placedWord.found) {
        matchedFoundWord = true;
      } else {
        matchedReverse = true;
      }
    }
  }

  if (matchedFoundWord) {
    return { isValid: false, reason: 'word-already-found' };
  }

  if (matchedReverse) {
    return { isValid: false, reason: 'reverse-not-allowed' };
  }

  if (
    !config.allowOvershoot &&
    grid.placedWords.some(
      (placedWord) =>
        !placedWord.found &&
        selectedCoordinates.length !== placedWord.cells.length &&
        prefixMatchesForward(selectedCoordinates, placedWord.cells),
    )
  ) {
    return { isValid: false, reason: 'path-length-mismatch' };
  }

  return { isValid: false, reason: 'word-not-found' };
}

/** @deprecated Use {@link validateSwipe} */
export function validateSwipePath(
  grid: GridData,
  path: SwipePath,
  foundWordIds?: ReadonlySet<string>,
): SwipeValidationResult {
  const gridWithFoundState: GridData = {
    ...grid,
    placedWords: grid.placedWords.map((word) => ({
      ...word,
      found: foundWordIds?.has(word.id) ?? word.found,
    })),
  };

  return validateSwipe(gridWithFoundState, path.cells, DEFAULT_SWIPE_VALIDATION_CONFIG);
}

type PathGeometryResult = { ok: true } | { ok: false; reason: SwipeInvalidReason };

function validatePathGeometry(
  grid: GridData,
  path: Coordinate[],
  directions: readonly DirectionDefinition[],
): PathGeometryResult {
  if (path.length === 0) {
    return { ok: false, reason: 'path-not-on-grid' };
  }

  for (const cell of path) {
    if (!isInBounds(grid, cell)) {
      return { ok: false, reason: 'path-not-on-grid' };
    }
  }

  if (path.length === 1) {
    return { ok: false, reason: 'path-not-contiguous' };
  }

  const direction = getPathDirection(path, directions);
  if (!direction) {
    return { ok: false, reason: 'invalid-direction' };
  }

  for (let index = 1; index < path.length; index++) {
    const expectedRow = path[index - 1].row + direction.rowDelta;
    const expectedCol = path[index - 1].col + direction.colDelta;
    if (path[index].row !== expectedRow || path[index].col !== expectedCol) {
      return { ok: false, reason: 'path-not-contiguous' };
    }
  }

  return { ok: true };
}

function getPathDirection(
  path: Coordinate[],
  directions: readonly DirectionDefinition[],
): DirectionDefinition | null {
  const rowStep = path[1].row - path[0].row;
  const colStep = path[1].col - path[0].col;

  if (rowStep === 0 && colStep === 0) {
    return null;
  }

  const rowDelta = Math.sign(rowStep) as -1 | 0 | 1;
  const colDelta = Math.sign(colStep) as -1 | 0 | 1;
  const expectedRowDistance = rowDelta === 0 ? 0 : 1;
  const expectedColDistance = colDelta === 0 ? 0 : 1;

  if (Math.abs(rowStep) !== expectedRowDistance || Math.abs(colStep) !== expectedColDistance) {
    return null;
  }

  return (
    directions.find(
      (direction) => direction.rowDelta === rowDelta && direction.colDelta === colDelta,
    ) ?? null
  );
}

function isInBounds(grid: GridData, { row, col }: Coordinate): boolean {
  return row >= 0 && row < grid.size && col >= 0 && col < grid.size;
}

function coordinatesEqual(left: Coordinate[], right: Coordinate[]): boolean {
  return (
    left.length === right.length &&
    left.every((cell, index) => cell.row === right[index].row && cell.col === right[index].col)
  );
}

function prefixMatchesForward(path: Coordinate[], wordCells: Coordinate[]): boolean {
  if (path.length < wordCells.length) {
    return false;
  }

  return wordCells.every(
    (cell, index) => cell.row === path[index].row && cell.col === path[index].col,
  );
}

function pathMatchesWordForward(
  path: Coordinate[],
  wordCells: Coordinate[],
  allowOvershoot: boolean,
): boolean {
  if (!allowOvershoot) {
    return coordinatesEqual(path, wordCells);
  }

  return prefixMatchesForward(path, wordCells);
}

function pathMatchesWordReverse(
  path: Coordinate[],
  wordCells: Coordinate[],
  allowOvershoot: boolean,
): boolean {
  const reversed = [...wordCells].reverse();

  if (!allowOvershoot) {
    return coordinatesEqual(path, reversed);
  }

  return prefixMatchesForward(path, reversed);
}

/** @internal Exported for tests. */
export function inferDirectionFromPath(
  path: Coordinate[],
  directions: readonly DirectionDefinition[] = DIRECTIONS,
): DirectionDefinition['name'] | null {
  if (path.length < 2) {
    return null;
  }

  return getPathDirection(path, directions)?.name ?? null;
}
