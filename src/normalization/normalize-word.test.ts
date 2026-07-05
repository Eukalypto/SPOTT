import { describe, expect, it } from 'vitest';
import { isPalindromeNormalized } from './is-palindrome-normalized.js';
import { normalizeWord } from './normalize-word.js';

describe('normalizeWord — English', () => {
  it('trims and lowercases', () => {
    expect(normalizeWord('  Hello  ', 'en')).toBe('hello');
  });

  it('removes punctuation', () => {
    expect(normalizeWord("don't!", 'en')).toBe('dont');
    expect(normalizeWord('word-search', 'en')).toBe('wordsearch');
  });

  it('removes digits and symbols', () => {
    expect(normalizeWord('abc123', 'en')).toBe('abc');
    expect(normalizeWord('@mail#', 'en')).toBe('mail');
  });

  it('strips internal whitespace and punctuation', () => {
    expect(normalizeWord('hel lo-world', 'en')).toBe('helloworld');
  });
});

describe('normalizeWord — French', () => {
  it('trims and lowercases', () => {
    expect(normalizeWord('  ÉLÈVE  ', 'fr')).toBe('eleve');
  });

  it('removes accents and diacritics', () => {
    expect(normalizeWord('fête', 'fr')).toBe('fete');
    expect(normalizeWord('garçon', 'fr')).toBe('garcon');
    expect(normalizeWord('naïve', 'fr')).toBe('naive');
  });

  it('expands common ligatures', () => {
    expect(normalizeWord('cœur', 'fr')).toBe('coeur');
    expect(normalizeWord('æsthetic', 'fr')).toBe('aesthetic');
  });

  it('removes punctuation', () => {
    expect(normalizeWord("aujourd'hui", 'fr')).toBe('aujourdhui');
  });
});

describe('normalizeWord — Spanish', () => {
  it('trims and lowercases', () => {
    expect(normalizeWord('  José  ', 'es')).toBe('jose');
  });

  it('folds acute accents and ü', () => {
    expect(normalizeWord('café', 'es')).toBe('cafe');
    expect(normalizeWord('pingüino', 'es')).toBe('pinguino');
    expect(normalizeWord('útil', 'es')).toBe('util');
  });

  it('preserves ñ as a distinct letter', () => {
    expect(normalizeWord('señor', 'es')).toBe('señor');
    expect(normalizeWord('NIÑO', 'es')).toBe('niño');
    expect(normalizeWord('señor', 'es')).not.toBe('senor');
  });

  it('removes punctuation without stripping ñ', () => {
    expect(normalizeWord('¡señor!', 'es')).toBe('señor');
  });
});

describe('isPalindromeNormalized', () => {
  it('returns false for empty strings', () => {
    expect(isPalindromeNormalized('')).toBe(false);
  });

  it('detects English palindromes after normalization', () => {
    const normalized = normalizeWord('Racecar', 'en');
    expect(isPalindromeNormalized(normalized)).toBe(true);
  });

  it('detects French palindromes after normalization', () => {
    const normalized = normalizeWord('Élèvé', 'fr');
    expect(normalized).toBe('eleve');
    expect(isPalindromeNormalized(normalized)).toBe(false);

    expect(isPalindromeNormalized(normalizeWord('Kayak', 'fr'))).toBe(true);
  });

  it('detects Spanish palindromes and counts ñ as one character', () => {
    expect(isPalindromeNormalized(normalizeWord('reconocer', 'es'))).toBe(true);
    expect(isPalindromeNormalized(normalizeWord('oñño', 'es'))).toBe(true);
    expect(isPalindromeNormalized(normalizeWord('señor', 'es'))).toBe(false);
  });

  it('uses normalized length for palindrome checks', () => {
    const withPunctuation = normalizeWord('  Ana!  ', 'en');
    expect(withPunctuation).toBe('ana');
    expect(isPalindromeNormalized(withPunctuation)).toBe(true);
  });
});

describe('normalized word length', () => {
  it('uses internal form length in English', () => {
    expect(normalizeWord("  Don't!  ", 'en').length).toBe(4);
  });

  it('uses internal form length in French with ligatures', () => {
    expect(normalizeWord('cœur', 'fr')).toBe('coeur');
    expect(normalizeWord('cœur', 'fr').length).toBe(5);
  });

  it('counts Spanish ñ as one character', () => {
    expect(normalizeWord('muñeca', 'es').length).toBe(6);
    expect(normalizeWord('muñeca', 'es')[2]).toBe('ñ');
  });
});
