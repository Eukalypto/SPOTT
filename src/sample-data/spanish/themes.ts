import type { SampleThemeWords } from '../types.js';

/**
 * Spanish sample themes for development and tests.
 *
 * Coverage for Classic sequence A, B, C, D, B, E, A:
 * - Tier A: Bosque, Océano
 * - Tier B: Cocina, Deportes
 * - Tier C: Espacio
 * - Tier D: Música
 * - Tier E: Viaje
 *
 * Includes words with ñ and accents; ñ remains distinct from n after normalization.
 * Not intended for production use.
 */
export const SPANISH_SAMPLE_THEMES: readonly SampleThemeWords[] = [
  {
    themeId: 'es-bosque',
    label: 'Bosque',
    difficultyTier: 'A',
    wordsByLength: {
      4: ['lobo', 'foca', 'niño'],
      5: ['tigre', 'águila', 'brezo'],
      6: ['bosque', 'tronco'],
      7: ['arroyo', 'montaña'],
    },
  },
  {
    themeId: 'es-oceano',
    label: 'Océano',
    difficultyTier: 'A',
    wordsByLength: {
      4: ['olas', 'roca', 'caña'],
      5: ['coral', 'peces', 'barco'],
      6: ['tortuga', 'marina'],
      7: ['anclaje', 'ballena'],
    },
  },
  {
    themeId: 'es-cocina',
    label: 'Cocina',
    difficultyTier: 'B',
    wordsByLength: {
      4: ['sopa', 'arroz', 'maíz'],
      5: ['limón', 'azúcar', 'aceite'],
      6: ['tomate', 'tamaño'],
      7: ['recetas', 'cuchara'],
    },
  },
  {
    themeId: 'es-deportes',
    label: 'Deportes',
    difficultyTier: 'B',
    wordsByLength: {
      4: ['golf', 'yoga', 'nado'],
      5: ['rugby', 'tenis', 'carrera'],
      6: ['sprint', 'hockey'],
      7: ['medalla', 'campeón'],
    },
  },
  {
    themeId: 'es-espacio',
    label: 'Espacio',
    difficultyTier: 'C',
    wordsByLength: {
      4: ['luna', 'marte', 'polo'],
      5: ['cometa', 'astro', 'polar'],
      6: ['cohete', 'galaxia'],
      7: ['júpiter', 'planeta'],
    },
  },
  {
    themeId: 'es-musica',
    label: 'Música',
    difficultyTier: 'D',
    wordsByLength: {
      4: ['gong', 'nota', 'clave'],
      5: ['piano', 'violín', 'tempo'],
      6: ['cuerda', 'diseño'],
      7: ['melodía', 'musical'],
    },
  },
  {
    themeId: 'es-viaje',
    label: 'Viaje',
    difficultyTier: 'E',
    wordsByLength: {
      4: ['ruta', 'isla', 'mapa'],
      5: ['tren', 'hotel', 'señor'],
      6: ['viajar', 'camino'],
      7: ['jornada', 'turismo'],
    },
  },
] as const;
