# Word sets

Development word lists for Classic Practice live under `src/sample-data/`:

| Language | Code | Themes file | Word set export |
| --- | --- | --- | --- |
| English | `en` | `src/sample-data/english/themes.ts` | `ENGLISH_SAMPLE_WORD_SET` |
| French | `fr` | `src/sample-data/french/themes.ts` | `FRENCH_SAMPLE_WORD_SET` |
| Spanish | `es` | `src/sample-data/spanish/themes.ts` | `SPANISH_SAMPLE_WORD_SET` |

Register languages in `src/sample-data/index.ts` inside `SAMPLE_WORD_SETS`. The prototype and `generateRound` read word sets through `getSampleWordSet(language)`.

Each theme must supply enough words for one 7×7 grid: at least 2× length 4, 2× length 5, 1× length 6, and 1× length 7 (after normalization). Classic rounds also need tier coverage across the language set: 2× A, 2× B, 1× C, 1× D, 1× E themes.

## Validate word sets

After editing themes, run:

```bash
npm run validate:wordsets
```

This compiles the engine (`npm run build`) and runs `scripts/validate-wordsets.mjs`.

### Report format

For each registered language (`en`, `fr`, `es`) the command prints:

- **Language** — language code
- **Valid** — `yes` or `no`
- **Themes** — total theme count
- **Themes by tier** — counts for tiers A–E
- **Errors** — blocking issues, or `none`
- **Warnings** — non-blocking issues, or `none`

When every word set passes, the command prints `All sample word sets are valid (en, fr, es).` and exits with code **0**. If any word set fails, it prints `Validation failed: one or more sample word sets are invalid.` and exits with code **1**.

### What the validator checks

Validation reuses `validateLanguageWordSet` in `src/word-set-validation/validate-language-word-set.ts`. It does **not** duplicate rules in the CLI script.

For each language word set, the validator checks:

- Every word normalizes to a non-empty 4–7 letter form for that language
- No palindromes after normalization
- No duplicate normalized words within a theme
- No duplicate normalized words across themes in the same language
- Unique theme IDs
- Per-theme word-length minimums (2×4, 2×5, 1×6, 1×7)
- Difficulty-tier coverage for Classic (2×A, 2×B, 1×C, 1×D, 1×E)
- Minimum theme count (at least seven themes)
- Capacity warnings when a theme barely meets grid requirements

Report building and formatting live in `src/sample-data/validate-sample-word-sets.ts`. Automated tests are in `src/sample-data/validate-sample-word-sets.test.ts`.
