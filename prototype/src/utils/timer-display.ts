import type { UiLocale } from '../i18n/index.js';
import { t, tFormat } from '../i18n/index.js';
import { escapeHtml } from './html.js';
import { formatRemainingTime, isTimerUrgent } from './round-timer.js';

export function getTimerAriaLabel(
  remainingSeconds: number,
  locale: UiLocale,
  options: { timerPaused?: boolean } = {},
): string {
  const time = formatRemainingTime(remainingSeconds);
  const timerPaused = options.timerPaused ?? false;
  const urgent = !timerPaused && isTimerUrgent(remainingSeconds);

  if (timerPaused) {
    return tFormat('timerPausedWithValue', locale, { time });
  }

  if (urgent) {
    return tFormat('timeLowWithValue', locale, { time });
  }

  return tFormat('timeRemainingWithValue', locale, { time });
}

export function updateTimerDisplay(
  container: ParentNode,
  remainingSeconds: number,
  locale: UiLocale,
  options: { timerPaused?: boolean } = {},
): void {
  const timerWrap = container.querySelector<HTMLElement>('[data-timer-wrap]');
  if (!timerWrap) {
    return;
  }

  const timerPaused = options.timerPaused ?? false;
  const urgent = !timerPaused && isTimerUrgent(remainingSeconds);

  const valueEl = timerWrap.querySelector<HTMLElement>('[data-timer]');
  if (valueEl) {
    valueEl.textContent = formatRemainingTime(remainingSeconds);
    valueEl.classList.toggle('game-stat__value--urgent', urgent);
    valueEl.classList.toggle('game-stat__value--paused', timerPaused);
  }

  const urgentBadge = timerWrap.querySelector<HTMLElement>('[data-timer-urgent]');
  if (urgentBadge) {
    urgentBadge.hidden = !urgent;
  }

  const pausedBadge = timerWrap.querySelector<HTMLElement>('[data-timer-paused]');
  if (pausedBadge) {
    pausedBadge.hidden = !timerPaused;
  }

  timerWrap.setAttribute('aria-label', getTimerAriaLabel(remainingSeconds, locale, { timerPaused }));
}

export function buildTimerStatHtml(
  remainingSeconds: number,
  locale: UiLocale,
  options: { timerPaused?: boolean } = {},
): string {
  const timerPaused = options.timerPaused ?? false;
  const urgent = !timerPaused && isTimerUrgent(remainingSeconds);

  return `
    <div
      class="game-stat__timer"
      data-timer-wrap
      aria-live="polite"
      aria-label="${escapeHtml(getTimerAriaLabel(remainingSeconds, locale, { timerPaused }))}"
    >
      <span class="game-stat__value${urgent ? ' game-stat__value--urgent' : ''}${timerPaused ? ' game-stat__value--paused' : ''}" data-timer>${formatRemainingTime(remainingSeconds)}</span>
      <span class="game-stat__badge game-stat__badge--urgent" data-timer-urgent${urgent ? '' : ' hidden'}>${escapeHtml(t('timeLow', locale))}</span>
      <span class="game-stat__badge game-stat__badge--paused" data-timer-paused${timerPaused ? '' : ' hidden'}>${escapeHtml(t('timerPausedBadge', locale))}</span>
    </div>
  `;
}
