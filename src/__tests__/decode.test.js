/**
 * __tests__/decode.test.js
 */
import { describe, it, expect } from 'vitest';
import { decodeJWT } from '../core/decode.js';

// A known valid JWT (HS256, payload: { sub: "1234", name: "Test", iat: 1516239022 })
const VALID_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0IiwibmFtZSI6IlRlc3QiLCJpYXQiOjE1MTYyMzkwMjJ9.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

describe('decodeJWT', () => {
  it('decodes a valid JWT into header and payload', () => {
    const { header, payload } = decodeJWT(VALID_TOKEN);
    expect(header.alg).toBe('HS256');
    expect(header.typ).toBe('JWT');
    expect(payload.sub).toBe('1234');
    expect(payload.name).toBe('Test');
    expect(payload.iat).toBe(1516239022);
  });

  it('throws for an empty string', () => {
    expect(() => decodeJWT('')).toThrow('non-empty string');
  });

  it('throws for a non-string input', () => {
    expect(() => decodeJWT(null)).toThrow('non-empty string');
    expect(() => decodeJWT(123)).toThrow('non-empty string');
  });

  it('throws for a token with wrong number of parts', () => {
    expect(() => decodeJWT('only.two')).toThrow('3 parts');
    expect(() => decodeJWT('a.b.c.d')).toThrow('3 parts');
  });

  it('throws for base64 that is not valid JSON', () => {
    // Each dot-separated "part" is valid base64 but not JSON
    const bad = btoa('notjson') + '.' + btoa('alsonotjson') + '.' + btoa('sig');
    expect(() => decodeJWT(bad)).toThrow();
  });
});
