import {
  DIRECTIONS,
  FILLER_ALPHABET,
  GAME_CONFIG,
  getGridMaskingPolicy,
  type WordLengthCompositionEntry,
} from '../config/index.js';
import { hasOverlappingPlacements, hasUniqueTargetWordOccurrences } from '../duplicate-detection/index.js';
import { normalizeWord } from '../normalization/index.js';
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
  const { gridSize, wordLengthComposition } = config.game;

  if (config.directions.length !== GAME_CONFIG.wordsPerGrid) {
    return { success: false, reason: 'invalid-word-set' };
  }

  const buckets = buildWordBuckets(options.themeWordSet, options.language);
  if (!hasSufficientWords(buckets, wordLengthComposition)) {
    return { success: false, reason: 'invalid-word-set' };
  }

  for (const selection of selectWordCombinations(buckets, wordLengthComposition)) {
    const placement = backtrackPlacement(selection, config.directions, gridSize);
    if (!placement) {
      continue;
    }

    const placedWords = toPlacedWords(options.id, placement);

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
): Map<WordLength, WordCandidate[]> {
  const buckets = new Map<WordLength, WordCandidate[]>();

  for (const original of theme.words) {
    const normalized = normalizeWord(original, language);
    const length = normalized.length as WordLength;
    const candidates = buckets.get(length) ?? [];
    candidates.push({ original, normalized, length });
    buckets.set(length, candidates);
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

function* selectWordCombinations(
  buckets: Map<WordLength, WordCandidate[]>,
  composition: readonly WordLengthCompositionEntry[],
): Generator<WordCandidate[]> {
  const groups = composition.map(({ length, count }) =>
    choose(buckets.get(length) ?? [], count),
  );

  function* combine(groupIndex: number, selected: WordCandidate[]): Generator<WordCandidate[]> {
    if (groupIndex === groups.length) {
      yield selected;
      return;
    }

    for (const group of groups[groupIndex]) {
      yield* combine(groupIndex + 1, [...selected, ...group]);
    }
  }

  yield* combine(0, []);
}

function choose(items: WordCandidate[], count: number): WordCandidate[][] {
  if (count === 0) {
    return [[]];
  }
  if (count > items.length) {
    return [];
  }

  const results: WordCandidate[][] = [];

  function backtrack(start: number, picked: WordCandidate[]): void {
    if (picked.length === count) {
      results.push([...picked]);
      return;
    }

    for (let i = start; i <= items.length - (count - picked.length); i++) {
      picked.push(items[i]);
      backtrack(i + 1, picked);
      picked.pop();
    }
  }

  backtrack(0, []);
  return results;
}

function backtrackPlacement(
  words: WordCandidate[],
  directions: readonly DirectionDefinition[],
  gridSize: number,
): PendingPlacement[] | null {
  const occupied = new Set<string>();

  function search(
    directionIndex: number,
    remaining: WordCandidate[],
    placements: PendingPlacement[],
  ): PendingPlacement[] | null {
    if (directionIndex === directions.length) {
      return placements;
    }

    const direction = directions[directionIndex];

    for (let wordIndex = 0; wordIndex < remaining.length; wordIndex++) {
      const candidate = remaining[wordIndex];
      const nextRemaining = remaining.filter((_, index) => index !== wordIndex);

      for (const start of candidateStarts(candidate, direction, gridSize)) {
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

function* candidateStarts(
  word: WordCandidate,
  direction: DirectionDefinition,
  gridSize: number,
): Generator<Coordinate> {
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cells = buildCellPath({ row, col }, direction, word.normalized.length, gridSize);
      if (cells) {
        yield { row, col };
      }
    }
  }
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

function toPlacedWords(gridId: string, placements: PendingPlacement[]): PlacedWord[] {
  return placements.map((placement, index) => ({
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
        letter: placedWord.normalizedText[index].toUpperCase(),
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
export function assertGeneratedGridInvariants(grid: GridData, config = DEFAULT_GRID_CONFIG): void {
  const { gridSize, wordLengthComposition } = config.game;

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

  for (const placedWord of grid.placedWords) {
    lengthCounts.set(placedWord.length, (lengthCounts.get(placedWord.length) ?? 0) + 1);
    directions.add(placedWord.direction);

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

  for (const { length, count } of wordLengthComposition) {
    if ((lengthCounts.get(length) ?? 0) !== count) {
      throw new Error(`Expected ${count} words of length ${length}`);
    }
  }

  if (directions.size !== config.directions.length) {
    throw new Error('Expected each direction to be used exactly once');
  }

  for (const direction of config.directions) {
    if (!directions.has(direction.name)) {
      throw new Error(`Missing direction ${direction.name}`);
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
