/**
 * Uppercase a player-facing letter or word while preserving language-specific
 * letters such as Spanish ñ (ñ → Ñ).
 */
export function toDisplayUpperCase(value: string): string {
  return value.toUpperCase();
}
