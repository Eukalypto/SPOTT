import {
  createInitialRoundState,
  createSeededRandom,
  generateRound,
  startRound,
  type LanguageCode,
  type RoundState,
} from '@spott/engine';

import { PROTOTYPE_LANGUAGE } from '../constants.js';

export type StartPracticeRoundResult =
  | { success: true; roundState: RoundState }
  | { success: false; reason: string };

export interface StartPracticeRoundOptions {
  roundId?: string;
  language?: LanguageCode;
}

export function startPracticeRoundState(
  options: StartPracticeRoundOptions = {},
): StartPracticeRoundResult {
  const roundId = options.roundId ?? `practice-${Date.now()}`;
  const language = options.language ?? PROTOTYPE_LANGUAGE;
  const result = generateRound({
    id: roundId,
    language,
    random: createSeededRandom(Number(roundId) || 0),
  });

  if (!result.success) {
    return { success: false, reason: result.reason };
  }

  return {
    success: true,
    roundState: startRound(createInitialRoundState(result.round), Date.now()),
  };
}
