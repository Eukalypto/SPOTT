import { describe, expect, it } from 'vitest';
import {
  calculateFinalScore,
  calculateTimeBonus,
  calculateWordScore,
  DEFAULT_SCORING_CONFIG,
  getMaskScoreMultiplier,
} from './calculate-score.js';
import type { PlacedWord } from '../types/word.js';

function createWord(length: PlacedWord['length'], maskType: PlacedWord['maskType']): PlacedWord {
  const text = 'x'.repeat(length);
  return {
    id: `word-${length}-${maskType}`,
    text,
    normalizedText: text,
    length,
    direction: 'horizontal-right',
    start: { row: 0, col: 0 },
    end: { row: 0, col: length - 1 },
    cells: Array.from({ length }, (_, col) => ({ row: 0, col })),
    maskType,
    found: false,
    findOrder: null,
    colorIndex: null,
  };
}

describe('calculateWordScore', () => {
  it('scores by word length and find order with no mask multiplier', () => {
    expect(calculateWordScore(createWord(4, 'none'), 1)).toBe(4);
    expect(calculateWordScore(createWord(5, 'none'), 2)).toBe(10);
    expect(calculateWordScore(createWord(6, 'none'), 3)).toBe(18);
    expect(calculateWordScore(createWord(7, 'none'), 4)).toBe(28);
  });

  it('applies find order as a multiplier within the current grid', () => {
    const word = createWord(4, 'none');

    expect(calculateWordScore(word, 1)).toBe(4);
    expect(calculateWordScore(word, 6)).toBe(24);
  });

  it('applies partial mask multiplier ×2', () => {
    expect(calculateWordScore(createWord(5, 'partial'), 2)).toBe(20);
    expect(getMaskScoreMultiplier('partial')).toBe(2);
  });

  it('applies full mask multiplier ×3', () => {
    expect(calculateWordScore(createWord(6, 'full'), 2)).toBe(36);
    expect(getMaskScoreMultiplier('full')).toBe(3);
  });

  it('combines length, find order, and mask multiplier', () => {
    expect(calculateWordScore(createWord(7, 'full'), 3)).toBe(63);
  });
});

describe('calculateTimeBonus', () => {
  it('awards remaining seconds multiplied by timeBonusPerSecond', () => {
    expect(calculateTimeBonus(30, DEFAULT_SCORING_CONFIG)).toBe(450);
    expect(calculateTimeBonus(10, { timeBonusPerSecond: 15 })).toBe(150);
  });

  it('returns zero when no time remains', () => {
    expect(calculateTimeBonus(0, DEFAULT_SCORING_CONFIG)).toBe(0);
    expect(calculateTimeBonus(-5, DEFAULT_SCORING_CONFIG)).toBe(0);
  });
});

describe('calculateFinalScore', () => {
  it('adds base score and time bonus', () => {
    expect(calculateFinalScore(120, 450)).toBe(570);
    expect(calculateFinalScore(0, 0)).toBe(0);
  });
});
