import { describe, expect, it } from 'vitest';

import { dt } from './dev-i18n.js';

describe('dev i18n', () => {
  it('provides localized labels for dev-only debug controls', () => {
    expect(dt('showSolutions', 'en')).toBe('Show Solutions');
    expect(dt('completeCurrentGrid', 'en')).toBe('Complete Current Grid');
    expect(dt('pauseTimer', 'en')).toBe('Pause Timer');
    expect(dt('regenerateRound', 'en')).toBe('Regenerate Round');
    expect(dt('logState', 'en')).toBe('Log Round State');
    expect(dt('devTools', 'fr')).toBe('Outils de dev');
    expect(dt('showSolutions', 'es')).toBe('Mostrar soluciones');
  });
});
