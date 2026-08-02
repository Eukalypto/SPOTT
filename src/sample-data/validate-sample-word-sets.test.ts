import { describe, expect, it } from 'vitest';
import { DIFFICULTY_TIERS } from '../types/difficulty.js';
import { validateLanguageWordSet } from '../word-set-validation/validate-language-word-set.js';
import { ENGLISH_SAMPLE_WORD_SET } from './english/index.js';
import { FRENCH_SAMPLE_WORD_SET } from './french/index.js';
import { SPANISH_SAMPLE_WORD_SET } from './spanish/index.js';
import { SAMPLE_WORD_SETS } from './index.js';
import {
  buildWordSetValidationReport,
  formatAllWordSetValidationReports,
  formatValidationCommandOutput,
  formatWordSetValidationReport,
  getWordSetValidationExitCode,
  hasValidationFailures,
  validateAllSampleWordSets,
} from './validate-sample-word-sets.js';

describe('validate-sample-word-sets', () => {
  it('reports validation results for every registered sample word set', () => {
    const reports = validateAllSampleWordSets();

    expect(reports).toHaveLength(Object.keys(SAMPLE_WORD_SETS).length);
    expect(reports.map((report) => report.language)).toEqual(['en', 'fr', 'es']);

    for (const report of reports) {
      expect(report.themeCount).toBeGreaterThanOrEqual(7);
      expect(report.themesByTier.A).toBeGreaterThanOrEqual(2);
      expect(report.themesByTier.B).toBeGreaterThanOrEqual(2);
      expect(report.themesByTier.C).toBeGreaterThanOrEqual(1);
      expect(report.themesByTier.D).toBeGreaterThanOrEqual(1);
      expect(report.themesByTier.E).toBeGreaterThanOrEqual(1);
    }
  });

  it('validates the same languages registered in SAMPLE_WORD_SETS', () => {
    expect(validateAllSampleWordSets().map((report) => report.language)).toEqual(
      Object.keys(SAMPLE_WORD_SETS),
    );
  });

  it('marks all current sample word sets as valid', () => {
    const reports = validateAllSampleWordSets();

    expect(hasValidationFailures(reports)).toBe(false);
    for (const report of reports) {
      expect(report.isValid).toBe(true);
      expect(report.errors).toEqual([]);
    }
  });

  it('validates the French sample word set', () => {
    const report = buildWordSetValidationReport(FRENCH_SAMPLE_WORD_SET);

    expect(report.language).toBe('fr');
    expect(report.isValid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(validateLanguageWordSet(FRENCH_SAMPLE_WORD_SET).isValid).toBe(true);
  });

  it('validates the Spanish sample word set', () => {
    const report = buildWordSetValidationReport(SPANISH_SAMPLE_WORD_SET);

    expect(report.language).toBe('es');
    expect(report.isValid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(validateLanguageWordSet(SPANISH_SAMPLE_WORD_SET).isValid).toBe(true);
  });

  it('reuses validateLanguageWordSet without duplicating rules', () => {
    const direct = validateLanguageWordSet(ENGLISH_SAMPLE_WORD_SET);
    const report = buildWordSetValidationReport(ENGLISH_SAMPLE_WORD_SET);

    expect(report.isValid).toBe(direct.isValid);
    expect(report.errors).toEqual(direct.errors);
    expect(report.warnings).toEqual(direct.warnings);
  });

  it('formats language, validity, tier counts, errors, and warnings', () => {
    const report = buildWordSetValidationReport(ENGLISH_SAMPLE_WORD_SET);
    const formatted = formatWordSetValidationReport(report);
    const tierCounts = DIFFICULTY_TIERS.map(
      (tier) => `${tier}=${report.themesByTier[tier]}`,
    ).join(', ');

    expect(formatted).toContain('Language: en');
    expect(formatted).toContain('Valid: yes');
    expect(formatted).toContain(`Themes: ${report.themeCount}`);
    expect(formatted).toContain(`Themes by tier: ${tierCounts}`);
    expect(formatted).toContain('Errors: none');
  });

  it('formats all reports with blank lines between languages', () => {
    const formatted = formatAllWordSetValidationReports(validateAllSampleWordSets());

    expect(formatted).toContain('Language: en');
    expect(formatted).toContain('Language: fr');
    expect(formatted).toContain('Language: es');
    expect(formatted.split('\n\n')).toHaveLength(3);
  });

  it('adds a success line when every registered word set is valid', () => {
    const reports = validateAllSampleWordSets();
    const output = formatValidationCommandOutput(reports);

    expect(output).toContain('All sample word sets are valid (en, fr, es).');
    expect(getWordSetValidationExitCode(reports)).toBe(0);
  });

  it('adds a failure line and non-zero exit code when a word set is invalid', () => {
    const reports = [
      buildWordSetValidationReport(ENGLISH_SAMPLE_WORD_SET),
      {
        language: 'fr',
        isValid: false,
        themeCount: 0,
        themesByTier: { A: 0, B: 0, C: 0, D: 0, E: 0 },
        errors: ['example failure'],
        warnings: ['example warning'],
      },
    ];

    const output = formatValidationCommandOutput(reports);

    expect(output).toContain('Validation failed: one or more sample word sets are invalid.');
    expect(output).toContain('example failure');
    expect(output).toContain('example warning');
    expect(getWordSetValidationExitCode(reports)).toBe(1);
  });
});
