import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { buildRoundStartErrorScreenHtml } from './round-start-error-screen.js';

describe('buildRoundStartErrorScreenHtml', () => {
  it('shows a localized title, message, and recovery actions', () => {
    const message = t('errorGridGenerationFailed', 'en').replace('{language}', t('languageEnglish', 'en'));
    const html = buildRoundStartErrorScreenHtml({
      locale: 'en',
      error: { reason: 'grid-generation-failed', message },
      onTryAgain: () => {},
      onBackToStart: () => {},
    });

    expect(html).toContain(t('roundGenerationFailed', 'en'));
    expect(html).toContain(message);
    expect(html).toContain(t('tryAgain', 'en'));
    expect(html).toContain(t('backToStart', 'en'));
    expect(html).toContain('role="alert"');
    expect(html).toContain('data-action="try-again"');
    expect(html).toContain('data-action="back-to-start"');
  });
});
