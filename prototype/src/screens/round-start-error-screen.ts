import type { RoundStartError } from '../utils/round-start-error.js';
import { t, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export interface RoundStartErrorScreenOptions {
  locale: UiLocale;
  error: RoundStartError;
  onTryAgain: () => void;
  onBackToStart: () => void;
}

export function buildRoundStartErrorScreenHtml(options: RoundStartErrorScreenOptions): string {
  return `
    <section class="screen screen--error" aria-labelledby="round-error-title">
      <header class="error-header">
        <h2 id="round-error-title">${escapeHtml(t('roundGenerationFailed', options.locale))}</h2>
      </header>
      <div class="error-panel">
        <p class="error-message" role="alert">${escapeHtml(options.error.message)}</p>
        <div class="error-actions">
          <button type="button" class="primary-button" data-action="try-again">
            ${escapeHtml(t('tryAgain', options.locale))}
          </button>
          <button type="button" class="secondary-button" data-action="back-to-start">
            ${escapeHtml(t('backToStart', options.locale))}
          </button>
        </div>
      </div>
    </section>
  `;
}

export function renderRoundStartErrorScreen(
  container: HTMLElement,
  options: RoundStartErrorScreenOptions,
): void {
  container.innerHTML = buildRoundStartErrorScreenHtml(options);

  container.querySelector<HTMLButtonElement>('[data-action="try-again"]')?.addEventListener(
    'click',
    options.onTryAgain,
  );
  container.querySelector<HTMLButtonElement>('[data-action="back-to-start"]')?.addEventListener(
    'click',
    options.onBackToStart,
  );
}
