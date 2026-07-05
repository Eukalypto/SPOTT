import { escapeHtml } from '../utils/html.js';

export interface StartScreenOptions {
  errorMessage: string | null;
  onStartPracticeRound: () => void;
}

export function renderStartScreen(
  container: HTMLElement,
  options: StartScreenOptions,
): void {
  container.innerHTML = `
    <section class="screen screen--start" aria-labelledby="app-title">
      <header>
        <h1 id="app-title" class="app-title">Spott</h1>
        <p class="app-subtitle">Classic word search</p>
      </header>
      <div>
        ${
          options.errorMessage
            ? `<p class="error-message" role="alert">${escapeHtml(options.errorMessage)}</p>`
            : ''
        }
        <button type="button" class="primary-button" data-action="start">
          Start Practice Round
        </button>
      </div>
    </section>
  `;

  container.querySelector<HTMLButtonElement>('[data-action="start"]')?.addEventListener(
    'click',
    options.onStartPracticeRound,
  );
}
