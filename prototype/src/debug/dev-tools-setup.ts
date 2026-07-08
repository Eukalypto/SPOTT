import type { UiLocale } from '../i18n/index.js';

import { completeCurrentGridViaEngine, logRoundState } from './debug-actions.js';
import { mountDebugPanel, updateDebugPanelView } from './debug-panel.js';

export interface DevToolsHost {
  getLocale: () => UiLocale;
  getRevealWords: () => boolean;
  getTimerPaused: () => boolean;
  onRevealWords: () => void;
  onCompleteGrid: () => void;
  onToggleTimerPause: () => void;
  onRegenerateRound: () => void;
  onLogState: () => void;
}

export interface DevToolsHandle {
  update: () => void;
  destroy: () => void;
}

export function attachDevTools(shell: HTMLElement, host: DevToolsHost): DevToolsHandle {
  const root = document.createElement('div');
  root.className = 'debug-panel-root';
  shell.appendChild(root);

  const syncPanel = (): void => {
    updateDebugPanelView(root, {
      locale: host.getLocale(),
      revealWords: host.getRevealWords(),
      timerPaused: host.getTimerPaused(),
    });
  };

  mountDebugPanel(
    root,
    {
      locale: host.getLocale(),
      revealWords: host.getRevealWords(),
      timerPaused: host.getTimerPaused(),
    },
    {
      onRevealWords: () => {
        host.onRevealWords();
        syncPanel();
      },
      onCompleteGrid: host.onCompleteGrid,
      onToggleTimerPause: () => {
        host.onToggleTimerPause();
        syncPanel();
      },
      onRegenerateRound: host.onRegenerateRound,
      onLogState: host.onLogState,
    },
  );

  return {
    update: syncPanel,
    destroy: () => {
      root.remove();
    },
  };
}

export { completeCurrentGridViaEngine, logRoundState };
