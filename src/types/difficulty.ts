/** Per-grid difficulty tier used for scoring and word selection. */
export type DifficultyTier = 'A' | 'B' | 'C' | 'D' | 'E';

export const DIFFICULTY_TIERS = ['A', 'B', 'C', 'D', 'E'] as const satisfies readonly DifficultyTier[];
