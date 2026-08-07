import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

const PROFILE_ICON = `
  <svg class="footer-nav__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
    />
  </svg>
`;

/** Single centered Profile button (fb#10) — Home's own Play Solo button already covers Play. */
export function renderFooterNav(locale: UiLocale): string {
  return `
    <nav class="footer-nav" aria-label="${escapeHtml(t('footerNavLabel', locale))}">
      <button type="button" class="footer-nav__tab" data-footer-tab="profile">
        ${PROFILE_ICON}
        <span class="footer-nav__label">${escapeHtml(t('footerProfile', locale))}</span>
      </button>
    </nav>
  `;
}

export function bindFooterNav(root: ParentNode, onProfile: () => void): void {
  root.querySelector<HTMLButtonElement>('[data-footer-tab="profile"]')?.addEventListener(
    'click',
    onProfile,
  );
}
