import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export type FooterTab = 'play' | 'profile';

/** Screens the footer can navigate to. */
export type FooterNavScreen = 'home' | 'profile';

const PLAY_ICON = `
  <svg class="footer-nav__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" d="M8 5v14l11-7L8 5z"/>
  </svg>
`;

const PROFILE_ICON = `
  <svg class="footer-nav__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
    />
  </svg>
`;

export function renderFooterNav(activeTab: FooterTab, locale: UiLocale): string {
  const playActive = activeTab === 'play' ? ' footer-nav__tab--active' : '';
  const profileActive = activeTab === 'profile' ? ' footer-nav__tab--active' : '';

  return `
    <nav class="footer-nav" aria-label="${escapeHtml(t('footerNavLabel', locale))}">
      <button
        type="button"
        class="footer-nav__tab${playActive}"
        data-footer-tab="play"
        aria-current="${activeTab === 'play' ? 'page' : 'false'}"
      >
        ${PLAY_ICON}
        <span class="footer-nav__label">${escapeHtml(t('footerPlay', locale))}</span>
      </button>
      <button
        type="button"
        class="footer-nav__tab${profileActive}"
        data-footer-tab="profile"
        aria-current="${activeTab === 'profile' ? 'page' : 'false'}"
      >
        ${PROFILE_ICON}
        <span class="footer-nav__label">${escapeHtml(t('footerProfile', locale))}</span>
      </button>
    </nav>
  `;
}

export function bindFooterNav(
  root: ParentNode,
  navigate: (screen: FooterNavScreen) => void,
): void {
  root.querySelector<HTMLButtonElement>('[data-footer-tab="play"]')?.addEventListener(
    'click',
    () => {
      navigate('home');
    },
  );

  root.querySelector<HTMLButtonElement>('[data-footer-tab="profile"]')?.addEventListener(
    'click',
    () => {
      navigate('profile');
    },
  );
}
