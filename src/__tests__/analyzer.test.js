/**
 * __tests__/analyzer.test.js
 * One group of tests per rule: a token that should trigger it, and one that should not.
 */
import { describe, it, expect } from 'vitest';
import { analyzeToken, scoreToLevel } from '../core/analyzer.js';

const NOW = 1_800_000_000;

// A well-configured token: nothing should be flagged except "not verified".
const goodHeader  = { alg: 'HS256', typ: 'JWT' };
const goodPayload = { sub: 'u1', iss: 'tokenguard', aud: 'app', jti: 'abc', iat: NOW, exp: NOW + 600 };

function run(overrides = {}) {
  return analyzeToken({ header: goodHeader, payload: goodPayload, now: NOW, ...overrides });
}
function ids(result) {
  return result.findings.map((f) => f.id);
}
function find(result, id) {
  return result.findings.find((f) => f.id === id);
}

describe('clean token', () => {
  it('only reports that the signature was not verified', () => {
    const r = run();
    expect(ids(r)).toEqual(['SIG_UNVERIFIED']);
    expect(r.score).toBe(0);
    expect(r.level).toBe('Low');
  });

  it('reports nothing when the signature verifies', () => {
    const r = run({ signature: { checked: true, valid: true } });
    expect(r.findings).toEqual([]);
  });
});

describe('finding shape', () => {
  it('every finding has all six fields filled in', () => {
    const r = analyzeToken({
      header: { alg: 'none', kid: '1', jku: 'x' },
      payload: { password: 'p' },
      weakSecret: 'secret',
      now: NOW,
    });
    expect(r.findings.length).toBeGreaterThan(3);
    for (const f of r.findings) {
      for (const key of ['id', 'title', 'severity', 'description', 'recommendation', 'reference']) {
        expect(typeof f[key]).toBe('string');
        expect(f[key].length).toBeGreaterThan(0);
      }
    }
  });
});

describe('algorithm rules', () => {
  it('flags alg "none" as critical', () => {
    const r = run({ header: { alg: 'none', typ: 'JWT' } });
    expect(find(r, 'ALG_NONE').severity).toBe('critical');
  });

  it('flags "None" in any letter case', () => {
    expect(ids(run({ header: { alg: 'NoNe' } }))).toContain('ALG_NONE');
  });

  it('flags a missing alg', () => {
    expect(ids(run({ header: { typ: 'JWT' } }))).toContain('ALG_NONE');
  });

  it('does not flag HS256', () => {
    expect(ids(run())).not.toContain('ALG_NONE');
  });

  it('flags a weak HMAC secret as critical', () => {
    const r = run({ weakSecret: 'secret' });
    expect(find(r, 'WEAK_SECRET').severity).toBe('critical');
    expect(find(r, 'WEAK_SECRET').description).toContain('secret');
  });

  it('ignores weakSecret for non-HMAC algorithms', () => {
    const r = run({ header: { alg: 'RS256', typ: 'JWT' }, weakSecret: 'secret' });
    expect(ids(r)).not.toContain('WEAK_SECRET');
  });

  it('flags algorithm confusion: HS256 token with a PEM key', () => {
    expect(find(run({ keyIsPem: true }), 'ALG_CONFUSION').severity).toBe('critical');
  });

  it('does not flag a PEM key on an RS256 token', () => {
    const r = run({ header: { alg: 'RS256', typ: 'JWT' }, keyIsPem: true });
    expect(ids(r)).not.toContain('ALG_CONFUSION');
  });

  it('flags a missing typ as low', () => {
    const r = run({ header: { alg: 'HS256' } });
    expect(find(r, 'TYP_MISSING').severity).toBe('low');
  });
});

describe('header injection rules', () => {
  it.each(['jku', 'x5u', 'jwk'])('flags "%s" as high', (h) => {
    const r = run({ header: { ...goodHeader, [h]: 'https://evil.example/keys' } });
    expect(find(r, `HEADER_${h.toUpperCase()}`).severity).toBe('high');
  });

  it('flags "kid" as medium', () => {
    const r = run({ header: { ...goodHeader, kid: 'key-1' } });
    expect(find(r, 'HEADER_KID').severity).toBe('medium');
  });

  it('flags nothing when none of them are present', () => {
    expect(ids(run()).filter((i) => i.startsWith('HEADER_'))).toEqual([]);
  });
});

describe('signature rules', () => {
  it('flags an invalid signature as critical', () => {
    const r = run({ signature: { checked: true, valid: false } });
    expect(find(r, 'SIG_INVALID').severity).toBe('critical');
    expect(ids(r)).not.toContain('SIG_UNVERIFIED');
  });

  it('does not flag a valid signature', () => {
    const r = run({ signature: { checked: true, valid: true } });
    expect(ids(r)).not.toContain('SIG_INVALID');
    expect(ids(r)).not.toContain('SIG_UNVERIFIED');
  });

  it('reports "not verified" as info when no key is given', () => {
    expect(find(run(), 'SIG_UNVERIFIED').severity).toBe('info');
  });
});

describe('time rules', () => {
  it('flags an expired token as high', () => {
    const r = run({ payload: { ...goodPayload, exp: NOW - 10 } });
    expect(find(r, 'EXPIRED').severity).toBe('high');
  });

  it('does not flag a token that has not expired', () => {
    expect(ids(run())).not.toContain('EXPIRED');
  });

  it('flags a missing exp as high', () => {
    const { exp, ...noExp } = goodPayload;
    const r = run({ payload: noExp });
    expect(find(r, 'NO_EXP').severity).toBe('high');
  });

  it('flags a lifetime over 24 hours as low', () => {
    const r = run({ payload: { ...goodPayload, exp: NOW + 3 * 86400 } });
    expect(find(r, 'LONG_LIFETIME').severity).toBe('low');
  });

  it('flags a lifetime over 1 year as medium', () => {
    const r = run({ payload: { ...goodPayload, exp: NOW + 2 * 365 * 86400 } });
    expect(find(r, 'LONG_LIFETIME').severity).toBe('medium');
  });

  it('does not flag a lifetime of exactly 24 hours', () => {
    const r = run({ payload: { ...goodPayload, exp: NOW + 86400 } });
    expect(ids(r)).not.toContain('LONG_LIFETIME');
  });

  it('flags exp earlier than iat', () => {
    const r = run({ payload: { ...goodPayload, iat: NOW, exp: NOW - 100 } });
    expect(ids(r)).toContain('EXP_BEFORE_IAT');
  });

  it('flags nbf in the future', () => {
    const r = run({ payload: { ...goodPayload, nbf: NOW + 500 } });
    expect(find(r, 'NBF_FUTURE').severity).toBe('medium');
  });

  it('does not flag nbf in the past', () => {
    const r = run({ payload: { ...goodPayload, nbf: NOW - 500 } });
    expect(ids(r)).not.toContain('NBF_FUTURE');
  });

  it('flags iat in the future', () => {
    const r = run({ payload: { ...goodPayload, iat: NOW + 500, exp: NOW + 1000 } });
    expect(find(r, 'IAT_FUTURE').severity).toBe('medium');
  });

  it('ignores time claims that are not numbers', () => {
    const r = run({ payload: { ...goodPayload, exp: 'tomorrow' } });
    expect(ids(r)).toContain('NO_EXP');
  });
});

describe('identity claim rules', () => {
  it('flags a missing iss as medium', () => {
    const { iss, ...rest } = goodPayload;
    expect(find(run({ payload: rest }), 'MISSING_ISS').severity).toBe('medium');
  });

  it('flags a missing aud as medium', () => {
    const { aud, ...rest } = goodPayload;
    expect(find(run({ payload: rest }), 'MISSING_AUD').severity).toBe('medium');
  });

  it('flags a missing jti as low', () => {
    const { jti, ...rest } = goodPayload;
    expect(find(run({ payload: rest }), 'MISSING_JTI').severity).toBe('low');
  });

  it('does not flag them when present', () => {
    const r = run();
    for (const id of ['MISSING_ISS', 'MISSING_AUD', 'MISSING_JTI']) {
      expect(ids(r)).not.toContain(id);
    }
  });
});

describe('sensitive data rule', () => {
  it('flags a password field as high', () => {
    const r = run({ payload: { ...goodPayload, password: 'hunter2' } });
    expect(find(r, 'SENSITIVE_DATA').severity).toBe('high');
  });

  it('flags only an email field as medium', () => {
    const r = run({ payload: { ...goodPayload, email: 'a@b.com' } });
    expect(find(r, 'SENSITIVE_DATA').severity).toBe('medium');
  });

  it('matches field names in any letter case', () => {
    const r = run({ payload: { ...goodPayload, UserPassword: 'x' } });
    expect(ids(r)).toContain('SENSITIVE_DATA');
  });

  it('does not flag ordinary fields', () => {
    expect(ids(run())).not.toContain('SENSITIVE_DATA');
  });
});

describe('scoring', () => {
  it('adds up the weights: high (25) + medium (10) = 35', () => {
    const { iss, ...noIss } = goodPayload;
    const r = run({ payload: { ...noIss, iat: NOW - 100, exp: NOW - 10 } }); // EXPIRED high + MISSING_ISS medium
    expect(r.score).toBe(35);
    expect(r.level).toBe('Medium');
  });

  it('caps the score at 100', () => {
    const r = run({
      header: { alg: 'none' },
      payload: { password: 'x' },
      weakSecret: 'secret',
      signature: { checked: true, valid: false },
    });
    expect(r.score).toBe(100);
    expect(r.level).toBe('Critical');
  });

  it('counts findings per severity', () => {
    const r = run({ header: { alg: 'none', typ: 'JWT' } });
    expect(r.counts.critical).toBe(1);
    expect(r.counts.info).toBe(1);
  });

  it('sorts findings from most to least severe', () => {
    const r = analyzeToken({ header: { alg: 'none' }, payload: {}, now: NOW });
    const order = ['critical', 'high', 'medium', 'low', 'info'];
    const positions = r.findings.map((f) => order.indexOf(f.severity));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it.each([
    [0, 'Low'], [19, 'Low'], [20, 'Medium'], [49, 'Medium'],
    [50, 'High'], [79, 'High'], [80, 'Critical'], [100, 'Critical'],
  ])('maps score %i to %s', (score, level) => {
    expect(scoreToLevel(score)).toBe(level);
  });
});