import { describe, expect, it } from 'vitest';

import { APP_VERSION, DEFAULT_PRACTICE_LANGUAGE, PRACTICE_LANGUAGE_NATIVE_LABELS } from '../constants.js';
import { t, tFormat } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { buildSettingsScreenHtml } from './settings-screen.js';

describe('buildSettingsScreenHtml', () => {
  it('renders language selection, reset, version, and back actions', () => {
    const html = buildSettingsScreenHtml({
      locale: 'en',
      selectedLanguage: 'fr',
      onLanguageChange: () => {},
      onResetLanguage: () => {},
      onBack: () => {},
    });

    expect(html).toContain(t('navSettings', 'en'));
    expect(html).toContain(t('settingsIntro', 'en'));
    expect(html).toContain(t('settingsLanguageHelp', 'en'));
    expect(html).toContain(PRACTICE_LANGUAGE_NATIVE_LABELS.en);
    expect(html).toContain(PRACTICE_LANGUAGE_NATIVE_LABELS.fr);
    expect(html).toContain(PRACTICE_LANGUAGE_NATIVE_LABELS.es);
    expect(html).toContain(t('settingsResetLanguage', 'en'));
    expect(html).toContain(
      escapeHtml(tFormat('settingsAppVersion', 'en', { version: APP_VERSION })),
    );
    expect(html).toContain(t('backToHome', 'en'));
    expect(html).toContain('data-action="back"');
    expect(html).toContain('data-action="reset-language"');
    expect(html).toMatch(/value="fr"[^>]*checked/);
  });

  it('disables reset when the default language is selected', () => {
    const html = buildSettingsScreenHtml({
      locale: 'en',
      selectedLanguage: DEFAULT_PRACTICE_LANGUAGE,
      onLanguageChange: () => {},
      onResetLanguage: () => {},
      onBack: () => {},
    });

    expect(html).toContain('data-action="reset-language"');
    expect(html).toContain('disabled');
  });

  it('localizes visible strings for French and Spanish', () => {
    const french = buildSettingsScreenHtml({
      locale: 'fr',
      selectedLanguage: 'fr',
      onLanguageChange: () => {},
      onResetLanguage: () => {},
      onBack: () => {},
    });
    const spanish = buildSettingsScreenHtml({
      locale: 'es',
      selectedLanguage: 'es',
      onLanguageChange: () => {},
      onResetLanguage: () => {},
      onBack: () => {},
    });

    expect(french).toContain(escapeHtml(t('settingsIntro', 'fr')));
    expect(french).toContain(t('settingsResetLanguage', 'fr'));
    expect(spanish).toContain(t('language', 'es'));
    expect(spanish).toContain(t('backToHome', 'es'));
  });
});
