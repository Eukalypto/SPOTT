import type { LanguageCode } from '@spott/engine';

import { EN_TRANSLATIONS, ES_TRANSLATIONS, FR_TRANSLATIONS } from './translations.js';
import {
  LANGUAGE_LABEL_KEYS,
  type TranslationDictionary,
  type TranslationKey,
  type UiLocale,
} from './types.js';

const TRANSLATIONS: Record<UiLocale, TranslationDictionary> = {
  en: EN_TRANSLATIONS,
  fr: FR_TRANSLATIONS,
  es: ES_TRANSLATIONS,
};

/** Translate a UI string for the given locale, falling back to English then the key. */
export function t(key: TranslationKey, locale: UiLocale): string {
  return TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key] ?? key;
}

/** Interpolate `{name}` placeholders in a translated string. */
export function tFormat(
  key: TranslationKey,
  locale: UiLocale,
  values: Record<string, string | number>,
): string {
  let text = t(key, locale);

  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }

  return text;
}

export function getLanguageLabel(code: LanguageCode, locale: UiLocale): string {
  return t(LANGUAGE_LABEL_KEYS[code], locale);
}

export function setDocumentLanguage(locale: UiLocale): void {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
    document.title = t('appTitle', locale);
  }
}

export { LANGUAGE_LABEL_KEYS, TRANSLATIONS };
export type { TranslationKey, UiLocale };
