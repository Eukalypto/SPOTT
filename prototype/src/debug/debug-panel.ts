export interface DebugPanelActions {
  onRevealWords: () => void;
  onCompleteGrid: () => void;
  onToggleTimerPause: () => void;
  onRegenerateRound: () => void;
  onLogState: () => void;
}

export interface DebugPanelViewModel {
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
      <summary class="debug-panel__summary">Dev tools</summary>
      <div class="debug-panel__actions">
        <button type="button" class="debug-button" data-debug="reveal">
          ${viewModel.revealWords ? 'Hide' : 'Reveal'} grid words
        </button>
        <button type="button" class="debug-button" data-debug="complete">Complete grid</button>
        <button type="button" class="debug-button" data-debug="timer">
          ${viewModel.timerPaused ? 'Resume' : 'Pause'} timer
        </button>
        <button type="button" class="debug-button" data-debug="regenerate">Regenerate round</button>
        <button type="button" class="debug-button" data-debug="log">Log state</button>
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
    revealButton.textContent = `${viewModel.revealWords ? 'Hide' : 'Reveal'} grid words`;
  }
  if (timerButton) {
    timerButton.textContent = `${viewModel.timerPaused ? 'Resume' : 'Pause'} timer`;
  }
}
