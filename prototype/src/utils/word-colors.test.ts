import { describe, expect, it } from 'vitest';

import { getWordHighlightColor, getWordHighlightTextColor } from './word-colors.js';

describe('getWordHighlightTextColor', () => {
  it('returns readable text colors for each palette index', () => {
    for (let index = 0; index < 6; index += 1) {
      expect(['#1a1a1a', '#ffffff']).toContain(getWordHighlightTextColor(index));
    }
  });

  it('returns light text on dark highlight colors', () => {
    expect(getWordHighlightTextColor(0)).toBe('#ffffff');
    expect(getWordHighlightTextColor(1)).toBe('#ffffff');
  });
});

describe('word highlight palette', () => {
  it('uses the updated gold tone for index 3', () => {
    expect(getWordHighlightColor(3)).toBe('#d4a017');
  });
});
