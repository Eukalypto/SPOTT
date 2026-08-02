import { APP_VERSION } from '../constants.js';
import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export interface SettingsScreenOptions {
  locale: UiLocale;
  onBack: () => void;
}

export function buildSettingsScreenHtml(options: SettingsScreenOptions): string {
  return `
    <section class="screen screen--settings screen-centered" aria-labelledby="settings-title">
      <div class="screen-centered__stack">
        <header class="screen-header">
          <button type="button" class="text-button screen-header__back" data-action="back">
            ${escapeHtml(t('backToHome', options.locale))}
          </button>
          <h2 id="settings-title" class="screen-header__title">${escapeHtml(t('navSettings', options.locale))}</h2>
        </header>

        <div class="settings-panel">
          <p class="settings-panel__intro">${escapeHtml(t('settingsPlaceholder', options.locale))}</p>
          <p class="settings-panel__version">${escapeHtml(tFormat('settingsAppVersion', options.locale, { version: APP_VERSION }))}</p>
        </div>
      </div>
    </section>
  `;
}

export function renderSettingsScreen(container: HTMLElement, options: SettingsScreenOptions): void {
  container.innerHTML = buildSettingsScreenHtml(options);

  container.querySelector<HTMLButtonElement>('[data-action="back"]')?.addEventListener(
    'click',
    options.onBack,
  );
}
