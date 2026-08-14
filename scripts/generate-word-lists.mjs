// Converts the designer-provided category word lists in docs/design/word-lists
// into validated SampleThemeWords TypeScript modules under src/sample-data.
//
// Run `npm run build` first (this imports the compiled engine from dist/ so
// normalization/palindrome/validation/grid-generation logic always matches
// the real runtime).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeWord } from '../dist/normalization/normalize-word.js';
import { isPalindromeNormalized } from '../dist/normalization/is-palindrome-normalized.js';
import { validateLanguageWordSet } from '../dist/word-set-validation/validate-language-word-set.js';
import { computeWordLengthComposition } from '../dist/config/word-length-composition.js';
import { generateGrid } from '../dist/grid-generation/generate-grid.js';
import { GAME_CONFIG } from '../dist/config/game-config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIERS = ['A', 'B', 'C', 'D', 'E'];
const REQUIRED_COUNTS = Object.fromEntries(
  GAME_CONFIG.wordLengthComposition.map(({ length, count }) => [length, count]),
);

// fb#3e: a computed composition that differs from the standard shape is only
// ever trusted after it reliably produces a real, placeable grid — this
// mirrors the threshold used in the original feasibility study.
const VALIDATION_TRIALS = 30;
// Live rounds never retry a failed grid generation — a composition that
// fails even occasionally in validation WILL eventually fail a real player's
// round. Only a composition with zero observed failures across every trial
// is trusted; anything else falls back to the standard shape (if the theme
// has one) or is excluded.
const VALIDATION_SUCCESS_THRESHOLD = 1;

function slugify(label) {
  return label
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadTier(language, tier) {
  const filePath = path.join(root, 'docs/design/word-lists', language, `${tier}.json`);
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function compositionsEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  const byLength = new Map(a.map((entry) => [entry.length, entry.count]));
  return b.every((entry) => byLength.get(entry.length) === entry.count);
}

// A genuinely infeasible composition doesn't fail fast — generateGrid
// exhausts up to 40 word combinations, each with a full backtracking search,
// before conceding. Once enough trials have failed that the success
// threshold is mathematically out of reach, stop early rather than grinding
// through the remaining (equally doomed, equally slow) trials.
const MAX_FAILURES_BEFORE_ABORT = VALIDATION_TRIALS - Math.ceil(VALIDATION_TRIALS * VALIDATION_SUCCESS_THRESHOLD);

// Backstop for the case the failure-count abort doesn't catch: a composition
// that mostly succeeds but where every individual attempt (success or
// failure) is expensive. This can't preempt a single in-flight generateGrid
// call (synchronous, single-threaded), but it stops the NEXT trial from
// starting once a theme has already eaten an unreasonable amount of wall
// time, bounding the whole script's worst case to roughly
// (non-standard theme count) × this budget instead of being unbounded.
const MAX_VALIDATION_MS_PER_THEME = 10_000;

/** Run real grid-generation trials to confirm a proposed composition is actually placeable, not just arithmetically valid. */
function empiricallyValidateComposition(themeId, label, difficultyTier, wordsByLength, composition, language, freeDirections = false) {
  const words = [4, 5, 6, 7].flatMap((length) => wordsByLength[length]);
  const themeWordSet = {
    themeId,
    label,
    difficultyTier,
    words,
    wordLengthComposition: composition,
    ...(freeDirections ? { allowFreeDirections: true } : {}),
  };

  let successes = 0;
  let failures = 0;
  let trialsRun = 0;
  const startedAt = Date.now();

  for (let trial = 0; trial < VALIDATION_TRIALS; trial++) {
    trialsRun += 1;
    const result = generateGrid({
      id: `validate-${themeId}-${trial}`,
      index: 0,
      themeWordSet,
      difficulty: difficultyTier,
      language,
    });

    if (result.success) {
      successes += 1;
    } else {
      failures += 1;
      if (failures > MAX_FAILURES_BEFORE_ABORT) {
        break;
      }
    }

    if (Date.now() - startedAt > MAX_VALIDATION_MS_PER_THEME) {
      break;
    }
  }

  return successes / trialsRun;
}

/**
 * Build every candidate theme for a language, then decide each theme's
 * word-length composition (fb#3e):
 * - Themes whose computed composition already equals the standard shape use
 *   it directly, unchanged from pre-3e behavior.
 * - Themes whose computed composition differs (either because the standard
 *   shape doesn't fit, or because a bucket was merged away for variety) are
 *   only included with that composition if it empirically survives repeated
 *   real grid-generation trials; a theme that already had a working standard
 *   shape falls back to it instead of losing the theme outright.
 * - Themes with no viable composition at all, standard or otherwise, are
 *   excluded and reported.
 *
 * Categories are NOT deduped against each other (fb 260814/2d): an earlier
 * design claimed a word for whichever category was processed first (tier
 * order, then array order), which silently hollowed out narrower categories
 * (e.g. "Birds", "Metals") in favor of broader ones that legitimately
 * overlap them (e.g. "Animals", "Chemical Elements") — those categories
 * turned out to have plenty of real words, just none left to claim. The
 * accepted tradeoff is a small chance the same target word appears in two
 * different grids within one round.
 */
function buildThemes(language) {
  const themes = [];
  const excluded = [];
  const flexible = [];

  for (const tier of TIERS) {
    const categories = loadTier(language, tier);

    for (const category of categories) {
      const themeId = `${language}-${tier.toLowerCase()}-${slugify(category.category)}`;
      const wordsByLength = { 4: [], 5: [], 6: [], 7: [] };
      const seenInCategory = new Set();

      for (const rawWord of category.words) {
        const normalized = normalizeWord(rawWord, language);
        if (normalized.length === 0 || !(normalized.length in wordsByLength)) {
          continue;
        }
        if (isPalindromeNormalized(normalized)) {
          continue;
        }
        if (seenInCategory.has(normalized)) {
          continue;
        }
        seenInCategory.add(normalized);
        wordsByLength[normalized.length].push(rawWord.trim());
      }

      const available = {
        4: wordsByLength[4].length,
        5: wordsByLength[5].length,
        6: wordsByLength[6].length,
        7: wordsByLength[7].length,
      };
      const meetsStandard = Object.entries(REQUIRED_COUNTS).every(
        ([length, required]) => available[length] >= required,
      );
      const candidate = computeWordLengthComposition(available);

      if (!candidate) {
        excluded.push({
          label: category.category,
          tier,
          reason: 'no composition can assemble a full grid',
          available,
        });
        continue;
      }

      const isStandard = compositionsEqual(candidate, GAME_CONFIG.wordLengthComposition);

      if (isStandard) {
        themes.push({ themeId, label: category.category, difficultyTier: tier, wordsByLength });
        continue;
      }

      const successRate = empiricallyValidateComposition(
        themeId,
        category.category,
        tier,
        wordsByLength,
        candidate,
        language,
      );

      if (successRate >= VALIDATION_SUCCESS_THRESHOLD) {
        themes.push({
          themeId,
          label: category.category,
          difficultyTier: tier,
          wordsByLength,
          wordLengthComposition: candidate,
        });
        flexible.push({ label: category.category, tier, composition: candidate, successRate });
        continue;
      }

      // fb 260814/2d: strict placement (exactly one word per direction)
      // failed — retry the SAME composition with free directions, which
      // removes the forced single-cell overlaps that make multiple
      // same-length long words hard to place under strict geometry.
      const freeSuccessRate = empiricallyValidateComposition(
        themeId,
        category.category,
        tier,
        wordsByLength,
        candidate,
        language,
        true,
      );

      if (freeSuccessRate >= VALIDATION_SUCCESS_THRESHOLD) {
        themes.push({
          themeId,
          label: category.category,
          difficultyTier: tier,
          wordsByLength,
          wordLengthComposition: candidate,
          allowFreeDirections: true,
        });
        flexible.push({
          label: category.category,
          tier,
          composition: candidate,
          successRate: freeSuccessRate,
          allowFreeDirections: true,
        });
        continue;
      }

      if (meetsStandard) {
        // Neither strict nor free-direction placement held up for the
        // flexible/variety composition, but the plain standard shape already
        // works fine for this theme — keep it rather than lose an
        // otherwise-good category.
        themes.push({ themeId, label: category.category, difficultyTier: tier, wordsByLength });
        continue;
      }

      excluded.push({
        label: category.category,
        tier,
        reason: `composition ${candidate.map((entry) => `${entry.count}×${entry.length}`).join(', ')} only placed successfully in ${Math.round(successRate * 100)}% of ${VALIDATION_TRIALS} trials strict / ${Math.round(freeSuccessRate * 100)}% free-direction (needs ${Math.round(VALIDATION_SUCCESS_THRESHOLD * 100)}%)`,
        available,
      });
    }
  }

  return { themes, excluded, flexible };
}

function toLanguageWordSetForValidation(language, themes) {
  return {
    language,
    themes: themes.map((theme) => ({
      themeId: theme.themeId,
      label: theme.label,
      difficultyTier: theme.difficultyTier,
      words: [4, 5, 6, 7].flatMap((length) => theme.wordsByLength[length]),
      ...(theme.wordLengthComposition ? { wordLengthComposition: theme.wordLengthComposition } : {}),
      ...(theme.allowFreeDirections ? { allowFreeDirections: true } : {}),
    })),
  };
}

function formatThemesTs(constantName, themes) {
  const entries = themes
    .map((theme) => {
      const byLength = [4, 5, 6, 7]
        .map((length) => `      ${length}: ${JSON.stringify(theme.wordsByLength[length])},`)
        .join('\n');
      const compositionField = theme.wordLengthComposition
        ? `\n    wordLengthComposition: ${JSON.stringify(theme.wordLengthComposition)},`
        : '';
      const freeDirectionsField = theme.allowFreeDirections ? `\n    allowFreeDirections: true,` : '';
      return `  {\n    themeId: ${JSON.stringify(theme.themeId)},\n    label: ${JSON.stringify(theme.label)},\n    difficultyTier: ${JSON.stringify(theme.difficultyTier)},\n    wordsByLength: {\n${byLength}\n    },${compositionField}${freeDirectionsField}\n  },`;
    })
    .join('\n');

  return `import type { SampleThemeWords } from '../types.js';

/**
 * Generated from docs/design/word-lists — do not hand-edit.
 * Regenerate with \`node scripts/generate-word-lists.mjs\` after the source
 * JSON files change (rebuild the engine first: \`npm run build\`).
 */
export const ${constantName}: readonly SampleThemeWords[] = [
${entries}
];
`;
}

function generateForLanguage(language, constantName, outFile) {
  const { themes, excluded, flexible } = buildThemes(language);
  const wordSet = toLanguageWordSetForValidation(language, themes);
  const result = validateLanguageWordSet(wordSet);

  console.log(`\n=== ${language} ===`);
  console.log(`Themes generated: ${themes.length}`);
  const byTier = TIERS.map(
    (tier) => `${tier}=${themes.filter((theme) => theme.difficultyTier === tier).length}`,
  ).join(', ');
  console.log(`By tier: ${byTier}`);

  if (flexible.length > 0) {
    console.log(`Flexible compositions (fb#3e), ${flexible.length}:`);
    for (const entry of flexible) {
      const shape = entry.composition.map((e) => `${e.count}×${e.length}`).join(', ');
      const freeNote = entry.allowFreeDirections ? ' (free directions)' : '';
      console.log(`  [${entry.tier}] ${entry.label}: ${shape}${freeNote} (${Math.round(entry.successRate * 100)}% placement success)`);
    }
  }

  if (excluded.length > 0) {
    console.log(`Excluded categories, ${excluded.length}:`);
    for (const entry of excluded) {
      console.log(`  [${entry.tier}] ${entry.label}: ${entry.reason} (available 4:${entry.available[4]} 5:${entry.available[5]} 6:${entry.available[6]} 7:${entry.available[7]})`);
    }
  }

  console.log(`Valid: ${result.isValid}`);
  if (result.errors.length > 0) {
    console.log(`Errors (${result.errors.length}):`);
    result.errors.slice(0, 20).forEach((error) => console.log(`  - ${error}`));
    if (result.errors.length > 20) {
      console.log(`  ...and ${result.errors.length - 20} more`);
    }
  }

  if (!result.isValid) {
    throw new Error(`${language} generated word set failed validation`);
  }

  writeFileSync(path.join(root, outFile), formatThemesTs(constantName, themes));
  console.log(`Wrote ${outFile}`);
}

generateForLanguage('en', 'ENGLISH_WORD_LIST_THEMES', 'src/sample-data/english/word-lists.ts');
generateForLanguage('fr', 'FRENCH_WORD_LIST_THEMES', 'src/sample-data/french/word-lists.ts');
