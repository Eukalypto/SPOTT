import type { LanguageCode } from '../types/language.js';
import type { LanguageWordSet } from '../types/word.js';
import { ENGLISH_SAMPLE_WORD_SET } from './english/index.js';
import type { SampleWordSetRegistry } from './types.js';

/**
 * Development sample word sets keyed by language.
 *
 * Register additional languages by adding entries here — no engine changes required.
 */
export const SAMPLE_WORD_SETS = {
  en: ENGLISH_SAMPLE_WORD_SET,
} as const satisfies SampleWordSetRegistry;

export function getSampleWordSet(language: LanguageCode): LanguageWordSet | undefined {
  if (language in SAMPLE_WORD_SETS) {
    return SAMPLE_WORD_SETS[language as keyof typeof SAMPLE_WORD_SETS];
  }
  return undefined;
}

export { ENGLISH_SAMPLE_THEMES, ENGLISH_SAMPLE_WORD_SET } from './english/index.js';
export { FRENCH_SAMPLE_THEMES } from './french/index.js';
export { SPANISH_SAMPLE_THEMES } from './spanish/index.js';

export {
  toLanguageWordSet,
  toThemeWordSet,
  type SampleThemeWords,
  type SampleWordSetLanguage,
  type SampleWordSetRegistry,
} from './types.js';
