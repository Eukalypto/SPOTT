import type { Coordinate } from './coordinate.js';

/** A contiguous path of cells selected by the player. */
export interface SwipePath {
  cells: Coordinate[];
}

export type SwipeValidationResult =
  | { isValid: true; wordId: string }
  | { isValid: false; reason: SwipeInvalidReason };

export type SwipeInvalidReason =
  | 'path-not-contiguous'
  | 'path-not-straight'
  | 'path-not-on-grid'
  | 'invalid-direction'
  | 'path-length-mismatch'
  | 'reverse-not-allowed'
  | 'word-not-found'
  | 'word-already-found'
  | 'round-not-active';
