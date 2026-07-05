import type { LanguageCode } from './language.js';
import type { GridData } from './grid.js';

export type RoundStatus = 'pending' | 'active' | 'completed' | 'expired';

/** Immutable round payload produced at setup time. */
export interface RoundData {
  id: string;
  language: LanguageCode;
  status: RoundStatus;
  grids: GridData[];
  /** Theme ids assigned to each grid (unique within the round). */
  themeIds: readonly string[];
  startedAtMs: number | null;
  expiresAtMs: number | null;
}
