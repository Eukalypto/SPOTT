import type { LanguageCode } from '@spott/engine';

import { getStats, type PracticeStats } from '../api/stats-api.js';
import { APP_VERSION, DEFAULT_PRACTICE_LANGUAGE, getPracticeLanguageOptions } from '../constants.js';
import { t, tFormat, type UiLocale } from '../i18n/index.js';
import type { AuthStatus } from '../types.js';
import { escapeHtml } from '../utils/html.js';

export interface SettingsScreenOptions {
  locale: UiLocale;
  selectedLanguage: LanguageCode;
  authStatus: AuthStatus;
  username: string | null;
  authToken: string | null;
  onLanguageChange: (language: LanguageCode) => void;
  onResetLanguage: () => void;
  onGoToAuth: () => void;
  onLogout: () => void;
  onBack: () => void;
}

export type StatsViewState =
  | { status: 'guest' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; stats: PracticeStats };

export function formatLastPlayedAt(
  lastPlayedAt: number | null,
  locale: UiLocale,
): string {
  if (lastPlayedAt === null) {
    return t('statsNever', locale);
  }

  try {
    return new Date(lastPlayedAt * 1000).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return t('statsNever', locale);
  }
}

function buildAccountSectionHtml(options: SettingsScreenOptions): string {
  if (options.authStatus === 'authenticated' && options.username) {
    return `
      <div class="settings-panel__account">
        <p class="settings-panel__account-name">
          ${escapeHtml(tFormat('authSignedInAs', options.locale, { username: options.username }))}
        </p>
        <button type="button" class="secondary-button" data-action="logout">
          ${escapeHtml(t('authLogOut', options.locale))}
        </button>
      </div>
    `;
  }

  return `
    <div class="settings-panel__account">
      <button type="button" class="secondary-button" data-action="go-auth">
        ${escapeHtml(t('authLoginSignUp', options.locale))}
      </button>
    </div>
  `;
}

function buildStatRowHtml(label: string, value: string): string {
  return `
    <div class="settings-stats__row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

export function buildStatsSectionHtml(
  locale: UiLocale,
  view: StatsViewState,
): string {
  if (view.status === 'guest') {
    return `
      <section class="settings-stats" aria-labelledby="settings-stats-title">
        <h3 id="settings-stats-title" class="settings-stats__title">
          ${escapeHtml(t('statsSectionTitle', locale))}
        </h3>
        <p class="settings-stats__prompt">${escapeHtml(t('statsLoginPrompt', locale))}</p>
        <button type="button" class="secondary-button" data-action="go-auth-stats">
          ${escapeHtml(t('authLoginSignUp', locale))}
        </button>
      </section>
    `;
  }

  if (view.status === 'loading') {
    return `
      <section class="settings-stats" aria-labelledby="settings-stats-title" aria-busy="true">
        <h3 id="settings-stats-title" class="settings-stats__title">
          ${escapeHtml(t('statsSectionTitle', locale))}
        </h3>
        <p class="settings-stats__status" role="status">${escapeHtml(t('statsLoading', locale))}</p>
      </section>
    `;
  }

  if (view.status === 'error') {
    return `
      <section class="settings-stats" aria-labelledby="settings-stats-title">
        <h3 id="settings-stats-title" class="settings-stats__title">
          ${escapeHtml(t('statsSectionTitle', locale))}
        </h3>
        <p class="settings-stats__error" role="alert">${escapeHtml(t('statsLoadError', locale))}</p>
        <button type="button" class="secondary-button" data-action="retry-stats">
          ${escapeHtml(t('tryAgain', locale))}
        </button>
      </section>
    `;
  }

  const { stats } = view;
  return `
    <section class="settings-stats" aria-labelledby="settings-stats-title">
      <h3 id="settings-stats-title" class="settings-stats__title">
        ${escapeHtml(t('statsSectionTitle', locale))}
      </h3>
      <dl class="settings-stats__list">
        ${buildStatRowHtml(t('statsTotalGames', locale), String(stats.totalGames))}
        ${buildStatRowHtml(t('statsBestScore', locale), String(stats.bestScore))}
        ${buildStatRowHtml(
          t('statsAverageScore', locale),
          String(Math.round(stats.averageScore)),
        )}
        ${buildStatRowHtml(t('statsTotalWordsFound', locale), String(stats.totalWordsFound))}
        ${buildStatRowHtml(
          t('statsTotalGridsCompleted', locale),
          String(stats.totalGridsCompleted),
        )}
        ${buildStatRowHtml(
          t('statsLastPlayed', locale),
          formatLastPlayedAt(stats.lastPlayedAt, locale),
        )}
      </dl>
    </section>
  `;
}

export function buildSettingsScreenHtml(
  options: SettingsScreenOptions,
  statsView: StatsViewState = options.authStatus === 'authenticated'
    ? { status: 'loading' }
    : { status: 'guest' },
): string {
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
          ${buildAccountSectionHtml(options)}

          <div data-stats-host>
            ${buildStatsSectionHtml(options.locale, statsView)}
          </div>

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
  let statsView: StatsViewState =
    options.authStatus === 'authenticated' ? { status: 'loading' } : { status: 'guest' };
  let fetchGeneration = 0;

  const paint = (): void => {
    container.innerHTML = buildSettingsScreenHtml(options, statsView);
    bindChrome();
    bindStatsActions();
  };

  const paintStatsOnly = (): void => {
    const host = container.querySelector<HTMLElement>('[data-stats-host]');
    if (!host) {
      paint();
      return;
    }
    host.innerHTML = buildStatsSectionHtml(options.locale, statsView);
    bindStatsActions();
  };

  const bindChrome = (): void => {
    container.querySelector<HTMLButtonElement>('[data-action="back"]')?.addEventListener(
      'click',
      options.onBack,
    );

    container.querySelector<HTMLButtonElement>('[data-action="go-auth"]')?.addEventListener(
      'click',
      options.onGoToAuth,
    );

    container.querySelector<HTMLButtonElement>('[data-action="logout"]')?.addEventListener(
      'click',
      options.onLogout,
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

    container
      .querySelector<HTMLButtonElement>('[data-action="reset-language"]')
      ?.addEventListener('click', options.onResetLanguage);
  };

  const bindStatsActions = (): void => {
    container
      .querySelector<HTMLButtonElement>('[data-action="go-auth-stats"]')
      ?.addEventListener('click', options.onGoToAuth);

    container
      .querySelector<HTMLButtonElement>('[data-action="retry-stats"]')
      ?.addEventListener('click', () => {
        void loadStats();
      });
  };

  const loadStats = async (): Promise<void> => {
    if (options.authStatus !== 'authenticated' || !options.authToken) {
      statsView = { status: 'guest' };
      paintStatsOnly();
      return;
    }

    const generation = ++fetchGeneration;
    statsView = { status: 'loading' };
    paintStatsOnly();

    try {
      const { stats } = await getStats(options.authToken);
      if (generation !== fetchGeneration) {
        return;
      }
      statsView = { status: 'ready', stats };
    } catch {
      if (generation !== fetchGeneration) {
        return;
      }
      statsView = { status: 'error' };
    }

    paintStatsOnly();
  };

  paint();

  if (options.authStatus === 'authenticated' && options.authToken) {
    void loadStats();
  }
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
