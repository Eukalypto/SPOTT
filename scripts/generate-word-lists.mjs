// Converts the designer-provided category word lists in docs/design/word-lists
// into validated SampleThemeWords TypeScript modules under src/sample-data.
//
// Run `npm run build` first (this imports the compiled engine from dist/ so
// normalization/palindrome/validation logic always matches the real runtime).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeWord } from '../dist/normalization/normalize-word.js';
import { isPalindromeNormalized } from '../dist/normalization/is-palindrome-normalized.js';
import { validateLanguageWordSet } from '../dist/word-set-validation/validate-language-word-set.js';
import { GAME_CONFIG } from '../dist/config/game-config.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIERS = ['A', 'B', 'C', 'D', 'E'];
const REQUIRED_COUNTS = Object.fromEntries(
  GAME_CONFIG.wordLengthComposition.map(({ length, count }) => [length, count]),
);

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

/** Build every candidate theme for a language, applying global cross-theme dedup on normalized words. */
function buildThemes(language) {
  const usedNormalized = new Map();
  const themes = [];

  for (const tier of TIERS) {
    const categories = loadTier(language, tier);

    for (const category of categories) {
      const themeId = `${language}-${tier.toLowerCase()}-${slugify(category.category)}`;
      const wordsByLength = { 4: [], 5: [], 6: [], 7: [] };

      for (const rawWord of category.words) {
        const normalized = normalizeWord(rawWord, language);
        if (normalized.length === 0 || !(normalized.length in wordsByLength)) {
          continue;
        }
        if (isPalindromeNormalized(normalized)) {
          continue;
        }
        if (usedNormalized.has(normalized)) {
          continue;
        }
        usedNormalized.set(normalized, themeId);
        wordsByLength[normalized.length].push(rawWord.trim());
      }

      const meetsMinimum = Object.entries(REQUIRED_COUNTS).every(
        ([length, required]) => wordsByLength[length].length >= required,
      );

      if (!meetsMinimum) {
        continue;
      }

      themes.push({
        themeId,
        label: category.category,
        difficultyTier: tier,
        wordsByLength,
      });
    }
  }

  return themes;
}

function toLanguageWordSetForValidation(language, themes) {
  return {
    language,
    themes: themes.map((theme) => ({
      themeId: theme.themeId,
      label: theme.label,
      difficultyTier: theme.difficultyTier,
      words: [4, 5, 6, 7].flatMap((length) => theme.wordsByLength[length]),
    })),
  };
}

function formatThemesTs(constantName, themes) {
  const entries = themes
    .map((theme) => {
      const byLength = [4, 5, 6, 7]
        .map((length) => `      ${length}: ${JSON.stringify(theme.wordsByLength[length])},`)
        .join('\n');
      return `  {\n    themeId: ${JSON.stringify(theme.themeId)},\n    label: ${JSON.stringify(theme.label)},\n    difficultyTier: ${JSON.stringify(theme.difficultyTier)},\n    wordsByLength: {\n${byLength}\n    },\n  },`;
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
  const themes = buildThemes(language);
  const wordSet = toLanguageWordSetForValidation(language, themes);
  const result = validateLanguageWordSet(wordSet);

  console.log(`\n=== ${language} ===`);
  console.log(`Themes generated: ${themes.length}`);
  const byTier = TIERS.map(
    (tier) => `${tier}=${themes.filter((theme) => theme.difficultyTier === tier).length}`,
  ).join(', ');
  console.log(`By tier: ${byTier}`);
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
