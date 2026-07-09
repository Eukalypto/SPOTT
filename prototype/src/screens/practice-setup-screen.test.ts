import { describe, expect, it } from 'vitest';

import { PRACTICE_LANGUAGE_NATIVE_LABELS } from '../constants.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { buildPracticeSetupScreenHtml } from './practice-setup-screen.js';

describe('buildPracticeSetupScreenHtml', () => {
  it('renders native language options and Classic Practice description', () => {
    const html = buildPracticeSetupScreenHtml({
      locale: 'en',
      selectedLanguage: 'en',
      onLanguageChange: () => {},
      onStartPracticeRound: () => {},
      onRules: () => {},
      onBack: () => {},
    });

    expect(html).toContain(PRACTICE_LANGUAGE_NATIVE_LABELS.en);
    expect(html).toContain(PRACTICE_LANGUAGE_NATIVE_LABELS.fr);
    expect(html).toContain(PRACTICE_LANGUAGE_NATIVE_LABELS.es);
    expect(html).toContain('Français');
    expect(html).toContain('Español');
    expect(html).toContain(escapeHtml(t('practiceClassicDescription', 'en')));
    expect(html).toContain(t('startPracticeRound', 'en'));
    expect(html).toMatch(/value="en"[^>]*checked/);
    expect(html).toContain('data-action="start"');
    expect(html).toContain('data-action="back"');
    expect(html).toContain('data-action="rules"');
    expect(html).toContain(t('navRules', 'en'));
    expect(html).toContain('screen-centered');
    expect(html).toContain('screen-centered__stack');
  });

  it('updates visible UI strings when the locale is French', () => {
    const html = buildPracticeSetupScreenHtml({
      locale: 'fr',
      selectedLanguage: 'fr',
      onLanguageChange: () => {},
      onStartPracticeRound: () => {},
      onRules: () => {},
      onBack: () => {},
    });

    expect(html).toContain(t('language', 'fr'));
    expect(html).toContain(escapeHtml(t('practiceClassicDescription', 'fr')));
    expect(html).toContain(escapeHtml(t('startPracticeRound', 'fr')));
    expect(html).toContain(escapeHtml(t('backToHome', 'fr')));
    expect(html).toMatch(/value="fr"[^>]*checked/);
  });
});
