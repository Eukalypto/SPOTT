import { t, type UiLocale } from '../i18n/index.js';
import type { TranslationKey } from '../i18n/types.js';
import { escapeHtml } from '../utils/html.js';

export const CLASSIC_PRACTICE_RULE_KEYS = [
  'rulesRoundGrids',
  'rulesGridSize',
  'rulesWordsPerGrid',
  'rulesTimer',
  'rulesSwipeDirection',
  'rulesNoReverse',
  'rulesSkip',
  'rulesCompletedRemoved',
  'rulesMaskedClues',
  'rulesScoring',
  'rulesTimeBonus',
] as const satisfies readonly TranslationKey[];

export interface RulesScreenOptions {
  locale: UiLocale;
  onBack: () => void;
}

export function buildRulesScreenHtml(options: RulesScreenOptions): string {
  const ruleItems = CLASSIC_PRACTICE_RULE_KEYS.map(
    (key) => `<li>${escapeHtml(t(key, options.locale))}</li>`,
  ).join('');

  return `
    <section class="screen screen--rules screen-centered" aria-labelledby="rules-title">
      <div class="screen-centered__stack">
        <header class="screen-header">
          <button type="button" class="text-button screen-header__back" data-action="back">
            ${escapeHtml(t('backToHome', options.locale))}
          </button>
          <h2 id="rules-title" class="screen-header__title">${escapeHtml(t('navRules', options.locale))}</h2>
        </header>

        <article class="rules-panel" aria-labelledby="rules-classic-heading">
          <h3 id="rules-classic-heading" class="rules-panel__heading">
            ${escapeHtml(t('rulesClassicPracticeHeading', options.locale))}
          </h3>
          <p class="rules-panel__intro">${escapeHtml(t('rulesIntro', options.locale))}</p>
          <ul class="rules-list">
            ${ruleItems}
          </ul>
        </article>
      </div>
    </section>
  `;
}

export function renderRulesScreen(container: HTMLElement, options: RulesScreenOptions): void {
  container.innerHTML = buildRulesScreenHtml(options);

  container.querySelector<HTMLButtonElement>('[data-action="back"]')?.addEventListener(
    'click',
    options.onBack,
  );
}
