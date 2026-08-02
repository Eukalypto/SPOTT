import type { LanguageCode } from '@spott/engine';

import logoSpottUrl from '../assets/logo-spott.png';
import { getPracticeLanguageOptions } from '../constants.js';
import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export interface HomeScreenOptions {
  locale: UiLocale;
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onPlaySolo: () => void;
  onRules: () => void;
  onSettings: () => void;
}

function buildLanguageDropdownHtml(options: HomeScreenOptions): string {
  const languageOptions = getPracticeLanguageOptions();

  return `
    <label class="home-language" for="home-language-select">
      <span class="home-language__label">${escapeHtml(t('language', options.locale))}</span>
      <select id="home-language-select" class="home-language__select" data-action="language">
        ${languageOptions
          .map(
            (option) => `
              <option value="${escapeHtml(option.code)}"${option.code === options.selectedLanguage ? ' selected' : ''}>
                ${escapeHtml(option.label)}
              </option>
            `,
          )
          .join('')}
      </select>
    </label>
  `;
}

export function buildHomeScreenHtml(options: HomeScreenOptions): string {
  return `
    <section class="screen screen--home" aria-labelledby="app-title">
      <header class="home-hero">
        <img
          class="app-logo"
          src="${logoSpottUrl}"
          alt="${escapeHtml(t('appTitle', options.locale))}"
          id="app-title"
        />
      </header>

      ${buildLanguageDropdownHtml(options)}

      <div class="home-actions">
        <button type="button" class="primary-button home-actions__primary" data-action="play-solo">
          ${escapeHtml(t('navPlaySolo', options.locale))}
        </button>
        <button
          type="button"
          class="secondary-button home-actions__placeholder"
          disabled
          aria-disabled="true"
        >
          ${escapeHtml(t('navChallengeRandom', options.locale))}
        </button>
        <button
          type="button"
          class="secondary-button home-actions__placeholder"
          disabled
          aria-disabled="true"
        >
          ${escapeHtml(t('navChallengeFriend', options.locale))}
        </button>
      </div>

      <nav class="home-actions home-actions--secondary" aria-label="${escapeHtml(t('homeNav', options.locale))}">
        <button type="button" class="secondary-button" data-action="rules">
          ${escapeHtml(t('navRules', options.locale))}
        </button>
        <button type="button" class="secondary-button" data-action="settings">
          ${escapeHtml(t('navSettings', options.locale))}
        </button>
      </nav>
    </section>
  `;
}

export function renderHomeScreen(container: HTMLElement, options: HomeScreenOptions): void {
  container.innerHTML = buildHomeScreenHtml(options);

  container.querySelector<HTMLButtonElement>('[data-action="play-solo"]')?.addEventListener(
    'click',
    options.onPlaySolo,
  );
  container.querySelector<HTMLButtonElement>('[data-action="rules"]')?.addEventListener(
    'click',
    options.onRules,
  );
  container.querySelector<HTMLButtonElement>('[data-action="settings"]')?.addEventListener(
    'click',
    options.onSettings,
  );
  container.querySelector<HTMLSelectElement>('[data-action="language"]')?.addEventListener(
    'change',
    (event) => {
      const select = event.currentTarget as HTMLSelectElement;
      options.onLanguageChange(select.value as LanguageCode);
    },
  );
}
