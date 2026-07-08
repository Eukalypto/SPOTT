import { describe, expect, it } from 'vitest';
import { validateLanguageWordSet } from '../word-set-validation/validate-language-word-set.js';
import { ENGLISH_SAMPLE_WORD_SET } from './english/index.js';
import { SAMPLE_WORD_SETS } from './index.js';
import {
  buildWordSetValidationReport,
  formatAllWordSetValidationReports,
  formatWordSetValidationReport,
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

    expect(formatted).toContain('Language: en');
    expect(formatted).toContain('Valid: yes');
    expect(formatted).toContain('Themes: 7');
    expect(formatted).toContain('Themes by tier: A=2, B=2, C=1, D=1, E=1');
    expect(formatted).toContain('Errors: none');
  });

  it('formats all reports with blank lines between languages', () => {
    const formatted = formatAllWordSetValidationReports(validateAllSampleWordSets());

    expect(formatted).toContain('Language: en');
    expect(formatted).toContain('Language: fr');
    expect(formatted).toContain('Language: es');
    expect(formatted.split('\n\n')).toHaveLength(3);
  });
});
