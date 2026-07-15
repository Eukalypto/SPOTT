import { describe, expect, it, vi } from 'vitest';

import { t } from '../i18n/index.js';
import { bindFooterNav, renderFooterNav } from './footer-nav.js';

describe('footer nav', () => {
  it('renders play and profile tabs with active state', () => {
    const playHtml = renderFooterNav('play', 'en');
    const profileHtml = renderFooterNav('profile', 'fr');

    expect(playHtml).toContain(t('footerPlay', 'en'));
    expect(playHtml).toContain(t('footerProfile', 'en'));
    expect(playHtml).toContain('footer-nav__tab--active');
    expect(playHtml).toContain('data-footer-tab="play"');
    expect(playHtml).toContain('aria-current="page"');

    expect(profileHtml).toContain(t('footerPlay', 'fr'));
    expect(profileHtml).toContain('data-footer-tab="profile"');
  });

  it('binds navigation callbacks', () => {
    const navigate = vi.fn();
    const listeners = new Map<string, () => void>();

    const makeButton = (key: string) => ({
      addEventListener: (_event: string, handler: () => void) => {
        listeners.set(key, handler);
      },
    });

    const root = {
      querySelector: (selector: string) => {
        if (selector.includes('="play"')) {
          return makeButton('play');
        }
        if (selector.includes('="profile"')) {
          return makeButton('profile');
        }
        return null;
      },
    } as unknown as ParentNode;

    bindFooterNav(root, navigate);
    listeners.get('play')?.();
    listeners.get('profile')?.();

    expect(navigate).toHaveBeenCalledWith('home');
    expect(navigate).toHaveBeenCalledWith('profile');
  });
});
