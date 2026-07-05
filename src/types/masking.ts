/** How much of a target word is hidden from the player before it is found. */
export type MaskType = 'none' | 'partial' | 'full';

export const MASK_TYPES = ['none', 'partial', 'full'] as const satisfies readonly MaskType[];

/** Number of words on a grid that receive each non-none mask level. */
export interface GridMaskingPolicy {
  readonly fullCount: number;
  readonly partialCount: number;
}
