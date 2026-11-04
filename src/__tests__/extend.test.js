/**
 * __tests__/extend.test.js
 * Mocks KJUR.jws.JWS.sign so tests run without the CDN library.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSign = vi.fn(() => 'mocked.signed.token');

global.KJUR = {
  jws: {
    JWS: {
      sign: mockSign,
    },
  },
};

const { extendJWT } = await import('../core/extend.js');

// Helpers
function makeToken(payload) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesig`;
}

describe('extendJWT', () => {
  beforeEach(() => mockSign.mockClear());

  it('adds the specified seconds to a future expiry', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // expires in 1h
    const token = makeToken({ sub: '1', exp: futureExp, iat: futureExp - 3600 });

    extendJWT(token, 'secret', 86400); // add 1 day

    const [, , payloadStr] = mockSign.mock.calls[0];
    const signed = JSON.parse(payloadStr);
    expect(signed.exp).toBe(futureExp + 86400);
  });

  it('bases expiry on now when token is already expired', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 7200; // expired 2h ago
    const token = makeToken({ sub: '1', exp: pastExp, iat: pastExp - 3600 });

    extendJWT(token, 'secret', 3600); // add 1h

    const [, , payloadStr] = mockSign.mock.calls[0];
    const signed = JSON.parse(payloadStr);
    const now = Math.floor(Date.now() / 1000);
    // new exp should be approximately now + 3600 (within 5s tolerance)
    expect(signed.exp).toBeGreaterThanOrEqual(now + 3595);
    expect(signed.exp).toBeLessThanOrEqual(now + 3605);
  });

  it('handles tokens with no expiry (adds from now)', () => {
    const token = makeToken({ sub: '1' }); // no exp
    extendJWT(token, 'secret', 3600);

    const [, , payloadStr] = mockSign.mock.calls[0];
    const signed = JSON.parse(payloadStr);
    const now = Math.floor(Date.now() / 1000);
    expect(signed.exp).toBeGreaterThanOrEqual(now + 3595);
  });

  it('throws when secret is missing', () => {
    const token = makeToken({ sub: '1', exp: 9999999999 });
    expect(() => extendJWT(token, '', 3600)).toThrow('Secret is required');
  });

  it('throws when token is missing', () => {
    expect(() => extendJWT('', 'secret', 3600)).toThrow('Token is required');
  });

  it('returns the new token from KJUR.sign', () => {
    const token = makeToken({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 });
    const { newToken } = extendJWT(token, 'secret', 3600);
    expect(newToken).toBe('mocked.signed.token');
  });
});
