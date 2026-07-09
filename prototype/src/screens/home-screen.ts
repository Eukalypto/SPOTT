import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export interface HomeScreenOptions {
  locale: UiLocale;
  onPractice: () => void;
  onRules: () => void;
  onSettings: () => void;
}

export function buildHomeScreenHtml(options: HomeScreenOptions): string {
  return `
    <section class="screen screen--home" aria-labelledby="app-title">
      <header class="home-hero">
        <h1 id="app-title" class="app-title">${escapeHtml(t('appTitle', options.locale))}</h1>
        <p class="app-subtitle">${escapeHtml(t('appSubtitle', options.locale))}</p>
      </header>

      <div class="home-actions">
        <button type="button" class="primary-button home-actions__primary" data-action="practice">
          ${escapeHtml(t('navPractice', options.locale))}
        </button>
      </div>

      <nav class="home-actions home-actions--secondary" aria-label="${escapeHtml(t('homeNav', options.locale))}">
        <button type="button" class="secondary-button" data-action="rules">
          ${escapeHtml(t('navRules', options.locale))}
        </button>
        <button type="button" class="secondary-button" data-action="settings">
          ${escapeHtml(t('navSettings', options.locale))}
        </button>
      </nav>

      <div class="home-modes" aria-label="${escapeHtml(t('homeFutureModes', options.locale))}">
        <p class="home-modes__label">${escapeHtml(t('homeFutureModes', options.locale))}</p>
        <button type="button" class="secondary-button home-modes__placeholder" disabled aria-disabled="true">
          ${escapeHtml(t('navChallengeComingLater', options.locale))}
        </button>
      </div>
    </section>
  `;
}

export function renderHomeScreen(container: HTMLElement, options: HomeScreenOptions): void {
  container.innerHTML = buildHomeScreenHtml(options);

  container.querySelector<HTMLButtonElement>('[data-action="practice"]')?.addEventListener(
    'click',
    options.onPractice,
  );
  container.querySelector<HTMLButtonElement>('[data-action="rules"]')?.addEventListener(
    'click',
    options.onRules,
  );
  container.querySelector<HTMLButtonElement>('[data-action="settings"]')?.addEventListener(
    'click',
    options.onSettings,
  );
}
