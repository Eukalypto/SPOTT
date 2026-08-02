import {
  GAME_CONFIG,
  getDifficultyForGridIndex,
  GRID_MASKING_POLICIES,
} from '../config/index.js';
import { generateGrid } from '../grid-generation/index.js';
import { applyMasking } from '../masking/index.js';
import { shuffleCopy } from '../random/index.js';
import { getSampleWordSet } from '../sample-data/index.js';
import type { DifficultyTier } from '../types/difficulty.js';
import type { LanguageCode } from '../types/language.js';
import type { RoundData } from '../types/round.js';
import type { LanguageWordSet, ThemeWordSet } from '../types/word.js';

export type GenerateRoundFailureReason =
  | 'missing-word-set'
  | 'theme-selection-failed'
  | 'grid-generation-failed';

export type GenerateRoundResult =
  | { success: true; round: RoundData }
  | { success: false; reason: GenerateRoundFailureReason };

export interface GenerateRoundOptions {
  id: string;
  language?: LanguageCode;
  /** Defaults to the development sample word set for the selected language. */
  wordSet?: LanguageWordSet;
  /** Injectable RNG passed through to each grid generation call. */
  random?: () => number;
}

/**
 * Generate a complete Classic round with seven masked grids.
 */
export function generateRound(options: GenerateRoundOptions): GenerateRoundResult {
  const language = options.language ?? 'en';
  const wordSet = options.wordSet ?? getSampleWordSet(language);

  if (!wordSet) {
    return { success: false, reason: 'missing-word-set' };
  }

  if (wordSet.language !== language) {
    return { success: false, reason: 'missing-word-set' };
  }

  const random = options.random ?? Math.random;

  const themes = selectThemesForRound(wordSet, GAME_CONFIG.difficultySequence, random);
  if (!themes) {
    return { success: false, reason: 'theme-selection-failed' };
  }

  const grids = [];
  const themeIds: string[] = [];

  for (let index = 0; index < GAME_CONFIG.gridsPerRound; index++) {
    const theme = themes[index];
    const difficulty = getDifficultyForGridIndex(index);

    const gridResult = generateGrid({
      id: `${options.id}-grid-${index}`,
      index,
      themeWordSet: theme,
      difficulty,
      language,
      random,
    });

    if (!gridResult.success) {
      return { success: false, reason: 'grid-generation-failed' };
    }

    grids.push(applyMasking(gridResult.grid));
    themeIds.push(theme.themeId);
  }

  const round: RoundData = {
    id: options.id,
    language,
    status: 'pending',
    grids,
    themeIds,
    startedAtMs: null,
    expiresAtMs: null,
  };

  return { success: true, round };
}

/**
 * Select one unique theme per grid following the Classic difficulty sequence.
 *
 * Within each tier, one theme is picked at random (via the injectable RNG) from
 * the tier's remaining candidates, so replaying a round doesn't repeat the same
 * word sets while still respecting the difficulty order and never reusing a
 * theme inside the round.
 */
export function selectThemesForRound(
  wordSet: LanguageWordSet,
  difficultySequence: readonly DifficultyTier[] = GAME_CONFIG.difficultySequence,
  random: () => number = Math.random,
): ThemeWordSet[] | null {
  const usedThemeIds = new Set<string>();
  const selectedThemes: ThemeWordSet[] = [];

  for (const tier of difficultySequence) {
    const candidates = wordSet.themes
      .filter(
        (candidate) =>
          candidate.difficultyTier === tier && !usedThemeIds.has(candidate.themeId),
      )
      .sort((left, right) => left.themeId.localeCompare(right.themeId));

    if (candidates.length === 0) {
      return null;
    }

    const theme = shuffleCopy(candidates, random)[0];

    usedThemeIds.add(theme.themeId);
    selectedThemes.push(theme);
  }

  return selectedThemes;
}

/** @internal Exported for tests. */
export function expectedMaskCountsForGrid(gridIndex: number): {
  full: number;
  partial: number;
  none: number;
} {
  const policy = GRID_MASKING_POLICIES[gridIndex];
  return {
    full: policy.fullCount,
    partial: policy.partialCount,
    none: GAME_CONFIG.wordsPerGrid - policy.fullCount - policy.partialCount,
  };
}
