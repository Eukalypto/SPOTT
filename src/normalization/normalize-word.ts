import type { LanguageCode } from '../types/language.js';

const ENGLISH_LETTERS = /[^a-z]/g;
const FRENCH_LETTERS = /[^a-z]/g;
const SPANISH_LETTERS = /[^a-zñ]/g;

/** Acute vowels and diaeresis mapped to base letters; ñ is intentionally excluded. */
const SPANISH_ACCENT_MAP: Readonly<Record<string, string>> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
  ü: 'u',
};

/**
 * Produce the canonical internal form of a word for comparison, lookup, and length checks.
 *
 * All languages: trim whitespace and lowercase first.
 */
export function normalizeWord(word: string, language: LanguageCode): string {
  switch (language) {
    case 'en':
      return normalizeEnglish(word);
    case 'fr':
      return normalizeFrench(word);
    case 'es':
      return normalizeSpanish(word);
  }
}

function normalizeEnglish(word: string): string {
  return word.trim().toLowerCase().replace(ENGLISH_LETTERS, '');
}

function normalizeFrench(word: string): string {
  const lowercased = word.trim().toLowerCase();
  const ligaturesExpanded = lowercased
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');
  const withoutDiacritics = stripCombiningMarks(ligaturesExpanded);
  return withoutDiacritics.replace(FRENCH_LETTERS, '');
}

/**
 * Spanish normalization keeps ñ as a distinct letter.
 *
 * Acute accents (á é í ó ú) and ü are folded to their base vowel for internal comparison.
 * ñ is never converted to n — Spanish word identity treats it as its own character.
 * If accent-insensitive ñ handling is needed later, change this module explicitly rather
 * than relying on generic diacritic stripping.
 */
function normalizeSpanish(word: string): string {
  const lowercased = word.trim().toLowerCase();
  const withoutMappedAccents = [...lowercased]
    .map((char) => SPANISH_ACCENT_MAP[char] ?? char)
    .join('');
  return withoutMappedAccents.replace(SPANISH_LETTERS, '');
}

function stripCombiningMarks(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '');
}
