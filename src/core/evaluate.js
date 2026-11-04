/**
 * core/evaluate.js
 * Runs a sample through the same pipeline the app uses and checks the result.
 */
import { decodeJWT } from './decode.js';
import { analyzeToken } from './analyzer.js';
import { findWeakSecret } from './weakSecrets.js';
import { buildSampleToken } from './samples.js';

/**
 * @param {object} sample
 * @param {{ sign: Function, verify: (token:string, secret:string, alg:string) => boolean, now?: number }} env
 */
export function evaluateSample(sample, { sign, verify, now = Math.floor(Date.now() / 1000) }) {
  const token = buildSampleToken(sample, sign, now);
  const { header, payload } = decodeJWT(token);

  const key = sample.secret || '';
  const weakSecret = findWeakSecret(token, header.alg, verify);
  const signature = key ? { checked: true, valid: verify(token, key, header.alg) } : null;

  const analysis = analyzeToken({
    header, payload, signature, weakSecret,
    keyIsPem: key.includes('-----BEGIN'),
    now,
  });

  const found = analysis.findings.map((f) => f.id);
  const missing = sample.expect.filter((id) => !found.includes(id));
  // For the control sample, ANY finding is a false positive.
  const falsePositives = sample.clean ? found : [];

  return { sample, token, analysis, found, missing, falsePositives, passed: missing.length === 0 && falsePositives.length === 0 };
}