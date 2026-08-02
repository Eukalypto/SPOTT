import { getStats, type PracticeStats } from '../api/stats-api.js';
import { t, type UiLocale } from '../i18n/index.js';
import type { AuthStatus, SessionStats } from '../types.js';
import { escapeHtml } from '../utils/html.js';

export interface ProfileScreenOptions {
  locale: UiLocale;
  authStatus: AuthStatus;
  username: string | null;
  authToken: string | null;
  sessionStats: SessionStats;
  onGoToAuth: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onGoHome: () => void;
}

export type ProfileStatsView =
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

function buildStatRowHtml(label: string, value: string): string {
  return `
    <div class="profile-stats__row">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `;
}

function buildSessionStatsHtml(locale: UiLocale, sessionStats: SessionStats): string {
  if (sessionStats.gamesPlayed === 0) {
    return `
      <section class="profile-stats" aria-labelledby="profile-session-title">
        <h3 id="profile-session-title" class="profile-stats__title">
          ${escapeHtml(t('profileSessionTitle', locale))}
        </h3>
        <p class="profile-stats__empty">${escapeHtml(t('profileNoGamesYet', locale))}</p>
      </section>
    `;
  }

  return `
    <section class="profile-stats" aria-labelledby="profile-session-title">
      <h3 id="profile-session-title" class="profile-stats__title">
        ${escapeHtml(t('profileSessionTitle', locale))}
      </h3>
      <dl class="profile-stats__list">
        ${buildStatRowHtml(t('profileGamesPlayed', locale), String(sessionStats.gamesPlayed))}
        ${buildStatRowHtml(t('profileBestScore', locale), String(sessionStats.bestScore))}
      </dl>
    </section>
  `;
}

function buildServerStatsHtml(locale: UiLocale, view: ProfileStatsView): string {
  if (view.status === 'loading') {
    return `
      <section class="profile-stats" aria-labelledby="profile-stats-title" aria-busy="true">
        <h3 id="profile-stats-title" class="profile-stats__title">
          ${escapeHtml(t('statsSectionTitle', locale))}
        </h3>
        <p class="profile-stats__status" role="status">${escapeHtml(t('statsLoading', locale))}</p>
      </section>
    `;
  }

  if (view.status === 'error') {
    return `
      <section class="profile-stats" aria-labelledby="profile-stats-title">
        <h3 id="profile-stats-title" class="profile-stats__title">
          ${escapeHtml(t('statsSectionTitle', locale))}
        </h3>
        <p class="profile-stats__error" role="alert">${escapeHtml(t('statsLoadError', locale))}</p>
        <button type="button" class="secondary-button" data-action="retry-stats">
          ${escapeHtml(t('tryAgain', locale))}
        </button>
      </section>
    `;
  }

  const { stats } = view;
  return `
    <section class="profile-stats" aria-labelledby="profile-stats-title">
      <h3 id="profile-stats-title" class="profile-stats__title">
        ${escapeHtml(t('statsSectionTitle', locale))}
      </h3>
      <dl class="profile-stats__list">
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

export function buildGuestProfileHtml(
  options: ProfileScreenOptions,
): string {
  return `
    <div class="profile-panel">
      <p class="profile-panel__message">${escapeHtml(t('profileGuestMessage', options.locale))}</p>
      <button type="button" class="primary-button" data-action="go-auth">
        ${escapeHtml(t('authLoginSignUp', options.locale))}
      </button>
      ${buildSessionStatsHtml(options.locale, options.sessionStats)}
      <button type="button" class="text-button" data-action="settings">
        ${escapeHtml(t('navSettings', options.locale))}
      </button>
    </div>
  `;
}

export function buildAuthenticatedProfileHtml(
  options: ProfileScreenOptions,
  statsView: ProfileStatsView,
): string {
  return `
    <div class="profile-panel">
      <p class="profile-panel__username">${escapeHtml(options.username ?? '')}</p>
      <div data-stats-host>
        ${buildServerStatsHtml(options.locale, statsView)}
      </div>
      <button type="button" class="text-button" data-action="settings">
        ${escapeHtml(t('navSettings', options.locale))}
      </button>
      <button type="button" class="secondary-button" data-action="logout">
        ${escapeHtml(t('authLogOut', options.locale))}
      </button>
    </div>
  `;
}

export function buildProfileScreenHtml(
  options: ProfileScreenOptions,
  statsView: ProfileStatsView = { status: 'loading' },
): string {
  const body =
    options.authStatus === 'authenticated'
      ? buildAuthenticatedProfileHtml(options, statsView)
      : buildGuestProfileHtml(options);

  return `
    <section class="screen screen--profile screen-centered" aria-labelledby="profile-title">
      <div class="screen-centered__stack">
        <header class="screen-header">
          <h2 id="profile-title" class="screen-header__title">
            ${escapeHtml(t('profileTitle', options.locale))}
          </h2>
        </header>
        ${body}
        <button type="button" class="primary-button profile-home-button" data-action="go-home">
          ${escapeHtml(t('home', options.locale))}
        </button>
      </div>
    </section>
  `;
}

export function renderProfileScreen(
  container: HTMLElement,
  options: ProfileScreenOptions,
): void {
  let statsView: ProfileStatsView = { status: 'loading' };
  let fetchGeneration = 0;

  const paint = (): void => {
    container.innerHTML = buildProfileScreenHtml(options, statsView);
    bindActions();
  };

  const paintStatsOnly = (): void => {
    const host = container.querySelector<HTMLElement>('[data-stats-host]');
    if (!host) {
      paint();
      return;
    }
    host.innerHTML = buildServerStatsHtml(options.locale, statsView);
    bindStatsActions();
  };

  const bindStatsActions = (): void => {
    container
      .querySelector<HTMLButtonElement>('[data-action="retry-stats"]')
      ?.addEventListener('click', () => {
        void loadStats();
      });
  };

  const bindActions = (): void => {
    container.querySelector<HTMLButtonElement>('[data-action="go-auth"]')?.addEventListener(
      'click',
      options.onGoToAuth,
    );
    container.querySelector<HTMLButtonElement>('[data-action="logout"]')?.addEventListener(
      'click',
      options.onLogout,
    );
    container.querySelector<HTMLButtonElement>('[data-action="settings"]')?.addEventListener(
      'click',
      options.onOpenSettings,
    );
    container.querySelector<HTMLButtonElement>('[data-action="go-home"]')?.addEventListener(
      'click',
      options.onGoHome,
    );
    bindStatsActions();
  };

  const loadStats = async (): Promise<void> => {
    if (options.authStatus !== 'authenticated' || !options.authToken) {
      return;
    }

    const generation = ++fetchGeneration;
    statsView = { status: 'loading' };
    paintStatsOnly();

    try {
      // Phase 5: real server stats via GET /api/practice/stats
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
