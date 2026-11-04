/**
 * __tests__/weakSecrets.test.js
 */
import { describe, it, expect, vi } from 'vitest';
import { findWeakSecret, COMMON_SECRETS } from '../core/weakSecrets.js';

describe('findWeakSecret', () => {
  it('returns the secret when one from the list verifies', () => {
    const verify = (_t, s) => s === 'password';
    expect(findWeakSecret('a.b.c', 'HS256', verify)).toBe('password');
  });

  it('returns null when none verify', () => {
    expect(findWeakSecret('a.b.c', 'HS256', () => false)).toBeNull();
  });

  it('skips non-HMAC algorithms without trying any secret', () => {
    const verify = vi.fn(() => true);
    expect(findWeakSecret('a.b.c', 'RS256', verify)).toBeNull();
    expect(verify).not.toHaveBeenCalled();
  });

  it('skips a missing algorithm', () => {
    expect(findWeakSecret('a.b.c', undefined, () => true)).toBeNull();
  });

  it('keeps going if the verify function throws', () => {
    const verify = (_t, s) => {
      if (s === COMMON_SECRETS[0]) throw new Error('boom');
      return s === COMMON_SECRETS[1];
    };
    expect(findWeakSecret('a.b.c', 'HS256', verify)).toBe(COMMON_SECRETS[1]);
  });

  it('the list contains no empty strings', () => {
    expect(COMMON_SECRETS.every((s) => s.length > 0)).toBe(true);
  });
});