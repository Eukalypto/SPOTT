import { describe, expect, it } from 'vitest';

import { tryExtendPath } from './grid-swipe.js';

describe('tryExtendPath', () => {
  it('starts a path on the first cell', () => {
    expect(tryExtendPath([], { row: 1, col: 2 })).toEqual([{ row: 1, col: 2 }]);
  });

  it('extends in a straight line', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    expect(tryExtendPath(path, { row: 0, col: 2 })).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
  });

  it('backtracks when the player reverses over the previous cell', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(tryExtendPath(path, { row: 0, col: 1 })).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
  });

  it('ignores non-contiguous jumps', () => {
    const path = [{ row: 0, col: 0 }];
    expect(tryExtendPath(path, { row: 2, col: 2 })).toEqual([{ row: 0, col: 0 }]);
  });
});
