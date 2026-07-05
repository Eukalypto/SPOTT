import type { DifficultyTier } from './difficulty.js';
import type { GridMaskingPolicy } from './masking.js';
import type { PlacedWord } from './word.js';

export interface GridCell {
  letter: string;
  /** Id of the placed word that owns this cell, if any. */
  wordId: string | null;
}

export type GridMatrix = GridCell[][];

/** Fully resolved puzzle grid including placements and masking policy. */
export interface GridData {
  id: string;
  /** Zero-based index within the round (0–6). */
  index: number;
  size: number;
  themeId: string;
  themeLabel: string;
  difficulty: DifficultyTier;
  cells: GridMatrix;
  placedWords: PlacedWord[];
  maskingPolicy: GridMaskingPolicy;
}
