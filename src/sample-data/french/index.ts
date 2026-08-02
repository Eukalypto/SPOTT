import { toLanguageWordSet } from '../types.js';
import { FRENCH_WORD_LIST_THEMES } from './word-lists.js';

/** Classic French word set, generated from the designer-provided category lists. */
export const FRENCH_SAMPLE_WORD_SET = toLanguageWordSet('fr', FRENCH_WORD_LIST_THEMES);

export { FRENCH_WORD_LIST_THEMES } from './word-lists.js';
/** @deprecated Tiny fixture kept only for grid-generation algorithm tests; not the app's word source. */
export { FRENCH_SAMPLE_THEMES } from './themes.js';
