import { GAME_CONFIG, tickTimer, type RoundState } from '@spott/engine';

export const ROUND_TIMER_INTERVAL_MS = 250;
export const ROUND_DURATION_SECONDS = GAME_CONFIG.roundDurationSeconds;

export function formatRemainingTime(remainingSeconds: number): string {
  const seconds = Math.max(0, remainingSeconds);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function isTimerUrgent(remainingSeconds: number): boolean {
  return remainingSeconds > 0 && remainingSeconds <= 10;
}

export function isRoundFinished(roundState: RoundState): boolean {
  return (
    roundState.round.status === 'completed' ||
    roundState.round.status === 'expired' ||
    roundState.round.status === 'interrupted'
  );
}

export interface RoundTimerController {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
  tickNow: () => void;
}

export interface RoundTimerOptions {
  getRoundState: () => RoundState | null;
  isGameScreenActive: () => boolean;
  isPaused: () => boolean;
  onTick: (roundState: RoundState) => void;
  onRoundEnded: (roundState: RoundState) => void;
}

/** UI-owned round clock; delegates countdown and expiry to {@link tickTimer}. */
export function createRoundTimerController(options: RoundTimerOptions): RoundTimerController {
  let timerId: ReturnType<typeof setInterval> | null = null;
  let paused = false;

  const stop = (): void => {
    paused = false;
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const tickNow = (): void => {
    if (options.isPaused() || paused) {
      return;
    }

    const current = options.getRoundState();
    if (!current || !options.isGameScreenActive() || current.round.status !== 'active') {
      return;
    }

    const nextState = tickTimer(current, Date.now());
    options.onTick(nextState);

    if (isRoundFinished(nextState)) {
      stop();
      options.onRoundEnded(nextState);
    }
  };

  const handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      tickNow();
    }
  };

  const startInterval = (): void => {
    if (timerId !== null) {
      return;
    }

    timerId = setInterval(() => {
      if (!options.isGameScreenActive()) {
        stop();
        return;
      }
      tickNow();
    }, ROUND_TIMER_INTERVAL_MS);
  };

  const start = (): void => {
    stop();
    paused = false;

    const current = options.getRoundState();
    if (!current || current.round.status !== 'active') {
      return;
    }

    startInterval();
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  const pause = (): void => {
    paused = true;
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const resume = (): void => {
    if (!options.isGameScreenActive()) {
      return;
    }

    paused = false;
    if (options.isPaused()) {
      return;
    }

    startInterval();
    tickNow();
  };

  return {
    start,
    stop,
    pause,
    resume,
    isPaused: () => paused || options.isPaused(),
    tickNow,
  };
}
