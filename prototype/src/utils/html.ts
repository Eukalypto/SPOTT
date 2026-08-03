export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Render clue text from `getDisplayedClue`, styling `#` mask chars separately
 * so visible letters (including ñ and accents) display correctly.
 */
export function formatClueDisplayHtml(clue: string): string {
  return [...clue]
    .map((character) => {
      if (character === '#') {
        return '<span class="clue-mask" aria-hidden="true">#</span>';
      }
      return `<span class="clue-letter">${escapeHtml(character)}</span>`;
    })
    .join('');
}
