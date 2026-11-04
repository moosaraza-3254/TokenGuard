/**
 * __tests__/samples.test.js
 * Every sample token must trigger its expected rule, and the control token must trigger nothing.
 */
import { describe, it, expect } from 'vitest';
import { SAMPLES, buildSampleToken } from '../core/samples.js';
import { evaluateSample } from '../core/evaluate.js';
import { hmacSign, hmacVerify } from '../../scripts/nodeCrypto.mjs';

const env = { sign: hmacSign, verify: hmacVerify, now: 1_800_000_000 };

describe('sample tokens', () => {
  it.each(SAMPLES.map((s) => [s.name, s]))('%s', (_name, sample) => {
    const r = evaluateSample(sample, env);
    expect(r.missing).toEqual([]);
    expect(r.falsePositives).toEqual([]);
  });

  it('the control token scores 0', () => {
    const control = SAMPLES.find((s) => s.clean);
    expect(evaluateSample(control, env).analysis.score).toBe(0);
  });

  it('has unique ids', () => {
    const ids = SAMPLES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('builds a three-part token for every sample', () => {
    for (const s of SAMPLES) {
      expect(buildSampleToken(s, hmacSign, 1_800_000_000).split('.')).toHaveLength(3);
    }
  });

  it('only the weak-secret sample uses a guessable secret', () => {
    const weak = SAMPLES.filter((s) => evaluateSample(s, env).found.includes('WEAK_SECRET'));
    expect(weak.map((s) => s.id)).toEqual(['weak-secret']);
  });
});