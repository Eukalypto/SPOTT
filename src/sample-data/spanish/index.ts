import type { SampleThemeWords } from '../types.js';
import { toLanguageWordSet } from '../types.js';
import { ENGLISH_WORD_LIST_THEMES } from '../english/word-lists.js';

/**
 * Spanish Classic word set: reuses the English category lists for now, per the
 * design brief ("For the Spanish, use the English words for the moment").
 * Swap this for real Spanish word lists once they're provided.
 */
export const SPANISH_WORD_LIST_THEMES: readonly SampleThemeWords[] = ENGLISH_WORD_LIST_THEMES.map(
  (theme) => ({
    ...theme,
    themeId: theme.themeId.replace(/^en-/, 'es-'),
  }),
);

export const SPANISH_SAMPLE_WORD_SET = toLanguageWordSet('es', SPANISH_WORD_LIST_THEMES);
