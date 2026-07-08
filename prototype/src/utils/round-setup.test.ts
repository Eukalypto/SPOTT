import { GAME_CONFIG } from '@spott/engine';
import { describe, expect, it, vi } from 'vitest';

import { getLanguageLabel, t } from '../i18n/index.js';
import {
  formatRoundStartError,
  logRoundStartFailureInDev,
  startPracticeRoundState,
} from './round-setup.js';
import type { RoundStartFailureReason } from './round-start-error.js';
import { normalizeRoundStartFailureReason } from './round-start-error.js';

describe('round start error helpers', () => {
  it('normalizes unknown engine reasons', () => {
    expect(normalizeRoundStartFailureReason('grid-generation-failed')).toBe('grid-generation-failed');
    expect(normalizeRoundStartFailureReason('unexpected')).toBe('unknown');
    expect(normalizeRoundStartFailureReason(undefined)).toBe('unknown');
  });
});

describe('round setup', () => {
  it('starts Classic rounds for English, French, and Spanish', () => {
    for (const language of ['en', 'fr', 'es'] as const) {
      const result = startPracticeRoundState({
        roundId: `round-setup-${language}`,
        language,
        uiLocale: language,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.roundState.round.language).toBe(language);
        expect(result.roundState.round.grids).toHaveLength(GAME_CONFIG.gridsPerRound);
      }
    }
  });

  it.each([
    'missing-word-set',
    'theme-selection-failed',
    'grid-generation-failed',
    'unknown',
  ] as const satisfies readonly RoundStartFailureReason[])(
    'maps %s to localized user-facing messages in every UI locale',
    (reason) => {
      for (const uiLocale of ['en', 'fr', 'es'] as const) {
        const message = formatRoundStartError(reason, uiLocale, uiLocale);

        expect(message.length).toBeGreaterThan(10);
        expect(message).toContain(getLanguageLabel(uiLocale, uiLocale));
        expect(message).not.toContain(reason);
      }
    },
  );

  it('returns localized messages for generation failures', () => {
    expect(formatRoundStartError('missing-word-set', 'fr', 'fr')).toContain(
      t('languageFrench', 'fr'),
    );
    expect(formatRoundStartError('theme-selection-failed', 'es', 'es')).toContain(
      t('languageSpanish', 'es'),
    );
    expect(formatRoundStartError('grid-generation-failed', 'en', 'en')).toContain(
      t('languageEnglish', 'en'),
    );
    expect(formatRoundStartError('unknown', 'en', 'en')).toContain(t('languageEnglish', 'en'));
  });

  it('returns a friendly failure without throwing for an invalid word set', () => {
    const result = startPracticeRoundState({
      language: 'en',
      uiLocale: 'en',
      wordSet: { language: 'en', themes: [] },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('theme-selection-failed');
      expect(result.message).toContain(t('languageEnglish', 'en'));
      expect(result.message).not.toContain('theme-selection-failed');
    }
  });

  it('logs technical details in development mode only', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logRoundStartFailureInDev({
      reason: 'grid-generation-failed',
      language: 'en',
      roundId: 'practice-test',
      rawReason: 'grid-generation-failed',
    });

    if (import.meta.env.DEV) {
      expect(errorSpy).toHaveBeenCalledWith('[Spott] Round generation failed', {
        reason: 'grid-generation-failed',
        language: 'en',
        roundId: 'practice-test',
        rawReason: 'grid-generation-failed',
      });
    } else {
      expect(errorSpy).not.toHaveBeenCalled();
    }

    errorSpy.mockRestore();
  });
});
