import { toLanguageWordSet } from '../types.js';
import { ENGLISH_WORD_LIST_THEMES } from './word-lists.js';

/** Classic English word set, generated from the designer-provided category lists. */
export const ENGLISH_SAMPLE_WORD_SET = toLanguageWordSet('en', ENGLISH_WORD_LIST_THEMES);

export { ENGLISH_WORD_LIST_THEMES } from './word-lists.js';
/** @deprecated Tiny fixture kept only for grid-generation algorithm tests; not the app's word source. */
export { ENGLISH_SAMPLE_THEMES } from './themes.js';
