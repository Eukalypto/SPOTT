import { describe, expect, it } from 'vitest';

import type { PracticeStats } from '../api/stats-api.js';
import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import {
  buildGuestProfileHtml,
  buildProfileScreenHtml,
  buildAuthenticatedProfileHtml,
  formatLastPlayedAt,
} from './profile-screen.js';

const guestOptions = {
  locale: 'en' as const,
  authStatus: 'guest' as const,
  username: null,
  authToken: null,
  sessionStats: { gamesPlayed: 0, bestScore: 0, totalScore: 0 },
  onGoToAuth: () => {},
  onLogout: () => {},
  onOpenSettings: () => {},
  onGoHome: () => {},
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
  it('shows guest message, auth CTA, and empty session state', () => {
    const html = buildProfileScreenHtml(guestOptions);

    expect(html).toContain(t('profileTitle', 'en'));
    expect(html).toContain(escapeHtml(t('profileGuestMessage', 'en')));
    expect(html).toContain(t('authLoginSignUp', 'en'));
    expect(html).toContain(t('profileNoGamesYet', 'en'));
    expect(html).toContain('data-action="go-auth"');
  });

  it('shows a centered Home button instead of the Play/Profile footer', () => {
    const html = buildProfileScreenHtml(guestOptions);

    expect(html).toContain('data-action="go-home"');
    expect(html).toContain('profile-home-button');
    expect(html).toContain(t('home', 'en'));
  });

  it('shows session stats for guests who have played', () => {
    const html = buildGuestProfileHtml({
      ...guestOptions,
      sessionStats: { gamesPlayed: 2, bestScore: 120, totalScore: 200 },
    });

    expect(html).toContain(t('profileGamesPlayed', 'en'));
    expect(html).toContain('2');
    expect(html).toContain(t('profileBestScore', 'en'));
    expect(html).toContain('120');
    expect(html).not.toContain(t('profileNoGamesYet', 'en'));
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
});
