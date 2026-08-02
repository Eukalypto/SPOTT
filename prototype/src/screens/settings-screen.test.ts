import { describe, expect, it } from 'vitest';

import { APP_VERSION } from '../constants.js';
import { t, tFormat } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { buildSettingsScreenHtml } from './settings-screen.js';

const baseOptions = {
  locale: 'en' as const,
  onBack: () => {},
};

describe('buildSettingsScreenHtml', () => {
  it('renders a placeholder, the app version, and a back action — no language controls', () => {
    const html = buildSettingsScreenHtml(baseOptions);

    expect(html).toContain(t('navSettings', 'en'));
    expect(html).toContain(t('settingsPlaceholder', 'en'));
    expect(html).toContain(
      escapeHtml(tFormat('settingsAppVersion', 'en', { version: APP_VERSION })),
    );
    expect(html).toContain(t('backToHome', 'en'));
    expect(html).toContain('data-action="back"');
    expect(html).toContain('screen-centered');
    expect(html).toContain('screen-centered__stack');

    expect(html).not.toContain('data-action="reset-language"');
    expect(html).not.toContain('language-picker');
    expect(html).not.toMatch(/name="settings-language"/);
  });

  it('localizes visible strings for French and Spanish', () => {
    const french = buildSettingsScreenHtml({ ...baseOptions, locale: 'fr' });
    const spanish = buildSettingsScreenHtml({ ...baseOptions, locale: 'es' });

    expect(french).toContain(escapeHtml(t('settingsPlaceholder', 'fr')));
    expect(french).toContain(escapeHtml(t('backToHome', 'fr')));
    expect(spanish).toContain(escapeHtml(t('settingsPlaceholder', 'es')));
    expect(spanish).toContain(escapeHtml(t('backToHome', 'es')));
  });
});
