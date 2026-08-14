import {
  DIRECTIONS,
  FILLER_ALPHABET,
  GAME_CONFIG,
  getGridMaskingPolicy,
  MAX_WORDS_PER_LENGTH,
  type WordLengthCompositionEntry,
} from '../config/index.js';
import { toDisplayUpperCase } from '../display/to-display-uppercase.js';
import { hasOverlappingPlacements, hasUniqueTargetWordOccurrences } from '../duplicate-detection/index.js';
import { normalizeWord } from '../normalization/index.js';
import { shuffleCopy } from '../random/index.js';
import type { DirectionDefinition, DirectionName } from '../types/direction.js';
import type { Coordinate } from '../types/coordinate.js';
import type { GridCell, GridData, GridMatrix } from '../types/grid.js';
import type { LanguageCode } from '../types/language.js';
import type { DifficultyTier } from '../types/difficulty.js';
import type { PlacedWord, ThemeWordSet, WordLength } from '../types/word.js';
import type { GameConfig } from '../config/game-config.js';

export type GridGenerationResult =
  | { success: true; grid: GridData }
  | { success: false; reason: GridGenerationFailureReason };

export type GridGenerationFailureReason =
  | 'invalid-word-set'
  | 'placement-impossible';

export const MAX_FILL_ATTEMPTS = 200;

/** Config inputs required to generate a Classic grid. */
export interface GenerateGridConfig {
  game: Pick<GameConfig, 'gridSize' | 'wordLengthComposition'>;
  directions: readonly DirectionDefinition[];
  fillerAlphabet: string;
}

export interface GenerateGridOptions {
  id: string;
  index: number;
  themeWordSet: ThemeWordSet;
  difficulty: DifficultyTier;
  language: LanguageCode;
  config?: GenerateGridConfig;
  /** Injectable RNG returning [0, 1). Defaults to `Math.random`. */
  random?: () => number;
}

interface WordCandidate {
  original: string;
  normalized: string;
  length: WordLength;
}

interface PendingPlacement {
  candidate: WordCandidate;
  direction: DirectionName;
  start: Coordinate;
  cells: Coordinate[];
}

export const DEFAULT_GRID_CONFIG: GenerateGridConfig = {
  game: {
    gridSize: GAME_CONFIG.gridSize,
    wordLengthComposition: GAME_CONFIG.wordLengthComposition,
  },
  directions: DIRECTIONS,
  fillerAlphabet: FILLER_ALPHABET,
};

/**
 * Generate a single 7×7 Classic grid with six non-overlapping placed words.
 */
export function generateGrid(options: GenerateGridOptions): GridGenerationResult {
  const config = options.config ?? DEFAULT_GRID_CONFIG;
  const random = options.random ?? Math.random;
  const { gridSize } = config.game;
  // fb#3e: a theme carries its own build-time-validated composition when the
  // standard shape doesn't fit its word pool (see
  // scripts/generate-word-lists.mjs); generateGrid never derives one live
  // from word counts, since an unvalidated shape can be slow or impossible to
  // place and this runs on every round.
  const wordLengthComposition = options.themeWordSet.wordLengthComposition ?? config.game.wordLengthComposition;

  if (config.directions.length !== GAME_CONFIG.wordsPerGrid) {
    return { success: false, reason: 'invalid-word-set' };
  }

  const buckets = buildWordBuckets(options.themeWordSet, options.language, random);
  if (!hasSufficientWords(buckets, wordLengthComposition)) {
    return { success: false, reason: 'invalid-word-set' };
  }

  // fb 260814/2d: like wordLengthComposition, only ever a build-time-baked,
  // pre-validated per-theme flag — never inferred live.
  const freeDirections = options.themeWordSet.allowFreeDirections ?? false;

  const combinations = [...selectWordCombinations(buckets, wordLengthComposition, random)];

  for (const selection of combinations) {
    const placement = backtrackPlacement(
      shuffleCopy(selection, random),
      shuffleCopy(config.directions, random),
      gridSize,
      random,
      freeDirections,
    );
    if (!placement) {
      continue;
    }

    const placedWords = toPlacedWords(options.id, placement, config.directions);

    for (let fillAttempt = 0; fillAttempt < MAX_FILL_ATTEMPTS; fillAttempt++) {
      const cells = buildCellMatrix(placedWords, gridSize, config.fillerAlphabet, random);

      const grid: GridData = {
        id: options.id,
        index: options.index,
        size: gridSize,
        themeId: options.themeWordSet.themeId,
        themeLabel: options.themeWordSet.label,
        difficulty: options.difficulty,
        cells,
        placedWords,
        maskingPolicy: getGridMaskingPolicy(options.index),
      };

      if (hasUniqueTargetWordOccurrences(grid, config.directions)) {
        return { success: true, grid };
      }
    }
  }

  return { success: false, reason: 'placement-impossible' };
}

function buildWordBuckets(
  theme: ThemeWordSet,
  language: LanguageCode,
  random: () => number,
): Map<WordLength, WordCandidate[]> {
  const buckets = new Map<WordLength, WordCandidate[]>();

  for (const original of theme.words) {
    const normalized = normalizeWord(original, language);
    const length = normalized.length as WordLength;
    const candidates = buckets.get(length) ?? [];
    candidates.push({ original, normalized, length });
    buckets.set(length, candidates);
  }

  for (const [length, candidates] of buckets) {
    buckets.set(length, shuffleCopy(candidates, random));
  }

  return buckets;
}

function hasSufficientWords(
  buckets: Map<WordLength, WordCandidate[]>,
  composition: readonly WordLengthCompositionEntry[],
): boolean {
  for (const { length, count } of composition) {
    if ((buckets.get(length)?.length ?? 0) < count) {
      return false;
    }
  }
  return true;
}

/** Bounds how many candidate 6-word selections are tried per grid before giving up. */
const MAX_WORD_COMBINATION_ATTEMPTS = 40;

/**
 * Randomly sample candidate word selections rather than enumerating every
 * possible combination — with real-sized theme pools (dozens of words per
 * length), the full Cartesian product can reach into the hundreds of millions
 * and exhausts memory. A bounded number of random samples is enough in
 * practice: `backtrackPlacement` only needs one selection that fits the grid.
 */
function* selectWordCombinations(
  buckets: Map<WordLength, WordCandidate[]>,
  composition: readonly WordLengthCompositionEntry[],
  random: () => number,
): Generator<WordCandidate[]> {
  const seen = new Set<string>();

  for (let attempt = 0; attempt < MAX_WORD_COMBINATION_ATTEMPTS; attempt++) {
    const selection = composition.flatMap(
      ({ length, count }) => shuffleCopy(buckets.get(length) ?? [], random).slice(0, count),
    );

    const key = selection
      .map((word) => word.normalized)
      .sort()
      .join('|');
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    yield selection;
  }
}

/**
 * Bounds a single strict-mode search. Most compositions place within a
 * handful of recursive calls; a composition that's geometrically borderline
 * (e.g. several same-length words competing for the same few valid
 * positions) can otherwise explore an enormous number of dead-end branches
 * before conceding defeat — observed taking 60-95 seconds for a single call
 * on some fb#3e candidate compositions. Capping node visits makes a failed
 * search fail fast and deterministically instead of scaling with how
 * pathological the word pool happens to be; generateGrid still retries with
 * up to MAX_WORD_COMBINATION_ATTEMPTS different word selections afterward.
 */
const MAX_BACKTRACK_SEARCH_NODES = 20_000;

/**
 * Free-direction search (fb 260814/2d) tries every direction per word instead
 * of one fixed direction per recursion level, so each node does up to ~6× the
 * work of a strict-mode node before conceding. Capped lower to keep
 * worst-case wall time in the same ballpark as MAX_BACKTRACK_SEARCH_NODES's
 * proven-acceptable strict-mode cap — an empirical starting point, not a
 * derived constant.
 */
const MAX_FREE_BACKTRACK_SEARCH_NODES = 5_000;

/**
 * Dispatches to strict (exactly one word per direction, the original
 * geometry) or free (any word may use any direction, gated per-theme by
 * ThemeWordSet.allowFreeDirections — see generateGrid) placement search.
 */
function backtrackPlacement(
  words: WordCandidate[],
  directions: readonly DirectionDefinition[],
  gridSize: number,
  random: () => number,
  freeDirections: boolean,
): PendingPlacement[] | null {
  return freeDirections
    ? searchFreeDirections(words, directions, gridSize, random)
    : searchStrictDirections(words, directions, gridSize, random);
}

function searchStrictDirections(
  words: WordCandidate[],
  directions: readonly DirectionDefinition[],
  gridSize: number,
  random: () => number,
): PendingPlacement[] | null {
  const occupied = new Set<string>();
  let nodesVisited = 0;

  function search(
    directionIndex: number,
    remaining: WordCandidate[],
    placements: PendingPlacement[],
  ): PendingPlacement[] | null {
    nodesVisited += 1;
    if (nodesVisited > MAX_BACKTRACK_SEARCH_NODES) {
      return null;
    }

    if (directionIndex === directions.length) {
      return placements;
    }

    const direction = directions[directionIndex];
    const orderedWords = shuffleCopy(remaining, random);

    for (const candidate of orderedWords) {
      const nextRemaining = remaining.filter((word) => word !== candidate);
      const starts = shuffleCopy(listCandidateStarts(candidate, direction, gridSize), random);

      for (const start of starts) {
        const cells = buildCellPath(start, direction, candidate.normalized.length, gridSize);
        if (!cells || !canOccupy(cells, occupied)) {
          continue;
        }

        occupy(cells, occupied);
        placements.push({
          candidate,
          direction: direction.name,
          start,
          cells,
        });

        const result = search(directionIndex + 1, nextRemaining, placements);
        if (result) {
          return result;
        }

        placements.pop();
        release(cells, occupied);
      }
    }

    return null;
  }

  return search(0, words, []);
}

/**
 * Same cell-overlap machinery as searchStrictDirections, but recurses over
 * word index rather than direction index: each word may try every direction
 * (re-shuffled per recursion node, same as the word order) instead of being
 * locked to one fixed direction slot. Two words legitimately sharing a
 * direction (different rows/columns/diagonals) is exactly the point — only
 * canOccupy's real cell-overlap check can reject a placement.
 */
function searchFreeDirections(
  words: WordCandidate[],
  directions: readonly DirectionDefinition[],
  gridSize: number,
  random: () => number,
): PendingPlacement[] | null {
  const occupied = new Set<string>();
  let nodesVisited = 0;

  function search(
    remaining: WordCandidate[],
    placements: PendingPlacement[],
  ): PendingPlacement[] | null {
    nodesVisited += 1;
    if (nodesVisited > MAX_FREE_BACKTRACK_SEARCH_NODES) {
      return null;
    }

    if (remaining.length === 0) {
      return placements;
    }

    const orderedWords = shuffleCopy(remaining, random);

    for (const candidate of orderedWords) {
      const nextRemaining = remaining.filter((word) => word !== candidate);
      const orderedDirections = shuffleCopy(directions, random);

      for (const direction of orderedDirections) {
        const starts = shuffleCopy(listCandidateStarts(candidate, direction, gridSize), random);

        for (const start of starts) {
          const cells = buildCellPath(start, direction, candidate.normalized.length, gridSize);
          if (!cells || !canOccupy(cells, occupied)) {
            continue;
          }

          occupy(cells, occupied);
          placements.push({
            candidate,
            direction: direction.name,
            start,
            cells,
          });

          const result = search(nextRemaining, placements);
          if (result) {
            return result;
          }

          placements.pop();
          release(cells, occupied);
        }
      }
    }

    return null;
  }

  return search(words, []);
}

function listCandidateStarts(
  word: WordCandidate,
  direction: DirectionDefinition,
  gridSize: number,
): Coordinate[] {
  const starts: Coordinate[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cells = buildCellPath({ row, col }, direction, word.normalized.length, gridSize);
      if (cells) {
        starts.push({ row, col });
      }
    }
  }

  return starts;
}

function buildCellPath(
  start: Coordinate,
  direction: DirectionDefinition,
  length: number,
  gridSize: number,
): Coordinate[] | null {
  const cells: Coordinate[] = [];

  for (let step = 0; step < length; step++) {
    const row = start.row + step * direction.rowDelta;
    const col = start.col + step * direction.colDelta;

    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
      return null;
    }

    cells.push({ row, col });
  }

  return cells;
}

function coordinateKey({ row, col }: Coordinate): string {
  return `${row},${col}`;
}

function canOccupy(cells: Coordinate[], occupied: Set<string>): boolean {
  return cells.every((cell) => !occupied.has(coordinateKey(cell)));
}

function occupy(cells: Coordinate[], occupied: Set<string>): void {
  for (const cell of cells) {
    occupied.add(coordinateKey(cell));
  }
}

function release(cells: Coordinate[], occupied: Set<string>): void {
  for (const cell of cells) {
    occupied.delete(coordinateKey(cell));
  }
}

function toPlacedWords(
  gridId: string,
  placements: PendingPlacement[],
  directions: readonly DirectionDefinition[],
): PlacedWord[] {
  const directionOrder = new Map(
    directions.map((direction, index) => [direction.name, index] as const),
  );

  // Keep metadata order stable by configured direction list; placement geometry is still random.
  const ordered = [...placements].sort(
    (left, right) =>
      (directionOrder.get(left.direction) ?? 0) - (directionOrder.get(right.direction) ?? 0),
  );

  return ordered.map((placement, index) => ({
    id: `${gridId}-word-${index + 1}`,
    text: placement.candidate.original,
    normalizedText: placement.candidate.normalized,
    length: placement.candidate.length,
    direction: placement.direction,
    start: placement.start,
    end: placement.cells[placement.cells.length - 1],
    cells: placement.cells,
    maskType: 'none' as const,
    found: false,
    findOrder: null,
    colorIndex: null,
  }));
}

function buildCellMatrix(
  placedWords: PlacedWord[],
  gridSize: number,
  fillerAlphabet: string,
  random: () => number,
): GridMatrix {
  const cells: GridMatrix = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, (): GridCell => ({ letter: '', wordId: null })),
  );

  for (const placedWord of placedWords) {
    for (let index = 0; index < placedWord.cells.length; index++) {
      const { row, col } = placedWord.cells[index];
      cells[row][col] = {
        letter: toDisplayUpperCase(placedWord.normalizedText[index]),
        wordId: placedWord.id,
      };
    }
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!cells[row][col].letter) {
        cells[row][col] = {
          letter: randomLetter(fillerAlphabet, random),
          wordId: null,
        };
      }
    }
  }

  return cells;
}

function randomLetter(alphabet: string, random: () => number): string {
  const index = Math.floor(random() * alphabet.length);
  return alphabet[index];
}

/** @internal Exported for tests. */
export function assertGeneratedGridInvariants(
  grid: GridData,
  config = DEFAULT_GRID_CONFIG,
  invariantOptions: { allowRepeatedDirections?: boolean } = {},
): void {
  const { gridSize } = config.game;

  if (grid.size !== gridSize || grid.cells.length !== gridSize) {
    throw new Error(`Expected ${gridSize}×${gridSize} grid`);
  }

  for (const row of grid.cells) {
    if (row.length !== gridSize) {
      throw new Error(`Expected ${gridSize}×${gridSize} grid`);
    }
  }

  if (grid.placedWords.length !== GAME_CONFIG.wordsPerGrid) {
    throw new Error(`Expected ${GAME_CONFIG.wordsPerGrid} placed words`);
  }

  const lengthCounts = new Map<WordLength, number>();
  const directions = new Set<DirectionName>();
  const validDirectionNames = new Set(config.directions.map((direction) => direction.name));

  for (const placedWord of grid.placedWords) {
    lengthCounts.set(placedWord.length, (lengthCounts.get(placedWord.length) ?? 0) + 1);
    directions.add(placedWord.direction);

    if (!validDirectionNames.has(placedWord.direction)) {
      throw new Error(`Unknown direction ${placedWord.direction}`);
    }

    if (placedWord.cells.length !== placedWord.length) {
      throw new Error('Cell path length does not match word length');
    }

    if (placedWord.end.row !== placedWord.cells[placedWord.cells.length - 1].row) {
      throw new Error('End coordinate mismatch');
    }

    if (
      placedWord.found !== false ||
      placedWord.maskType !== 'none' ||
      placedWord.findOrder !== null ||
      placedWord.colorIndex !== null
    ) {
      throw new Error(
        'Initial placed word state must be found=false, maskType=none, findOrder=null, colorIndex=null',
      );
    }

    for (const cell of placedWord.cells) {
      if (cell.row < 0 || cell.col < 0 || cell.row >= gridSize || cell.col >= gridSize) {
        throw new Error('Placed word cell out of bounds');
      }
    }
  }

  // fb#3e: composition varies per theme (see computeWordLengthComposition), so
  // there's no single fixed distribution to check exact equality against here
  // — only that no length exceeds the empirically-safe placement cap.
  for (const [length, count] of lengthCounts) {
    if (count > MAX_WORDS_PER_LENGTH[length]) {
      throw new Error(`Too many words of length ${length}: ${count} exceeds the placement cap of ${MAX_WORDS_PER_LENGTH[length]}`);
    }
  }

  if (!invariantOptions.allowRepeatedDirections) {
    if (directions.size !== config.directions.length) {
      throw new Error('Expected each direction to be used exactly once');
    }

    for (const direction of config.directions) {
      if (!directions.has(direction.name)) {
        throw new Error(`Missing direction ${direction.name}`);
      }
    }
  }

  if (hasOverlappingPlacements(grid.placedWords)) {
    throw new Error('Placed words overlap');
  }

  if (!hasUniqueTargetWordOccurrences(grid, config.directions)) {
    throw new Error('Target word appears more than once in grid');
  }

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (!grid.cells[row][col].letter) {
        throw new Error('Grid contains unfilled cells');
      }
    }
  }
}
