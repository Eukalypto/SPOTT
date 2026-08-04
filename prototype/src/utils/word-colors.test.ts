import { describe, expect, it } from 'vitest';

import { getWordHighlightColor, getWordHighlightTextColor } from './word-colors.js';

describe('getWordHighlightTextColor', () => {
  it('returns readable text colors for each palette index', () => {
    for (let index = 0; index < 6; index += 1) {
      expect(['#1a1a1a', '#ffffff']).toContain(getWordHighlightTextColor(index));
    }
  });

  it('returns light text on the red highlight and dark text on the bright blue one', () => {
    expect(getWordHighlightTextColor(0)).toBe('#ffffff');
    expect(getWordHighlightTextColor(1)).toBe('#1a1a1a');
  });
});

describe('word highlight palette', () => {
  it('matches the Illustrator socket/gauge library order (red, orange, yellow, green, blue, purple)', () => {
    expect(getWordHighlightColor(0)).toBe('#fd5827');
    expect(getWordHighlightColor(1)).toBe('#ffae00');
    expect(getWordHighlightColor(2)).toBe('#fff43d');
    expect(getWordHighlightColor(3)).toBe('#93df1f');
    expect(getWordHighlightColor(4)).toBe('#49dbff');
    expect(getWordHighlightColor(5)).toBe('#b149f2');
  });
});
