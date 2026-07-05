import { getDisplayedClue } from '@spott/engine';
import { describe, expect, it } from 'vitest';

import { buildClueListHtml, formatClueDisplayHtml } from './clue-list.js';

function createWord(
  overrides: Partial<{
    id: string;
    text: string;
    normalizedText: string;
    maskType: 'none' | 'partial' | 'full';
    found: boolean;
    colorIndex: number | null;
  }> = {},
) {
  return {
    id: 'w1',
    text: 'lion',
    normalizedText: 'lion',
    length: 4 as const,
    direction: 'E' as const,
    start: { row: 0, col: 0 },
    end: { row: 0, col: 3 },
    cells: [],
    maskType: 'none' as const,
    found: false,
    findOrder: null,
    colorIndex: null,
    ...overrides,
  };
}

describe('formatClueDisplayHtml', () => {
  it('wraps full-mask # characters separately from visible letters', () => {
    expect(formatClueDisplayHtml('####')).toBe(
      '<span class="clue-mask" aria-hidden="true">#</span>'.repeat(4),
    );
    expect(formatClueDisplayHtml('##ON')).toContain('clue-mask');
    expect(formatClueDisplayHtml('##ON')).toContain('>O<');
    expect(formatClueDisplayHtml('##ON')).toContain('>N<');
  });
});

describe('buildClueListHtml', () => {
  it('uses getDisplayedClue for unmasked, full, and partial words', () => {
    const grid = {
      placedWords: [
        createWord({ id: 'w1', text: 'lion', maskType: 'none' }),
        createWord({ id: 'w2', text: 'tiger', maskType: 'full' }),
        createWord({ id: 'w3', text: 'bear', maskType: 'partial' }),
      ],
    } as Parameters<typeof buildClueListHtml>[0];

    const html = buildClueListHtml(grid);

    expect(html).toContain(formatClueDisplayHtml(getDisplayedClue(grid.placedWords[0])));
    expect(html).toContain(formatClueDisplayHtml(getDisplayedClue(grid.placedWords[1])));
    expect(html).toContain(formatClueDisplayHtml(getDisplayedClue(grid.placedWords[2])));
  });

  it('preserves Spanish ñ when the engine reveals it in a clue', () => {
    const word = createWord({
      id: 'w1',
      text: 'señor',
      normalizedText: 'señor',
      maskType: 'none',
    });
    const grid = { placedWords: [word] } as Parameters<typeof buildClueListHtml>[0];

    expect(buildClueListHtml(grid)).toContain('>Ñ<');
    expect(buildClueListHtml(grid)).toContain(
      formatClueDisplayHtml(getDisplayedClue(word)),
    );
  });

  it('preserves French accents when the engine reveals them in a clue', () => {
    const word = createWord({
      id: 'w1',
      text: 'fête',
      normalizedText: 'fete',
      maskType: 'none',
    });
    const grid = { placedWords: [word] } as Parameters<typeof buildClueListHtml>[0];

    expect(buildClueListHtml(grid)).toContain('>Ê<');
  });

  it('marks found words with strikethrough and lists them after active clues', () => {
    const grid = {
      placedWords: [
        createWord({ id: 'w1', text: 'lion', found: true, colorIndex: 0, maskType: 'full' }),
        createWord({ id: 'w2', text: 'tiger', maskType: 'partial' }),
      ],
    } as Parameters<typeof buildClueListHtml>[0];

    const html = buildClueListHtml(grid);
    const activePartialIndex = html.indexOf(formatClueDisplayHtml('###ER'));
    const foundIndex = html.indexOf('clue-item__text--found');

    expect(activePartialIndex).toBeLessThan(foundIndex);
    expect(html).toContain('clue-item--found');
    expect(html).toContain('clue-item__text--found');
  });
});
