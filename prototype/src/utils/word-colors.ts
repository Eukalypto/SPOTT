/** Fixed six-color palette for found words on a grid (index 0–5). */
export const WORD_HIGHLIGHT_COLORS = [
  '#e63946',
  '#457b9d',
  '#2a9d8f',
  '#e9c46a',
  '#9b5de5',
  '#f4845f',
] as const;

export const WORDS_PER_GRID = WORD_HIGHLIGHT_COLORS.length;

export function getWordHighlightColor(colorIndex: number): string {
  return WORD_HIGHLIGHT_COLORS[colorIndex] ?? WORD_HIGHLIGHT_COLORS[0];
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
