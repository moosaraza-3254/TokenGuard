/**
 * scripts/evaluate.mjs
 * Run with:  npm run evaluate
 * Prints the evaluation table and writes docs/evaluation.md
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { SAMPLES } from '../src/core/samples.js';
import { evaluateSample } from '../src/core/evaluate.js';
import { hmacSign, hmacVerify } from './nodeCrypto.mjs';

const results = SAMPLES.map((s) => evaluateSample(s, { sign: hmacSign, verify: hmacVerify }));

const rows = results.map((r, i) => {
  const expected = r.sample.expect.length ? r.sample.expect.join(', ') : '(none)';
  const detected = r.sample.clean
    ? (r.falsePositives.length ? `False positives: ${r.falsePositives.join(', ')}` : 'No findings (correct)')
    : (r.missing.length ? `MISSED: ${r.missing.join(', ')}` : 'Yes');
  return `| ${i + 1} | ${r.sample.name} | ${r.sample.weakness} | ${expected} | ${detected} | ${r.analysis.score} | ${r.analysis.level} | ${r.passed ? 'PASS' : 'FAIL'} |`;
});

const weak = results.filter((r) => !r.sample.clean);
const detectedCount = weak.filter((r) => r.missing.length === 0).length;
const control = results.find((r) => r.sample.clean);

const md = [
  '# TokenGuard evaluation results',
  '',
  `Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`,
  '',
  '| # | Sample token | Deliberate weakness | Expected rule(s) | Detected | Score | Level | Result |',
  '|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  `- **Detection rate:** ${detectedCount} of ${weak.length} weak samples had every expected finding reported.`,
  `- **False positives on the control token:** ${control ? control.falsePositives.length : 'n/a'}.`,
  `- **Overall:** ${results.filter((r) => r.passed).length} of ${results.length} samples passed.`,
  '',
].join('\n');

mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });
writeFileSync(new URL('../docs/evaluation.md', import.meta.url), md);
console.log(md);
process.exit(results.every((r) => r.passed) ? 0 : 1);