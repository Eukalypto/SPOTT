import type { UiLocale } from '../i18n/index.js';

export const DEV_TRANSLATION_KEYS = [
  'devTools',
  'showSolutions',
  'hideSolutions',
  'submitFirstUnfoundWord',
  'completeCurrentGrid',
  'pauseTimer',
  'resumeTimer',
  'regenerateRound',
  'logState',
] as const;

export type DevTranslationKey = (typeof DEV_TRANSLATION_KEYS)[number];

type DevTranslationDictionary = Record<DevTranslationKey, string>;

const EN: DevTranslationDictionary = {
  devTools: 'Dev tools',
  showSolutions: 'Show Solutions',
  hideSolutions: 'Hide Solutions',
  submitFirstUnfoundWord: 'Submit First Unfound Word',
  completeCurrentGrid: 'Complete Current Grid',
  pauseTimer: 'Pause Timer',
  resumeTimer: 'Resume Timer',
  regenerateRound: 'Regenerate Round',
  logState: 'Log Round State',
};

const FR: DevTranslationDictionary = {
  devTools: 'Outils de dev',
  showSolutions: 'Afficher les solutions',
  hideSolutions: 'Masquer les solutions',
  submitFirstUnfoundWord: 'Soumettre le premier mot non trouvé',
  completeCurrentGrid: 'Terminer la grille actuelle',
  pauseTimer: 'Mettre le timer en pause',
  resumeTimer: 'Reprendre le timer',
  regenerateRound: 'Regénérer la manche',
  logState: 'Journaliser l’état',
};

const ES: DevTranslationDictionary = {
  devTools: 'Herramientas de desarrollo',
  showSolutions: 'Mostrar soluciones',
  hideSolutions: 'Ocultar soluciones',
  submitFirstUnfoundWord: 'Enviar la primera palabra no encontrada',
  completeCurrentGrid: 'Completar cuadrícula actual',
  pauseTimer: 'Pausar temporizador',
  resumeTimer: 'Reanudar temporizador',
  regenerateRound: 'Regenerar ronda',
  logState: 'Registrar estado',
};

const DEV_TRANSLATIONS: Record<UiLocale, DevTranslationDictionary> = {
  en: EN,
  fr: FR,
  es: ES,
};

export function dt(key: DevTranslationKey, locale: UiLocale): string {
  return DEV_TRANSLATIONS[locale][key] ?? EN[key];
}
