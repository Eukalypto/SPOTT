import {
  formatValidationCommandOutput,
  getWordSetValidationExitCode,
  validateAllSampleWordSets,
} from '../dist/sample-data/validate-sample-word-sets.js';

const reports = validateAllSampleWordSets();

console.log(formatValidationCommandOutput(reports));

process.exit(getWordSetValidationExitCode(reports));
