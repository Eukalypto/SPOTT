import { DIFFICULTY_TIERS, type DifficultyTier } from '../types/difficulty.js';
import { LANGUAGE_CODES, type LanguageCode } from '../types/language.js';
import type { LanguageWordSet } from '../types/word.js';
import { validateLanguageWordSet } from '../word-set-validation/validate-language-word-set.js';
import { ENGLISH_SAMPLE_WORD_SET } from './english/index.js';
import { FRENCH_SAMPLE_WORD_SET } from './french/index.js';
import { SPANISH_SAMPLE_WORD_SET } from './spanish/index.js';

const REGISTERED_SAMPLE_WORD_SETS: Readonly<Record<LanguageCode, LanguageWordSet>> = {
  en: ENGLISH_SAMPLE_WORD_SET,
  fr: FRENCH_SAMPLE_WORD_SET,
  es: SPANISH_SAMPLE_WORD_SET,
};

export interface WordSetValidationReport {
  language: LanguageCode;
  isValid: boolean;
  themeCount: number;
  themesByTier: Readonly<Record<DifficultyTier, number>>;
  errors: readonly string[];
  warnings: readonly string[];
}

/** Summarize validator output for one {@link LanguageWordSet}. */
export function buildWordSetValidationReport(wordSet: LanguageWordSet): WordSetValidationReport {
  const result = validateLanguageWordSet(wordSet);

  return {
    language: wordSet.language,
    isValid: result.isValid,
    themeCount: wordSet.themes.length,
    themesByTier: countThemesByTier(wordSet.themes),
    errors: result.errors,
    warnings: result.warnings,
  };
}

/** Validate every registered sample word set. */
export function validateAllSampleWordSets(): WordSetValidationReport[] {
  return LANGUAGE_CODES.filter((language) => language in REGISTERED_SAMPLE_WORD_SETS).map(
    (language) => buildWordSetValidationReport(REGISTERED_SAMPLE_WORD_SETS[language]),
  );
}

export function hasValidationFailures(reports: readonly WordSetValidationReport[]): boolean {
  return reports.some((report) => !report.isValid);
}

/** Human-readable report for a single language word set. */
export function formatWordSetValidationReport(report: WordSetValidationReport): string {
  const lines = [
    `Language: ${report.language}`,
    `Valid: ${report.isValid ? 'yes' : 'no'}`,
    `Themes: ${report.themeCount}`,
    `Themes by tier: ${formatThemesByTier(report.themesByTier)}`,
  ];

  if (report.errors.length > 0) {
    lines.push('Errors:');
    for (const error of report.errors) {
      lines.push(`  - ${error}`);
    }
  } else {
    lines.push('Errors: none');
  }

  if (report.warnings.length > 0) {
    lines.push('Warnings:');
    for (const warning of report.warnings) {
      lines.push(`  - ${warning}`);
    }
  } else {
    lines.push('Warnings: none');
  }

  return lines.join('\n');
}

/** Human-readable report for all registered sample word sets. */
export function formatAllWordSetValidationReports(reports: readonly WordSetValidationReport[]): string {
  return reports.map(formatWordSetValidationReport).join('\n\n');
}

function countThemesByTier(
  themes: LanguageWordSet['themes'],
): Readonly<Record<DifficultyTier, number>> {
  const counts: Record<DifficultyTier, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

  for (const theme of themes) {
    counts[theme.difficultyTier]++;
  }

  return counts;
}

function formatThemesByTier(themesByTier: Readonly<Record<DifficultyTier, number>>): string {
  return DIFFICULTY_TIERS.map((tier) => `${tier}=${themesByTier[tier]}`).join(', ');
}
