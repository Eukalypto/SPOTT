import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';
import { buildRulesScreenHtml, CLASSIC_PRACTICE_RULE_KEYS } from './rules-screen.js';

describe('buildRulesScreenHtml', () => {
  it('renders all Classic Practice rules in English', () => {
    const html = buildRulesScreenHtml({
      locale: 'en',
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
      onBack: () => {},
    });
    const spanish = buildRulesScreenHtml({
      locale: 'es',
      onBack: () => {},
    });

    expect(french).toContain(t('rulesTimer', 'fr'));
    expect(french).toContain(t('rulesTimeBonus', 'fr'));
    expect(spanish).toContain(t('rulesNoReverse', 'es'));
    expect(spanish).toContain(t('rulesMaskedClues', 'es'));
  });

  it('shows a back-to-home button', () => {
    const html = buildRulesScreenHtml({
      locale: 'en',
      onBack: () => {},
    });

    expect(html).toContain(t('backToHome', 'en'));
    expect(html).toContain('data-action="back"');
  });

  it('uses the centered layout wrapper', () => {
    const html = buildRulesScreenHtml({
      locale: 'en',
      onBack: () => {},
    });

    expect(html).toContain('screen-centered');
    expect(html).toContain('screen-centered__stack');
  });
});
