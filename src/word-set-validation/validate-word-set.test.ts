import { describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../config/index.js';
import type { ThemeWordSet } from '../types/word.js';
import {
  isValidThemeWordSet,
  validateThemeWordSet,
} from './validate-word-set.js';

function validThemeWords(): readonly string[] {
  return ['bear', 'wolf', 'tiger', 'eagle', 'forest', 'country'];
}

function createTheme(overrides: Partial<ThemeWordSet> = {}): ThemeWordSet {
  return {
    themeId: 'theme-test',
    label: 'Test',
    difficultyTier: 'A',
    words: validThemeWords(),
    ...overrides,
  };
}

describe('validateThemeWordSet', () => {
  it('accepts a theme with the Classic length distribution', () => {
    expect(validateThemeWordSet(createTheme())).toEqual({ valid: true });
    expect(isValidThemeWordSet(createTheme())).toBe(true);
  });

  it('rejects the wrong total word count', () => {
    const result = validateThemeWordSet(createTheme({ words: validThemeWords().slice(0, 5) }));
    expect(result).toEqual({ valid: false, reason: 'wrong-word-count' });
  });

  it('rejects invalid length distribution', () => {
    const words = ['bear', 'planet', 'tiger', 'eagle', 'forest', 'country'];
    const result = validateThemeWordSet(createTheme({ words }));
    expect(result).toEqual({ valid: false, reason: 'invalid-length-distribution' });
  });

  it('rejects empty words after trimming', () => {
    const words = ['   ', ...validThemeWords().slice(1)];
    const result = validateThemeWordSet(createTheme({ words }));
    expect(result).toEqual({ valid: false, reason: 'empty-word' });
  });

  it('rejects non-alpha characters', () => {
    const words = ['be4r', ...validThemeWords().slice(1)];
    const result = validateThemeWordSet(createTheme({ words }));
    expect(result).toEqual({ valid: false, reason: 'non-alpha-characters' });
  });

  it('rejects duplicate words within a theme', () => {
    const words = ['bear', 'BEAR', 'tiger', 'eagle', 'forest', 'country'];
    const result = validateThemeWordSet(createTheme({ words }));
    expect(result).toEqual({ valid: false, reason: 'duplicate-word' });
  });

  it('requires exactly six words for Classic composition', () => {
    expect(validThemeWords()).toHaveLength(GAME_CONFIG.wordsPerGrid);
  });
});
