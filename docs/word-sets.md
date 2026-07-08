# Word sets

Development word lists for Classic Practice live under `src/sample-data/`:

| Language | Themes | Word set export |
| --- | --- | --- |
| English | `src/sample-data/english/themes.ts` | `ENGLISH_SAMPLE_WORD_SET` |
| French | `src/sample-data/french/themes.ts` | `FRENCH_SAMPLE_WORD_SET` |
| Spanish | `src/sample-data/spanish/themes.ts` | `SPANISH_SAMPLE_WORD_SET` |

Register new languages in `src/sample-data/index.ts` inside `SAMPLE_WORD_SETS`.

Each theme must supply enough words for one 7×7 grid: at least 2× length 4, 2× length 5, 1× length 6, and 1× length 7 (normalized). Classic rounds also need tier coverage: 2× A, 2× B, 1× C, 1× D, 1× E themes across the language set.

## Validate word sets

After editing themes, run:

```bash
npm run validate:wordsets
```

This compiles the engine and runs `scripts/validate-wordsets.mjs`, which prints a report for every registered language:

- validity
- theme count
- themes per difficulty tier
- validator errors and warnings

Validation uses `validateLanguageWordSet` from the engine (`src/word-set-validation/validate-language-word-set.ts`). The same checks run in `src/sample-data/validate-sample-word-sets.test.ts`.

Exit code is `1` when any registered word set is invalid.
