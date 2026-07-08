import {
  formatAllWordSetValidationReports,
  hasValidationFailures,
  validateAllSampleWordSets,
} from '../dist/sample-data/validate-sample-word-sets.js';

const reports = validateAllSampleWordSets();

console.log(formatAllWordSetValidationReports(reports));

process.exit(hasValidationFailures(reports) ? 1 : 0);
