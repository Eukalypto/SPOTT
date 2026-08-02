import { describe, expect, it } from 'vitest';

import {
  formatRemainingTime,
  isRoundFinished,
  isTimerUrgent,
  ROUND_DURATION_SECONDS,
} from './round-timer.js';

describe('round timer helpers', () => {
  it('starts at two minutes thirty seconds for a Classic round', () => {
    expect(ROUND_DURATION_SECONDS).toBe(150);
    expect(formatRemainingTime(ROUND_DURATION_SECONDS)).toBe('2:30');
  });

  it('formats remaining time as m:ss', () => {
    expect(formatRemainingTime(90)).toBe('1:30');
    expect(formatRemainingTime(9)).toBe('0:09');
    expect(formatRemainingTime(0)).toBe('0:00');
  });

  it('marks the final ten seconds as urgent', () => {
    expect(isTimerUrgent(10)).toBe(true);
    expect(isTimerUrgent(11)).toBe(false);
    expect(isTimerUrgent(0)).toBe(false);
  });

  it('detects completed and expired round endings', () => {
    expect(isRoundFinished({ round: { status: 'completed' } } as never)).toBe(true);
    expect(isRoundFinished({ round: { status: 'expired' } } as never)).toBe(true);
    expect(isRoundFinished({ round: { status: 'interrupted' } } as never)).toBe(true);
    expect(isRoundFinished({ round: { status: 'active' } } as never)).toBe(false);
  });
});
