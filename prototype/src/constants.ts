import { getSampleWordSet, LANGUAGE_CODES, type LanguageCode } from '@spott/engine';

import { getLanguageLabel, type UiLocale } from './i18n/index.js';

/** Native endonym labels shown on the Practice setup language picker. */
export const PRACTICE_LANGUAGE_NATIVE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
};

/** Default language selection for Practice setup. */
export const DEFAULT_PRACTICE_LANGUAGE: LanguageCode = 'en';

/** Prototype app version label shown in Settings. */
export const APP_VERSION = '0.1.0';

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

/** Language options for Practice setup, always using native endonym labels. */
export function getPracticeLanguageOptions(): readonly PracticeLanguageOption[] {
  return getPlayableLanguages().map((code) => ({
    code,
    label: PRACTICE_LANGUAGE_NATIVE_LABELS[code],
  }));
}

export { WORD_HIGHLIGHT_COLORS } from './utils/word-colors.js';
