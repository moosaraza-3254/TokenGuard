/**
 * __tests__/report.test.js
 */
import { describe, it, expect } from 'vitest';
import { buildReport, redactPayload, reportFilename } from '../core/report.js';
import { analyzeToken } from '../core/analyzer.js';

const NOW = 1_800_000_000;
const header = { alg: 'HS256', typ: 'JWT' };
const payload = { sub: 'u1', email: 'victim@example.com', password: 'hunter2', exp: NOW - 5 };

function makeReport() {
  const analysis = analyzeToken({ header, payload, weakSecret: 'hunter42', now: NOW });
  return buildReport({ analysis, header, payload, signatureValid: null, date: new Date('2026-11-05T00:00:00Z') });
}
function pdfText(doc) {
  return Buffer.from(doc.output('arraybuffer')).toString('latin1');
}

describe('redactPayload', () => {
  it('hides values of sensitive fields and keeps the rest', () => {
    const r = redactPayload(payload);
    expect(r.email).toBe('[hidden]');
    expect(r.password).toBe('[hidden]');
    expect(r.sub).toBe('u1');
  });

  it('handles a missing payload', () => {
    expect(redactPayload(undefined)).toEqual({});
  });
});

describe('buildReport', () => {
  it('produces a PDF', () => {
    const doc = makeReport();
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(pdfText(doc).startsWith('%PDF-')).toBe(true);
  });

  it('contains the score, level and finding titles', () => {
    const t = pdfText(makeReport());
    expect(t).toContain('TokenGuard');
    expect(t).toContain('Weak HMAC secret');
    expect(t).toContain('Recommendation');
  });

  it('never includes hidden values or a signature', () => {
    const t = pdfText(makeReport());
    expect(t).not.toContain('victim@example.com');
    expect(t).not.toContain('hunter2');
    expect(t).not.toContain('hunter42');
    expect(t).toContain('REDACTED');
  });

  it('copes with a token with no findings and with non-Latin text', () => {
    const analysis = analyzeToken({
      header, payload: { iss: 'a', aud: 'b', jti: 'c', iat: NOW, exp: NOW + 60, name: '\u4e2d\u6587' },
      signature: { checked: true, valid: true }, now: NOW,
    });
    const doc = buildReport({ analysis, header, payload: { name: '\u4e2d\u6587' }, signatureValid: true });
    expect(pdfText(doc)).toContain('No findings');
  });

  it('spreads very long reports over several pages', () => {
    const many = { header: { alg: 'none', kid: 'x', jku: 'x', jwk: 'x', x5u: 'x' }, payload: { password: 'p' }, weakSecret: 'secret', now: NOW };
    const analysis = analyzeToken(many);
    const longPayload = Object.fromEntries(Array.from({ length: 120 }, (_, i) => [`claim${i}`, i]));
    const doc = buildReport({ analysis, header: many.header, payload: longPayload, signatureValid: false });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });
});

describe('reportFilename', () => {
  it('includes the date', () => {
    expect(reportFilename(new Date('2026-11-05T10:00:00Z'))).toBe('tokenguard-report-2026-11-05.pdf');
  });
});