import { describe, expect, it } from 'vitest';

import type { PracticeStats } from '../api/stats-api.js';
import { APP_VERSION, DEFAULT_PRACTICE_LANGUAGE, PRACTICE_LANGUAGE_NATIVE_LABELS } from '../constants.js';
import { t, tFormat } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import {
  buildSettingsScreenHtml,
  buildStatsSectionHtml,
  formatLastPlayedAt,
} from './settings-screen.js';

const baseOptions = {
  locale: 'en' as const,
  selectedLanguage: 'fr' as const,
  authStatus: 'guest' as const,
  username: null,
  authToken: null,
  onLanguageChange: () => {},
  onResetLanguage: () => {},
  onGoToAuth: () => {},
  onLogout: () => {},
  onBack: () => {},
};

const sampleStats: PracticeStats = {
  totalGames: 4,
  totalScore: 400,
  bestScore: 180,
  averageScore: 100.4,
  totalWordsFound: 22,
  totalGridsCompleted: 11,
  lastPlayedAt: 1_700_000_000,
};

describe('buildSettingsScreenHtml', () => {
  it('renders language selection, reset, version, and back actions', () => {
    const html = buildSettingsScreenHtml(baseOptions);

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
    expect(html).toContain('screen-centered');
    expect(html).toContain('screen-centered__stack');
  });

  it('shows log in / sign up for guests', () => {
    const html = buildSettingsScreenHtml(baseOptions);

    expect(html).toContain(t('authLoginSignUp', 'en'));
    expect(html).toContain('data-action="go-auth"');
    expect(html).not.toContain('data-action="logout"');
  });

  it('shows username and log out when authenticated', () => {
    const html = buildSettingsScreenHtml({
      ...baseOptions,
      authStatus: 'authenticated',
      username: 'player1',
      authToken: 'token',
    });

    expect(html).toContain(
      escapeHtml(tFormat('authSignedInAs', 'en', { username: 'player1' })),
    );
    expect(html).toContain(t('authLogOut', 'en'));
    expect(html).toContain('data-action="logout"');
    expect(html).not.toContain('data-action="go-auth"');
  });

  it('disables reset when the default language is selected', () => {
    const html = buildSettingsScreenHtml({
      ...baseOptions,
      selectedLanguage: DEFAULT_PRACTICE_LANGUAGE,
    });

    expect(html).toContain('data-action="reset-language"');
    expect(html).toContain('disabled');
  });

  it('localizes visible strings for French and Spanish', () => {
    const french = buildSettingsScreenHtml({
      ...baseOptions,
      locale: 'fr',
      selectedLanguage: 'fr',
    });
    const spanish = buildSettingsScreenHtml({
      ...baseOptions,
      locale: 'es',
      selectedLanguage: 'es',
    });

    expect(french).toContain(escapeHtml(t('settingsIntro', 'fr')));
    expect(french).toContain(t('settingsResetLanguage', 'fr'));
    expect(french).toContain(t('authLoginSignUp', 'fr'));
    expect(spanish).toContain(t('language', 'es'));
    expect(spanish).toContain(t('backToHome', 'es'));
  });
});

describe('buildStatsSectionHtml', () => {
  it('prompts guests to log in', () => {
    const html = buildStatsSectionHtml('en', { status: 'guest' });

    expect(html).toContain(t('statsSectionTitle', 'en'));
    expect(html).toContain(t('statsLoginPrompt', 'en'));
    expect(html).toContain('data-action="go-auth-stats"');
  });

  it('shows loading and error states', () => {
    expect(buildStatsSectionHtml('en', { status: 'loading' })).toContain(t('statsLoading', 'en'));

    const errorHtml = buildStatsSectionHtml('en', { status: 'error' });
    expect(errorHtml).toContain(t('statsLoadError', 'en'));
    expect(errorHtml).toContain('data-action="retry-stats"');
    expect(errorHtml).toContain(t('tryAgain', 'en'));
  });

  it('renders rounded average and formatted last played', () => {
    const html = buildStatsSectionHtml('en', { status: 'ready', stats: sampleStats });

    expect(html).toContain(t('statsTotalGames', 'en'));
    expect(html).toContain('4');
    expect(html).toContain(t('statsBestScore', 'en'));
    expect(html).toContain('180');
    expect(html).toContain(t('statsAverageScore', 'en'));
    expect(html).toContain('100');
    expect(html).toContain(t('statsTotalWordsFound', 'en'));
    expect(html).toContain('22');
    expect(html).toContain(t('statsTotalGridsCompleted', 'en'));
    expect(html).toContain('11');
    expect(html).toContain(formatLastPlayedAt(sampleStats.lastPlayedAt, 'en'));
  });

  it('shows Never when lastPlayedAt is null', () => {
    const html = buildStatsSectionHtml('en', {
      status: 'ready',
      stats: { ...sampleStats, lastPlayedAt: null },
    });

    expect(html).toContain(t('statsNever', 'en'));
  });
});
