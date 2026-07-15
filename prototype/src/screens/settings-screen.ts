import type { LanguageCode } from '@spott/engine';

import { APP_VERSION, DEFAULT_PRACTICE_LANGUAGE, getPracticeLanguageOptions } from '../constants.js';
import { t, tFormat, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export interface SettingsScreenOptions {
  locale: UiLocale;
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onResetLanguage: () => void;
  onBack: () => void;
}

export function buildSettingsScreenHtml(options: SettingsScreenOptions): string {
  const languageOptions = getPracticeLanguageOptions();
  const isDefaultLanguage = options.selectedLanguage === DEFAULT_PRACTICE_LANGUAGE;

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
          <p class="settings-panel__intro">${escapeHtml(t('settingsIntro', options.locale))}</p>

          <fieldset class="language-picker">
            <legend class="language-picker__legend">${escapeHtml(t('language', options.locale))}</legend>
            <p class="settings-panel__help">${escapeHtml(t('settingsLanguageHelp', options.locale))}</p>
            <div class="language-picker__options">
              ${languageOptions.map((option) => buildLanguageOptionHtml(option, options.selectedLanguage)).join('')}
            </div>
          </fieldset>

          <button
            type="button"
            class="secondary-button settings-panel__reset"
            data-action="reset-language"
            ${isDefaultLanguage ? 'disabled aria-disabled="true"' : ''}
          >
            ${escapeHtml(t('settingsResetLanguage', options.locale))}
          </button>

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

  container.querySelectorAll<HTMLInputElement>('input[name="settings-language"]').forEach(
    (input) => {
      input.addEventListener('change', () => {
        if (!input.checked) {
          return;
        }
        options.onLanguageChange(input.value as LanguageCode);
      });
    },
  );

  container.querySelector<HTMLButtonElement>('[data-action="reset-language"]')?.addEventListener(
    'click',
    options.onResetLanguage,
  );
}

function buildLanguageOptionHtml(
  option: { code: LanguageCode; label: string },
  selectedLanguage: LanguageCode,
): string {
  const checked = option.code === selectedLanguage ? ' checked' : '';
  const selectedClass = option.code === selectedLanguage ? ' language-option--selected' : '';

  return `
    <label class="language-option${selectedClass}">
      <input
        type="radio"
        name="settings-language"
        value="${escapeHtml(option.code)}"
        aria-label="${escapeHtml(option.label)}"
        ${checked}
      />
      <span class="language-option__label">${escapeHtml(option.label)}</span>
    </label>
  `;
}
