import type { LanguageCode } from '@spott/engine';

import { getPlayableLanguageOptions } from '../constants.js';
import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export interface StartScreenOptions {
  locale: UiLocale;
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onStartPracticeRound: () => void;
}

export function buildStartScreenHtml(options: StartScreenOptions): string {
  const languageOptions = getPlayableLanguageOptions(options.locale);

  return `
    <section class="screen screen--start" aria-labelledby="app-title">
      <header>
        <h1 id="app-title" class="app-title">${escapeHtml(t('appTitle', options.locale))}</h1>
        <p class="app-subtitle">${escapeHtml(t('appSubtitle', options.locale))}</p>
      </header>
      <div class="start-panel">
        <fieldset class="language-picker">
          <legend class="language-picker__legend">${escapeHtml(t('language', options.locale))}</legend>
          <div class="language-picker__options">
            ${languageOptions.map((option) => buildLanguageOptionHtml(option, options.selectedLanguage)).join('')}
          </div>
        </fieldset>
        <button type="button" class="primary-button" data-action="start">
          ${escapeHtml(t('startPracticeRound', options.locale))}
        </button>
      </div>
    </section>
  `;
}

export function renderStartScreen(
  container: HTMLElement,
  options: StartScreenOptions,
): void {
  container.innerHTML = buildStartScreenHtml(options);

  container.querySelectorAll<HTMLInputElement>('input[name="practice-language"]').forEach(
    (input) => {
      input.addEventListener('change', () => {
        if (!input.checked) {
          return;
        }
        options.onLanguageChange(input.value as LanguageCode);
      });
    },
  );

  container.querySelector<HTMLButtonElement>('[data-action="start"]')?.addEventListener(
    'click',
    options.onStartPracticeRound,
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
        name="practice-language"
        value="${escapeHtml(option.code)}"
        ${checked}
      />
      <span class="language-option__label">${escapeHtml(option.label)}</span>
    </label>
  `;
}
