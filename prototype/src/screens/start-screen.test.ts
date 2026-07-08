import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { buildStartScreenHtml } from './start-screen.js';

describe('buildStartScreenHtml', () => {
  it('renders localized language options for English UI', () => {
    const html = buildStartScreenHtml({
      locale: 'en',
      selectedLanguage: 'en',
      onLanguageChange: () => {},
      onStartPracticeRound: () => {},
    });

    expect(html).toContain(t('languageEnglish', 'en'));
    expect(html).toContain(t('languageFrench', 'en'));
    expect(html).toContain(t('languageSpanish', 'en'));
    expect(html).toContain(t('startPracticeRound', 'en'));
    expect(html).toMatch(/value="en"[^>]*checked/);
  });

  it('updates visible UI strings when the locale is French', () => {
    const html = buildStartScreenHtml({
      locale: 'fr',
      selectedLanguage: 'fr',
      onLanguageChange: () => {},
      onStartPracticeRound: () => {},
    });

    expect(html).toContain(t('language', 'fr'));
    expect(html).toContain(escapeHtml(t('startPracticeRound', 'fr')));
    expect(html).toMatch(/value="fr"[^>]*checked/);
  });
});
