import type { SampleThemeWords } from '../types.js';

/**
 * English sample themes for development and tests.
 *
 * Coverage for Classic sequence A, B, C, D, B, E, A:
 * - Tier A: Forest, Ocean
 * - Tier B: Kitchen, Sports
 * - Tier C: Space
 * - Tier D: Music
 * - Tier E: Travel
 *
 * Each theme includes spare words above the bare minimum to reduce generation failures.
 * Not intended for production use.
 */
export const ENGLISH_SAMPLE_THEMES: readonly SampleThemeWords[] = [
  {
    themeId: 'en-forest',
    label: 'Forest',
    difficultyTier: 'A',
    wordsByLength: {
      4: ['bear', 'wolf', 'hawk'],
      5: ['tiger', 'eagle', 'peach'],
      6: ['forest', 'branch'],
      7: ['country', 'streams'],
    },
  },
  {
    themeId: 'en-ocean',
    label: 'Ocean',
    difficultyTier: 'A',
    wordsByLength: {
      4: ['fish', 'crab', 'seal'],
      5: ['shark', 'whale', 'coral'],
      6: ['turtle', 'lagoon'],
      7: ['dolphin', 'current'],
    },
  },
  {
    themeId: 'en-kitchen',
    label: 'Kitchen',
    difficultyTier: 'B',
    wordsByLength: {
      4: ['soup', 'rice', 'milk'],
      5: ['bread', 'lemon', 'sugar'],
      6: ['carrot', 'garlic'],
      7: ['kitchen', 'recipes'],
    },
  },
  {
    themeId: 'en-sports',
    label: 'Sports',
    difficultyTier: 'B',
    wordsByLength: {
      4: ['golf', 'yoga', 'swim'],
      5: ['rugby', 'tennis', 'dodge'],
      6: ['soccer', 'sprint'],
      7: ['athlete', 'victory'],
    },
  },
  {
    themeId: 'en-space',
    label: 'Space',
    difficultyTier: 'C',
    wordsByLength: {
      4: ['moon', 'mars', 'star'],
      5: ['comet', 'orbit', 'pluto'],
      6: ['rocket', 'galaxy'],
      7: ['jupiter', 'cluster'],
    },
  },
  {
    themeId: 'en-music',
    label: 'Music',
    difficultyTier: 'D',
    wordsByLength: {
      4: ['drum', 'horn', 'bell'],
      5: ['piano', 'violin', 'tempo'],
      6: ['guitar', 'chorus'],
      7: ['harmony', 'concert'],
    },
  },
  {
    themeId: 'en-travel',
    label: 'Travel',
    difficultyTier: 'E',
    wordsByLength: {
      4: ['road', 'trip', 'maps'],
      5: ['train', 'hotel', 'guide'],
      6: ['travel', 'voyage'],
      7: ['journey', 'tourism'],
    },
  },
] as const;
