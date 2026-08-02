import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { buildHomeScreenHtml } from './home-screen.js';

describe('buildHomeScreenHtml', () => {
  it('shows the Spott logo and primary Play Solo action', () => {
    const html = buildHomeScreenHtml({
      locale: 'en',
      selectedLanguage: 'en',
      onLanguageChange: () => {},
      onPlaySolo: () => {},
      onRules: () => {},
      onSettings: () => {},
    });

    expect(html).toContain('id="app-title"');
    expect(html).toContain(t('appTitle', 'en'));
    expect(html).toContain(t('navPlaySolo', 'en'));
    expect(html).toContain('data-action="play-solo"');
    expect(html).toContain('home-actions__primary');
  });

  it('renders secondary navigation actions', () => {
    const html = buildHomeScreenHtml({
      locale: 'en',
      selectedLanguage: 'en',
      onLanguageChange: () => {},
      onPlaySolo: () => {},
      onRules: () => {},
      onSettings: () => {},
    });

    expect(html).toContain(t('navRules', 'en'));
    expect(html).toContain(t('navSettings', 'en'));
    expect(html).toContain('data-action="rules"');
    expect(html).toContain('data-action="settings"');
  });

  it('marks challenge modes as coming soon and disabled', () => {
    const html = buildHomeScreenHtml({
      locale: 'en',
      selectedLanguage: 'en',
      onLanguageChange: () => {},
      onPlaySolo: () => {},
      onRules: () => {},
      onSettings: () => {},
    });

    expect(html).toContain(t('navChallengeRandom', 'en'));
    expect(html).toContain(t('navChallengeFriend', 'en'));
    expect(html).toContain('disabled');
    expect(html).toContain('aria-disabled="true"');
  });

  it('renders a language dropdown with the selected language chosen', () => {
    const html = buildHomeScreenHtml({
      locale: 'en',
      selectedLanguage: 'fr',
      onLanguageChange: () => {},
      onPlaySolo: () => {},
      onRules: () => {},
      onSettings: () => {},
    });

    expect(html).toContain('data-action="language"');
    expect(html).toMatch(/value="fr"[^>]*selected/);
  });
});
