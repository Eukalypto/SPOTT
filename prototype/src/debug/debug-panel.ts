import { t, type UiLocale } from '../i18n/index.js';

export interface DebugPanelActions {
  onRevealWords: () => void;
  onCompleteGrid: () => void;
  onToggleTimerPause: () => void;
  onRegenerateRound: () => void;
  onLogState: () => void;
}

export interface DebugPanelViewModel {
  locale: UiLocale;
  revealWords: boolean;
  timerPaused: boolean;
}

export function mountDebugPanel(
  container: HTMLElement,
  viewModel: DebugPanelViewModel,
  actions: DebugPanelActions,
): void {
  container.innerHTML = `
    <details class="debug-panel" open>
      <summary class="debug-panel__summary">${t('devTools', viewModel.locale)}</summary>
      <div class="debug-panel__actions">
        <button type="button" class="debug-button" data-debug="reveal">
          ${viewModel.revealWords ? t('hideSolutions', viewModel.locale) : t('showSolutions', viewModel.locale)}
        </button>
        <button type="button" class="debug-button" data-debug="complete">${t('completeCurrentGrid', viewModel.locale)}</button>
        <button type="button" class="debug-button" data-debug="timer">
          ${viewModel.timerPaused ? t('resumeTimer', viewModel.locale) : t('pauseTimer', viewModel.locale)}
        </button>
        <button type="button" class="debug-button" data-debug="regenerate">${t('regenerateRound', viewModel.locale)}</button>
        <button type="button" class="debug-button" data-debug="log">${t('logState', viewModel.locale)}</button>
      </div>
    </details>
  `;

  container.querySelector<HTMLButtonElement>('[data-debug="reveal"]')?.addEventListener(
    'click',
    actions.onRevealWords,
  );
  container.querySelector<HTMLButtonElement>('[data-debug="complete"]')?.addEventListener(
    'click',
    actions.onCompleteGrid,
  );
  container.querySelector<HTMLButtonElement>('[data-debug="timer"]')?.addEventListener(
    'click',
    actions.onToggleTimerPause,
  );
  container.querySelector<HTMLButtonElement>('[data-debug="regenerate"]')?.addEventListener(
    'click',
    actions.onRegenerateRound,
  );
  container.querySelector<HTMLButtonElement>('[data-debug="log"]')?.addEventListener(
    'click',
    actions.onLogState,
  );
}

export function updateDebugPanelView(
  container: HTMLElement,
  viewModel: DebugPanelViewModel,
): void {
  const revealButton = container.querySelector<HTMLButtonElement>('[data-debug="reveal"]');
  const timerButton = container.querySelector<HTMLButtonElement>('[data-debug="timer"]');

  if (revealButton) {
    revealButton.textContent = viewModel.revealWords
      ? t('hideSolutions', viewModel.locale)
      : t('showSolutions', viewModel.locale);
  }
  if (timerButton) {
    timerButton.textContent = viewModel.timerPaused
      ? t('resumeTimer', viewModel.locale)
      : t('pauseTimer', viewModel.locale);
  }
}
