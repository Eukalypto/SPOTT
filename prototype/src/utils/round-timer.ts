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
  return roundState.round.status === 'completed' || roundState.round.status === 'expired';
}

export interface RoundTimerController {
  start: () => void;
  stop: () => void;
  tickNow: () => void;
}

export interface RoundTimerOptions {
  getRoundState: () => RoundState | null;
  isGameScreenActive: () => boolean;
  onTick: (roundState: RoundState) => void;
  onRoundEnded: (roundState: RoundState) => void;
}

/** UI-owned round clock; delegates countdown and expiry to {@link tickTimer}. */
export function createRoundTimerController(options: RoundTimerOptions): RoundTimerController {
  let timerId: ReturnType<typeof setInterval> | null = null;

  const stop = (): void => {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const tickNow = (): void => {
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

  const start = (): void => {
    stop();

    const current = options.getRoundState();
    if (!current || current.round.status !== 'active') {
      return;
    }

    timerId = setInterval(() => {
      if (!options.isGameScreenActive()) {
        stop();
        return;
      }
      tickNow();
    }, ROUND_TIMER_INTERVAL_MS);

    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  return {
    start,
    stop,
    tickNow,
  };
}
