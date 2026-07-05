import type { GridData, GridCell } from '../types/index.js';

/** Player-visible view of a grid — letters only, no placement metadata. */
export interface MaskedGridView {
  id: string;
  index: number;
  themeId: string;
  themeLabel: string;
  size: number;
  /** Row-major letters; word ownership is hidden. */
  letters: string[][];
}

export interface MaskedRoundView {
  roundId: string;
  grids: MaskedGridView[];
  expiresAtMs: number | null;
}

/**
 * Strip hidden-word metadata from a grid for client display.
 * The engine retains full GridData objects internally.
 */
export function maskGrid(grid: GridData): MaskedGridView {
  return {
    id: grid.id,
    index: grid.index,
    themeId: grid.themeId,
    themeLabel: grid.themeLabel,
    size: grid.size,
    letters: grid.cells.map((row: GridCell[]) => row.map((cell) => cell.letter)),
  };
}

export function maskGrids(grids: GridData[]): MaskedGridView[] {
  return grids.map(maskGrid);
}
