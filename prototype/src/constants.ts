import { getSampleWordSet, LANGUAGE_CODES, type LanguageCode } from '@spott/engine';

/** Default language for the playable prototype; swap when adding localized UI. */
export const PROTOTYPE_LANGUAGE: LanguageCode = 'en';

/** Languages with registered sample word sets that can start a Classic round. */
export function getPlayableLanguages(): readonly LanguageCode[] {
  return LANGUAGE_CODES.filter((language) => getSampleWordSet(language) !== undefined);
}

export { WORD_HIGHLIGHT_COLORS } from './utils/word-colors.js';
