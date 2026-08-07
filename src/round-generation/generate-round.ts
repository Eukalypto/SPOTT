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
  /**
   * Theme ids to avoid when a tier has another untried candidate (fb#13: widen
   * category variety across rounds). Ignored per-tier once it would otherwise
   * leave no candidate, so round generation never fails because of it.
   */
  recentlyPlayedThemeIds?: ReadonlySet<string> | readonly string[];
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
  const recentlyPlayedThemeIds = new Set(options.recentlyPlayedThemeIds ?? []);

  const themes = selectThemesForRound(
    wordSet,
    GAME_CONFIG.difficultySequence,
    random,
    recentlyPlayedThemeIds,
  );
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
 * theme inside the round. Candidates in `recentlyPlayedThemeIds` are preferred
 * against (fb#13), but only when the tier has another option — a tier never
 * fails selection just because every remaining candidate was played recently.
 */
export function selectThemesForRound(
  wordSet: LanguageWordSet,
  difficultySequence: readonly DifficultyTier[] = GAME_CONFIG.difficultySequence,
  random: () => number = Math.random,
  recentlyPlayedThemeIds: ReadonlySet<string> = new Set(),
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

    const freshCandidates = candidates.filter(
      (candidate) => !recentlyPlayedThemeIds.has(candidate.themeId),
    );
    const pool = freshCandidates.length > 0 ? freshCandidates : candidates;

    const theme = shuffleCopy(pool, random)[0];

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
