import type { LanguageCode } from '@spott/engine';

import { getPracticeLanguageOptions } from '../constants.js';
import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export interface PracticeSetupScreenOptions {
  locale: UiLocale;
  selectedLanguage: LanguageCode;
  onLanguageChange: (language: LanguageCode) => void;
  onStartPracticeRound: () => void;
  onRules: () => void;
  onBack: () => void;
}

export function buildPracticeSetupScreenHtml(options: PracticeSetupScreenOptions): string {
  const languageOptions = getPracticeLanguageOptions();

  return `
    <section class="screen screen--practice-setup screen-centered" aria-labelledby="practice-setup-title">
      <div class="screen-centered__stack">
        <header class="screen-header">
          <h2 id="practice-setup-title" class="screen-header__title">${escapeHtml(t('practiceSetupTitle', options.locale))}</h2>
        </header>

        <div class="practice-setup-panel">
          <p class="practice-setup__description">${escapeHtml(t('practiceClassicDescription', options.locale))}</p>

          <fieldset class="language-picker">
            <legend class="language-picker__legend">${escapeHtml(t('language', options.locale))}</legend>
            <div class="language-picker__options">
              ${languageOptions.map((option) => buildLanguageOptionHtml(option, options.selectedLanguage)).join('')}
            </div>
          </fieldset>

          <div class="practice-setup__actions">
            <button type="button" class="primary-button" data-action="start">
              ${escapeHtml(t('startPracticeRound', options.locale))}
            </button>
            <button type="button" class="text-button practice-setup__rules" data-action="rules">
              ${escapeHtml(t('navRules', options.locale))}
            </button>
            <button type="button" class="text-button practice-setup__back" data-action="back">
              ${escapeHtml(t('backToHome', options.locale))}
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderPracticeSetupScreen(
  container: HTMLElement,
  options: PracticeSetupScreenOptions,
): void {
  container.innerHTML = buildPracticeSetupScreenHtml(options);

  container.querySelector<HTMLButtonElement>('[data-action="back"]')?.addEventListener(
    'click',
    options.onBack,
  );

  container.querySelector<HTMLButtonElement>('[data-action="rules"]')?.addEventListener(
    'click',
    options.onRules,
  );

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
        aria-label="${escapeHtml(option.label)}"
        ${checked}
      />
      <span class="language-option__label">${escapeHtml(option.label)}</span>
    </label>
  `;
}
