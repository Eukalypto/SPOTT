import type { GenerateRoundFailureReason } from '@spott/engine';

export type RoundStartFailureReason = GenerateRoundFailureReason | 'unknown';

export interface RoundStartError {
  reason: RoundStartFailureReason;
  message: string;
}

const KNOWN_FAILURE_REASONS = new Set<GenerateRoundFailureReason>([
  'missing-word-set',
  'theme-selection-failed',
  'grid-generation-failed',
]);

export function normalizeRoundStartFailureReason(reason: unknown): RoundStartFailureReason {
  if (typeof reason === 'string' && KNOWN_FAILURE_REASONS.has(reason as GenerateRoundFailureReason)) {
    return reason as GenerateRoundFailureReason;
  }

  return 'unknown';
}
