/**
 * Fixed six-color palette for found words on a grid (index 0–5).
 * Matches the Illustrator socket/gauge library order (red, orange, yellow,
 * green, blue, purple) and the Cell01–Cell06 tile art in that same order.
 */
export const WORD_HIGHLIGHT_COLORS = [
  '#fd5827',
  '#ffae00',
  '#fff43d',
  '#93df1f',
  '#49dbff',
  '#b149f2',
] as const;

export const WORDS_PER_GRID = WORD_HIGHLIGHT_COLORS.length;

export function getWordHighlightColor(colorIndex: number): string {
  return WORD_HIGHLIGHT_COLORS[colorIndex] ?? WORD_HIGHLIGHT_COLORS[0];
}

function channelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return (
    0.2126 * channelToLinear(red) +
    0.7152 * channelToLinear(green) +
    0.0722 * channelToLinear(blue)
  );
}

/** Pick light or dark text for readable contrast on a highlight color. */
export function getWordHighlightTextColor(colorIndex: number): string {
  return relativeLuminance(getWordHighlightColor(colorIndex)) > 0.45 ? '#1a1a1a' : '#ffffff';
}

export function wordColorVar(colorIndex: number): string {
  return `var(--word-color-${colorIndex})`;
}

export function injectWordColorVars(container: HTMLElement): void {
  if (container.querySelector('[data-word-colors]')) {
    return;
  }

  const vars = WORD_HIGHLIGHT_COLORS.map(
    (color, index) => `--word-color-${index}: ${color};`,
  ).join(' ');
  const style = document.createElement('style');
  style.dataset.wordColors = 'true';
  style.textContent = `:root { ${vars} }`;
  container.appendChild(style);
}
