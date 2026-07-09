import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { buildHomeScreenHtml } from './home-screen.js';

describe('buildHomeScreenHtml', () => {
  it('shows the Spott title and primary Practice action', () => {
    const html = buildHomeScreenHtml({
      locale: 'en',
      onPractice: () => {},
      onRules: () => {},
      onSettings: () => {},
    });

    expect(html).toContain(t('appTitle', 'en'));
    expect(html).toContain('id="app-title"');
    expect(html).toContain(t('navPractice', 'en'));
    expect(html).toContain('data-action="practice"');
    expect(html).toContain('home-actions__primary');
  });

  it('renders secondary navigation actions', () => {
    const html = buildHomeScreenHtml({
      locale: 'en',
      onPractice: () => {},
      onRules: () => {},
      onSettings: () => {},
    });

    expect(html).toContain(t('navRules', 'en'));
    expect(html).toContain(t('navSettings', 'en'));
    expect(html).toContain('data-action="rules"');
    expect(html).toContain('data-action="settings"');
  });

  it('marks Challenge as coming later and disabled', () => {
    const html = buildHomeScreenHtml({
      locale: 'en',
      onPractice: () => {},
      onRules: () => {},
      onSettings: () => {},
    });

    expect(html).toContain(t('navChallengeComingLater', 'en'));
    expect(html).toContain(t('homeFutureModes', 'en'));
    expect(html).toContain('disabled');
    expect(html).toContain('aria-disabled="true"');
  });
});
