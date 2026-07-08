import {
  createInitialRoundState,
  createSeededRandom,
  generateRound,
  startRound,
  type LanguageCode,
  type LanguageWordSet,
  type RoundState,
} from '@spott/engine';

import { DEFAULT_PRACTICE_LANGUAGE } from '../constants.js';
import { IS_DEV } from '../env.js';
import { getLanguageLabel, tFormat, type UiLocale } from '../i18n/index.js';
import {
  normalizeRoundStartFailureReason,
  type RoundStartFailureReason,
} from './round-start-error.js';

export type StartPracticeRoundResult =
  | { success: true; roundState: RoundState }
  | { success: false; reason: RoundStartFailureReason; message: string };

export interface StartPracticeRoundOptions {
  roundId?: string;
  language?: LanguageCode;
  uiLocale?: UiLocale;
  /** Optional override for tests or future custom word sets. */
  wordSet?: LanguageWordSet;
}

export interface RoundStartFailureLogDetails {
  reason: RoundStartFailureReason;
  language: LanguageCode;
  roundId: string;
  rawReason?: unknown;
}

/** Log technical failure details during development only. */
export function logRoundStartFailureInDev(details: RoundStartFailureLogDetails): void {
  if (!IS_DEV) {
    return;
  }

  console.error('[Spott] Round generation failed', {
    reason: details.reason,
    language: details.language,
    roundId: details.roundId,
    rawReason: details.rawReason ?? details.reason,
  });
}

/** Map engine round-generation failures to localized player-friendly copy. */
export function formatRoundStartError(
  reason: RoundStartFailureReason,
  language: LanguageCode,
  uiLocale: UiLocale = language,
): string {
  const languageLabel = getLanguageLabel(language, uiLocale);

  switch (reason) {
    case 'missing-word-set':
      return tFormat('errorMissingWordSet', uiLocale, { language: languageLabel });
    case 'theme-selection-failed':
      return tFormat('errorThemeSelectionFailed', uiLocale, { language: languageLabel });
    case 'grid-generation-failed':
      return tFormat('errorGridGenerationFailed', uiLocale, { language: languageLabel });
    case 'unknown':
      return tFormat('errorUnknownFailure', uiLocale, { language: languageLabel });
  }
}

export function startPracticeRoundState(
  options: StartPracticeRoundOptions = {},
): StartPracticeRoundResult {
  const roundId = options.roundId ?? `practice-${Date.now()}`;
  const language = options.language ?? DEFAULT_PRACTICE_LANGUAGE;
  const uiLocale = options.uiLocale ?? language;
  const result = generateRound({
    id: roundId,
    language,
    wordSet: options.wordSet,
    random: createSeededRandom(Number(roundId) || 0),
  });

  if (!result.success) {
    const reason = normalizeRoundStartFailureReason(result.reason);
    logRoundStartFailureInDev({
      reason,
      language,
      roundId,
      rawReason: result.reason,
    });

    return {
      success: false,
      reason,
      message: formatRoundStartError(reason, language, uiLocale),
    };
  }

  return {
    success: true,
    roundState: startRound(createInitialRoundState(result.round), Date.now()),
  };
}
