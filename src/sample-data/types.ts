import type { WordLengthCompositionEntry } from '../config/game-config.js';
import type { DifficultyTier } from '../types/difficulty.js';
import type { LanguageCode } from '../types/language.js';
import type { LanguageWordSet, ThemeWordSet, WordLength } from '../types/word.js';

/** Words grouped by normalized length for a single sample theme. */
export interface SampleThemeWords {
  themeId: string;
  label: string;
  difficultyTier: DifficultyTier;
  wordsByLength: Readonly<Record<WordLength, readonly string[]>>;
  /** fb#3e: build-time-validated composition; absent means the standard shape. */
  wordLengthComposition?: readonly WordLengthCompositionEntry[];
}

/** Flatten length-grouped words into a {@link ThemeWordSet}. */
export function toThemeWordSet(theme: SampleThemeWords): ThemeWordSet {
  return {
    themeId: theme.themeId,
    label: theme.label,
    difficultyTier: theme.difficultyTier,
    words: [
      ...theme.wordsByLength[4],
      ...theme.wordsByLength[5],
      ...theme.wordsByLength[6],
      ...theme.wordsByLength[7],
    ],
    ...(theme.wordLengthComposition ? { wordLengthComposition: theme.wordLengthComposition } : {}),
  };
}

/** Build a {@link LanguageWordSet} from sample theme definitions. */
export function toLanguageWordSet(
  language: LanguageCode,
  themes: readonly SampleThemeWords[],
): LanguageWordSet {
  return {
    language,
    themes: themes.map(toThemeWordSet),
  };
}

/** Languages that have sample word sets available for development and tests. */
export type SampleWordSetLanguage = LanguageCode;

export interface SampleWordSetRegistry {
  readonly en: LanguageWordSet;
  readonly fr?: LanguageWordSet;
  readonly es?: LanguageWordSet;
}

/** Retrieve a development sample word set by language, if one exists. */
export function getSampleWordSet(
  registry: SampleWordSetRegistry,
  language: LanguageCode,
): LanguageWordSet | undefined {
  return registry[language];
}
