export {
  DIFFICULTY_SEQUENCE,
  FILLER_ALPHABET,
  GAME_CONFIG,
  MAX_WORD_LENGTH,
  MIN_WORD_LENGTH,
  ROUND_DURATION_MS,
  WORD_LENGTH_COMPOSITION,
  WORD_LENGTH_DISTRIBUTION,
  type GameConfig,
  type WordLengthCompositionEntry,
} from './game-config.js';

export {
  DIFFICULTY_PROFILES,
  getDifficultyForGridIndex,
  getDifficultyProfile,
  type DifficultyProfile,
} from './difficulty-config.js';

export {
  DIRECTIONS,
  DIRECTION_BY_NAME,
  DIRECTION_NAMES,
  getDirection,
  type DirectionConfig,
} from './directions-config.js';

export {
  GRID_MASKING_POLICIES,
  assertGridMaskingPoliciesValid,
  getGridMaskingPolicy,
  getUnmaskedWordCount,
} from './masking-config.js';
