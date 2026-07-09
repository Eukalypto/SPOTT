import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import {
  buildRulesScreenHtml,
  CLASSIC_PRACTICE_RULE_KEYS,
  normalizeRulesReturnScreen,
} from './rules-screen.js';

describe('buildRulesScreenHtml', () => {
  it('renders all Classic Practice rules in English', () => {
    const html = buildRulesScreenHtml({
      locale: 'en',
      returnScreen: 'home',
      onBack: () => {},
    });

    expect(html).toContain(t('navRules', 'en'));
    expect(html).toContain(t('rulesClassicPracticeHeading', 'en'));
    expect(html).toContain(t('rulesIntro', 'en'));
    expect(html).toContain('class="rules-list"');

    for (const key of CLASSIC_PRACTICE_RULE_KEYS) {
      expect(html).toContain(escapeHtml(t(key, 'en')));
    }
  });

  it('localizes rules for French and Spanish', () => {
    const french = buildRulesScreenHtml({
      locale: 'fr',
      returnScreen: 'home',
      onBack: () => {},
    });
    const spanish = buildRulesScreenHtml({
      locale: 'es',
      returnScreen: 'home',
      onBack: () => {},
    });

    expect(french).toContain(t('rulesTimer', 'fr'));
    expect(french).toContain(t('rulesTimeBonus', 'fr'));
    expect(spanish).toContain(t('rulesNoReverse', 'es'));
    expect(spanish).toContain(t('rulesMaskedClues', 'es'));
  });

  it('shows a back button that matches the return screen', () => {
    const fromHome = buildRulesScreenHtml({
      locale: 'en',
      returnScreen: 'home',
      onBack: () => {},
    });
    const fromPracticeSetup = buildRulesScreenHtml({
      locale: 'en',
      returnScreen: 'practice-setup',
      onBack: () => {},
    });

    expect(fromHome).toContain(t('backToHome', 'en'));
    expect(fromPracticeSetup).toContain(t('backToPracticeSetup', 'en'));
    expect(fromHome).toContain('data-action="back"');
  });

  it('uses the centered layout wrapper', () => {
    const html = buildRulesScreenHtml({
      locale: 'en',
      returnScreen: 'home',
      onBack: () => {},
    });

    expect(html).toContain('screen-centered');
    expect(html).toContain('screen-centered__stack');
  });

  it('falls back to home when returnScreen is invalid', () => {
    expect(normalizeRulesReturnScreen('practice-setup')).toBe('practice-setup');
    expect(normalizeRulesReturnScreen('home')).toBe('home');
    expect(normalizeRulesReturnScreen({ type: 'click' })).toBe('home');

    const html = buildRulesScreenHtml({
      locale: 'en',
      returnScreen: { type: 'click' } as never,
      onBack: () => {},
    });

    expect(html).toContain(t('backToHome', 'en'));
    expect(html).toContain(t('rulesRoundGrids', 'en'));
  });
});
