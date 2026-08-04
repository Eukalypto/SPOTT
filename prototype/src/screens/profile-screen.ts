import { getStats, type PracticeStats } from '../api/stats-api.js';
import { t, type UiLocale } from '../i18n/index.js';
import type { AuthStatus } from '../types.js';
import { AVATAR_IDS, getAvatarUrl } from '../utils/avatar-assets.js';
import { escapeHtml } from '../utils/html.js';

const GENERIC_AVATAR_ICON = `
  <svg viewBox="0 0 24 24" focusable="false">
    <path
      fill="currentColor"
      d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
    />
  </svg>
`;

export interface ProfileScreenOptions {
  locale: UiLocale;
  authStatus: AuthStatus;
  username: string | null;
  avatarId: string | null;
  authToken: string | null;
  onGoToAuth: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onGoHome: () => void;
  onSelectAvatar: (avatarId: string) => void;
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
      <button type="button" class="text-button" data-action="settings">
        ${escapeHtml(t('navSettings', options.locale))}
      </button>
    </div>
  `;
}

function buildAvatarButtonHtml(options: ProfileScreenOptions): string {
  const avatarUrl = getAvatarUrl(options.avatarId);
  const image = avatarUrl
    ? `<img class="profile-avatar-button__image" src="${escapeHtml(avatarUrl)}" alt="" />`
    : GENERIC_AVATAR_ICON;

  return `
    <button
      type="button"
      class="profile-avatar-button"
      data-action="open-avatar-picker"
      aria-label="${escapeHtml(t('profileChangeAvatar', options.locale))}"
    >
      ${image}
    </button>
  `;
}

function buildAvatarPickerDialogHtml(options: ProfileScreenOptions): string {
  const options_ = AVATAR_IDS.map((avatarId) => {
    const selected = avatarId === options.avatarId;
    const url = getAvatarUrl(avatarId);
    return `
      <button
        type="button"
        class="avatar-picker-option${selected ? ' avatar-picker-option--selected' : ''}"
        data-avatar-id="${escapeHtml(avatarId)}"
        aria-label="${escapeHtml(avatarId)}"
        aria-pressed="${selected ? 'true' : 'false'}"
      >
        <img src="${escapeHtml(url ?? '')}" alt="" />
      </button>
    `;
  }).join('');

  return `
    <div
      class="confirm-dialog avatar-picker-dialog"
      data-avatar-picker-dialog
      hidden
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-picker-title"
    >
      <div class="confirm-dialog__panel avatar-picker-dialog__panel">
        <div class="avatar-picker-dialog__header">
          <h3 id="avatar-picker-title" class="avatar-picker-dialog__title">
            ${escapeHtml(t('profileAvatarPickerTitle', options.locale))}
          </h3>
          <button type="button" class="text-button" data-action="close-avatar-picker">
            ${escapeHtml(t('closeDialog', options.locale))}
          </button>
        </div>
        <div class="avatar-picker-grid">
          ${options_}
        </div>
      </div>
    </div>
  `;
}

export function buildAuthenticatedProfileHtml(
  options: ProfileScreenOptions,
  statsView: ProfileStatsView,
): string {
  return `
    <div class="profile-panel">
      <div class="profile-identity">
        ${buildAvatarButtonHtml(options)}
        <p class="profile-panel__username">${escapeHtml(options.username ?? '')}</p>
      </div>
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
    ${buildAvatarPickerDialogHtml(options)}
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

    const dialog = container.querySelector<HTMLElement>('[data-avatar-picker-dialog]');
    container.querySelector<HTMLButtonElement>('[data-action="open-avatar-picker"]')?.addEventListener(
      'click',
      () => {
        dialog?.removeAttribute('hidden');
      },
    );
    container.querySelector<HTMLButtonElement>('[data-action="close-avatar-picker"]')?.addEventListener(
      'click',
      () => {
        dialog?.setAttribute('hidden', '');
      },
    );
    container.querySelectorAll<HTMLButtonElement>('[data-avatar-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const avatarId = button.dataset.avatarId;
        if (!avatarId) {
          return;
        }
        dialog?.setAttribute('hidden', '');
        options.onSelectAvatar(avatarId);
      });
    });

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
