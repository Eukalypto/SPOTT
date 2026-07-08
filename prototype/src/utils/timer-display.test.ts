import { describe, expect, it } from 'vitest';

import { getTimerAriaLabel } from './timer-display.js';

describe('getTimerAriaLabel', () => {
  it('includes the formatted time in the aria label', () => {
    expect(getTimerAriaLabel(90, 'en')).toContain('1:30');
    expect(getTimerAriaLabel(90, 'en')).toContain('remaining');
  });

  it('describes paused and low-time states', () => {
    expect(getTimerAriaLabel(5, 'en', { timerPaused: true })).toContain('paused');
    expect(getTimerAriaLabel(5, 'en')).toContain('low time');
  });
});
