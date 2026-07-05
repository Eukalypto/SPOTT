/** Supported puzzle languages. */
export type LanguageCode = 'en' | 'fr' | 'es';

export const LANGUAGE_CODES = ['en', 'fr', 'es'] as const satisfies readonly LanguageCode[];
