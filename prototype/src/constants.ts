import { getSampleWordSet, LANGUAGE_CODES, type LanguageCode } from '@spott/engine';

import { getLanguageLabel, type UiLocale } from './i18n/index.js';

/** Default language selection on the start screen. */
export const DEFAULT_PRACTICE_LANGUAGE: LanguageCode = 'en';

/** @deprecated Use {@link DEFAULT_PRACTICE_LANGUAGE}. */
export const PROTOTYPE_LANGUAGE = DEFAULT_PRACTICE_LANGUAGE;

export interface PracticeLanguageOption {
  code: LanguageCode;
  label: string;
}

/** Languages with registered sample word sets that can start a Classic round. */
export function getPlayableLanguages(): readonly LanguageCode[] {
  return LANGUAGE_CODES.filter((language) => getSampleWordSet(language) !== undefined);
}

export function getPlayableLanguageOptions(locale: UiLocale): readonly PracticeLanguageOption[] {
  return getPlayableLanguages().map((code) => ({
    code,
    label: getLanguageLabel(code, locale),
  }));
}

export { WORD_HIGHLIGHT_COLORS } from './utils/word-colors.js';
