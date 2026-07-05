import { describe, expect, it } from 'vitest';

import { completeCurrentGridViaEngine } from './debug-actions.js';

describe('completeCurrentGridViaEngine', () => {
  it('returns the same state when the round is not active', () => {
    const state = {
      round: { status: 'expired' },
      currentGridIndex: 0,
    } as never;

    expect(completeCurrentGridViaEngine(state)).toBe(state);
  });
});
