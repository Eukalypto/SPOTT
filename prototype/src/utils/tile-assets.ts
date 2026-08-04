import cellWhiteUrl from '../assets/cells/Cell White.png';
import cell01Url from '../assets/cells/Cell01.png';
import cell02Url from '../assets/cells/Cell02.png';
import cell03Url from '../assets/cells/Cell03.png';
import cell04Url from '../assets/cells/Cell04.png';
import cell05Url from '../assets/cells/Cell05.png';
import cell06Url from '../assets/cells/Cell06.png';

/** Default (unfound) grid cell tile — matches the Illustrator socket library. */
export const DEFAULT_CELL_TILE_URL = cellWhiteUrl;

/** Colored cell tiles, in the same red/orange/yellow/green/blue/purple order as {@link WORD_HIGHLIGHT_COLORS}. */
const CELL_COLOR_TILE_URLS: readonly string[] = [
  cell01Url,
  cell02Url,
  cell03Url,
  cell04Url,
  cell05Url,
  cell06Url,
];

/** Tile art for a grid cell; `colorIndex` selects a found-word color, or the default tile when absent. */
export function getCellTileUrl(colorIndex: number | null | undefined): string {
  if (colorIndex === null || colorIndex === undefined) {
    return DEFAULT_CELL_TILE_URL;
  }

  return CELL_COLOR_TILE_URLS[colorIndex] ?? DEFAULT_CELL_TILE_URL;
}

const letterModules = import.meta.glob('../assets/letters/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const LETTER_TILE_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(letterModules).map(([path, url]) => {
    const fileName = path.split('/').pop() ?? '';
    return [fileName.replace(/\.png$/i, '').toUpperCase(), url];
  }),
);

/** Letter glyph tile art for A–Z; returns undefined for characters without tile art (e.g. Ñ). */
export function getLetterTileUrl(letter: string): string | undefined {
  return LETTER_TILE_URLS[letter.toUpperCase()];
}
