import { describe, expect, it } from 'vitest';

import { getClueDisplayCharacters } from './get-clue-display-characters.js';
import { toDisplayUpperCase } from './to-display-uppercase.js';

describe('toDisplayUpperCase', () => {
  it('uppercases English letters', () => {
    expect(toDisplayUpperCase('lion')).toBe('LION');
  });

  it('preserves Spanish ñ as Ñ', () => {
    expect(toDisplayUpperCase('ñ')).toBe('Ñ');
    expect(toDisplayUpperCase('señor')).toBe('SEÑOR');
    expect(toDisplayUpperCase('niño')).toBe('NIÑO');
  });

  it('preserves French accents in player-facing words', () => {
    expect(toDisplayUpperCase('fête')).toBe('FÊTE');
    expect(toDisplayUpperCase('Forêt')).toBe('FORÊT');
  });
});

describe('getClueDisplayCharacters', () => {
  it('returns original graphemes when lengths already match', () => {
    expect(getClueDisplayCharacters('señor', 'señor')).toEqual(['s', 'e', 'ñ', 'o', 'r']);
    expect(getClueDisplayCharacters('fête', 'fete')).toEqual(['f', 'ê', 't', 'e']);
    expect(getClueDisplayCharacters('lion', 'lion')).toEqual(['l', 'i', 'o', 'n']);
  });

  it('aligns French ligatures to normalized length', () => {
    expect(getClueDisplayCharacters('cœur', 'coeur')).toEqual(['c', 'œ', 'e', 'u', 'r']);
  });

  it('does not convert Spanish ñ to n', () => {
    const aligned = getClueDisplayCharacters('montaña', 'montaña');
    expect(aligned[5]).toBe('ñ');
    expect(aligned.join('')).toBe('montaña');
  });
});
