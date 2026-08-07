import { describe, expect, it, vi } from 'vitest';

import { t } from '../i18n/index.js';
import { bindFooterNav, renderFooterNav } from './footer-nav.js';

describe('footer nav', () => {
  it('renders a single centered Profile button (fb#10)', () => {
    const html = renderFooterNav('en');

    expect(html).toContain(t('footerProfile', 'en'));
    expect(html).toContain('data-footer-tab="profile"');
    expect(html).not.toContain('data-footer-tab="play"');
  });

  it('binds the profile navigation callback', () => {
    const onProfile = vi.fn();
    const listeners = new Map<string, () => void>();

    const makeButton = (key: string) => ({
      addEventListener: (_event: string, handler: () => void) => {
        listeners.set(key, handler);
      },
    });

    const root = {
      querySelector: (selector: string) => {
        if (selector.includes('="profile"')) {
          return makeButton('profile');
        }
        return null;
      },
    } as unknown as ParentNode;

    bindFooterNav(root, onProfile);
    listeners.get('profile')?.();

    expect(onProfile).toHaveBeenCalledTimes(1);
  });
});
