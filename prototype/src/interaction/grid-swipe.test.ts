import { describe, expect, it } from 'vitest';

import { isPointInCellHitBox, tryExtendPath } from './grid-swipe.js';

describe('isPointInCellHitBox', () => {
  const rect = {
    left: 100,
    top: 100,
    right: 200,
    bottom: 200,
    width: 100,
    height: 100,
  };

  it('accepts points in the centered 75% hit box', () => {
    expect(isPointInCellHitBox(150, 150, rect)).toBe(true);
    expect(isPointInCellHitBox(112.5, 150, rect)).toBe(true);
    expect(isPointInCellHitBox(187.5, 150, rect)).toBe(true);
  });

  it('rejects points in the outer 12.5% margin', () => {
    expect(isPointInCellHitBox(105, 150, rect)).toBe(false);
    expect(isPointInCellHitBox(195, 150, rect)).toBe(false);
    expect(isPointInCellHitBox(150, 105, rect)).toBe(false);
    expect(isPointInCellHitBox(150, 195, rect)).toBe(false);
  });
});

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

  it('ignores re-entering an earlier cell without backtracking', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(tryExtendPath(path, { row: 0, col: 0 })).toEqual(path);
  });

  it('ignores duplicate coordinates when hovering the current cell', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    expect(tryExtendPath(path, { row: 0, col: 1 })).toEqual(path);
  });

  it('rejects bent paths after the direction is established', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(tryExtendPath(path, { row: 1, col: 2 })).toEqual(path);
  });

  it('ignores a skipped cell when skip tolerance is off', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    expect(tryExtendPath(path, { row: 0, col: 3 })).toEqual(path);
  });

  it('fills in one skipped cell in-direction when skip tolerance is on', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    expect(tryExtendPath(path, { row: 0, col: 3 }, { allowSkip: true })).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ]);
  });

  it('does not forgive a two-cell skip even with skip tolerance on', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    expect(tryExtendPath(path, { row: 0, col: 4 }, { allowSkip: true })).toEqual(path);
  });

  it('does not forgive an off-direction jump with skip tolerance on', () => {
    const path = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    expect(tryExtendPath(path, { row: 2, col: 1 }, { allowSkip: true })).toEqual(path);
  });
});
