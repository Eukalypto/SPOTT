import { describe, expect, it } from 'vitest';

import type { PracticeStats } from '../api/stats-api.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { AVATAR_IDS } from '../utils/avatar-assets.js';
import {
  buildProfileScreenHtml,
  buildAuthenticatedProfileHtml,
  formatLastPlayedAt,
} from './profile-screen.js';

const guestOptions = {
  locale: 'en' as const,
  authStatus: 'guest' as const,
  username: null,
  avatarId: null,
  authToken: null,
  onGoToAuth: () => {},
  onLogout: () => {},
  onOpenSettings: () => {},
  onGoHome: () => {},
  onSelectAvatar: () => {},
};

const sampleStats: PracticeStats = {
  totalGames: 3,
  totalScore: 300,
  bestScore: 150,
  averageScore: 100.6,
  totalWordsFound: 20,
  totalGridsCompleted: 9,
  lastPlayedAt: 1_700_000_000,
};

describe('profile screen', () => {
  it('shows the guest message and auth CTA instead of a statistics section', () => {
    const html = buildProfileScreenHtml(guestOptions);

    expect(html).toContain(t('profileTitle', 'en'));
    expect(html).toContain(escapeHtml(t('profileGuestMessage', 'en')));
    expect(html).toContain(t('authLoginSignUp', 'en'));
    expect(html).toContain('data-action="go-auth"');
    expect(html).not.toContain('profile-stats');
  });

  it('shows a centered Home button instead of the Play/Profile footer', () => {
    const html = buildProfileScreenHtml(guestOptions);

    expect(html).toContain('data-action="go-home"');
    expect(html).toContain('profile-home-button');
    expect(html).toContain(t('home', 'en'));
  });

  it('shows username, logout, and rounded server stats when authenticated', () => {
    const html = buildAuthenticatedProfileHtml(
      {
        ...guestOptions,
        authStatus: 'authenticated',
        username: 'player1',
        authToken: 'token',
      },
      { status: 'ready', stats: sampleStats },
    );

    expect(html).toContain('player1');
    expect(html).toContain(t('authLogOut', 'en'));
    expect(html).toContain(t('statsTotalGames', 'en'));
    expect(html).toContain('3');
    expect(html).toContain('101');
    expect(html).toContain(formatLastPlayedAt(sampleStats.lastPlayedAt, 'en'));
  });

  it('shows an avatar picker with all known avatars, marking the selected one', () => {
    const html = buildAuthenticatedProfileHtml(
      {
        ...guestOptions,
        authStatus: 'authenticated',
        username: 'player1',
        authToken: 'token',
        avatarId: 'Bob',
      },
      { status: 'ready', stats: sampleStats },
    );

    expect(html).toContain('data-action="open-avatar-picker"');
    expect(html).toContain('data-avatar-picker-dialog');
    expect(html.match(/data-avatar-id="/g)?.length).toBe(AVATAR_IDS.length);
    expect(html).toContain('avatar-picker-option--selected');
    expect(html).toContain('data-avatar-id="Bob"');
    expect(html).toContain('aria-pressed="true"');
  });
});
