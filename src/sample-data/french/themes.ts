import type { SampleThemeWords } from '../types.js';

/**
 * French sample themes for development and tests.
 *
 * Coverage for Classic sequence A, B, C, D, B, E, A:
 * - Tier A: Forêt, Océan
 * - Tier B: Cuisine, Sports
 * - Tier C: Espace
 * - Tier D: Musique
 * - Tier E: Voyage
 *
 * Accents are preserved in source text; normalization strips them internally.
 * Not intended for production use.
 */
export const FRENCH_SAMPLE_THEMES: readonly SampleThemeWords[] = [
  {
    themeId: 'fr-foret',
    label: 'Forêt',
    difficultyTier: 'A',
    wordsByLength: {
      4: ['ours', 'loup', 'cerf'],
      5: ['tigre', 'aigle', 'hêtre'],
      6: ['jardin', 'mousse'],
      7: ['rivière', 'feuille'],
    },
  },
  {
    themeId: 'fr-ocean',
    label: 'Océan',
    difficultyTier: 'A',
    wordsByLength: {
      4: ['grue', 'banc', 'dune'],
      5: ['requin', 'écume', 'plage'],
      6: ['tortue', 'marais'],
      7: ['dauphin', 'courant'],
    },
  },
  {
    themeId: 'fr-cuisine',
    label: 'Cuisine',
    difficultyTier: 'B',
    wordsByLength: {
      4: ['soupe', 'lait', 'pois'],
      5: ['pain', 'citron', 'sucre'],
      6: ['carotte', 'beurre'],
      7: ['recette', 'cuisine'],
    },
  },
  {
    themeId: 'fr-sports',
    label: 'Sports',
    difficultyTier: 'B',
    wordsByLength: {
      4: ['golf', 'yoga', 'nage'],
      5: ['rugby', 'sport', 'course'],
      6: ['sprint', 'tennis', 'hockey'],
      7: ['trophée', 'athlète'],
    },
  },
  {
    themeId: 'fr-espace',
    label: 'Espace',
    difficultyTier: 'C',
    wordsByLength: {
      4: ['lune', 'mars', 'pôle'],
      5: ['comète', 'venus', 'astro'],
      6: ['fusée', 'galaxie'],
      7: ['jupiter', 'saturne'],
    },
  },
  {
    themeId: 'fr-musique',
    label: 'Musique',
    difficultyTier: 'D',
    wordsByLength: {
      4: ['gong', 'note', 'clef'],
      5: ['piano', 'violon', 'tempo'],
      6: ['guitare', 'choeur'],
      7: ['mélodie', 'concert'],
    },
  },
  {
    themeId: 'fr-voyage',
    label: 'Voyage',
    difficultyTier: 'E',
    wordsByLength: {
      4: ['pont', 'voie', 'port'],
      5: ['train', 'hôtel', 'guide'],
      6: ['voyage', 'trajet'],
      7: ['bagages', 'valises'],
    },
  },
] as const;
